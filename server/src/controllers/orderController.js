const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const paymentMethod = req.query.paymentMethod;
    const paymentStatus = req.query.paymentStatus;
    const orderStatus = req.query.orderStatus;
    
    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } }
      ];
    }

    if (orderStatus) where.status = orderStatus;
    
    if (paymentMethod || paymentStatus) {
      where.payments = { some: {} };
      if (paymentMethod) where.payments.some.method = paymentMethod;
      if (paymentStatus) where.payments.some.status = paymentStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          payments: true,
          user: { select: { name: true } },
          _count: { select: { items: true } }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: true,
        items: true,
        user: { select: { name: true } }
      }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const returnOrderItems = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { items } = req.body; 

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items selected for return' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    let totalRefundAmount = 0;
    const validatedItems = [];
    for (const returnItem of items) {
      const orderItem = order.items.find(i => i.id === returnItem.orderItemId);
      if (!orderItem) throw new Error('Item not found in order');
      if (returnItem.quantity <= 0) continue;
      if (orderItem.quantity - orderItem.returnedQty < returnItem.quantity) {
        throw new Error('Cannot return more than purchased for ' + orderItem.productNameSnapshot);
      }
      
      const refundAmount = parseFloat(orderItem.unitPrice) * returnItem.quantity;
      totalRefundAmount += refundAmount;
      validatedItems.push({
        orderItemId: orderItem.id,
        variantId: orderItem.variantId,
        quantity: returnItem.quantity,
        reason: returnItem.reason || 'Customer Return',
        refundAmount
      });
    }

    if (validatedItems.length === 0) {
       return res.status(400).json({ success: false, message: 'Invalid return quantities' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const returnRecords = [];
      for (const item of validatedItems) {
        const record = await tx.returnRecord.create({
          data: {
            orderId,
            orderItemId: item.orderItemId,
            variantId: item.variantId,
            quantity: item.quantity,
            reason: item.reason,
            refundAmount: item.refundAmount,
            createdBy: req.user.id
          }
        });
        returnRecords.push(record);

        await tx.orderItem.update({
          where: { id: item.orderItemId },
          data: { returnedQty: { increment: item.quantity } }
        });

        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } }
        });

        await tx.inventoryTransaction.create({
          data: {
            variantId: item.variantId,
            type: 'SALE_RETURN',
            quantity: item.quantity,
            previousStock: variant.stock,
            newStock: variant.stock + item.quantity,
            reason: item.reason,
            referenceType: 'RETURN',
            referenceId: record.id,
            createdBy: req.user.id
          }
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          refundedAmount: { increment: totalRefundAmount },
          status: 'PARTIAL_RETURN'
        },
        include: { items: true, returns: true }
      });

      const allReturned = updatedOrder.items.every(i => i.quantity === i.returnedQty);
      if (allReturned) {
        await tx.order.update({ where: { id: orderId }, data: { status: 'RETURNED' }});
      }

      return updatedOrder;
    });

    res.status(200).json({ success: true, data: result, message: 'Return processed successfully' });
  } catch (error) {
    console.error('Return error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};


const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, returns: true }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await prisma.$transaction(async (tx) => {
      // 1. Restore Stock for items that haven't been returned yet
      for (const item of order.items) {
        const remainingToRestore = item.quantity - item.returnedQty;
        if (remainingToRestore > 0) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: remainingToRestore } }
          });
        }
      }

      // 2. Delete Inventory Transactions
      await tx.inventoryTransaction.deleteMany({
        where: { referenceType: 'ORDER', referenceId: order.id }
      });
      // Also delete inventory transactions for returns linked to this order
      for (const ret of order.returns) {
        await tx.inventoryTransaction.deleteMany({
          where: { referenceType: 'RETURN', referenceId: ret.id }
        });
      }

      // 3. Delete Return Records
      await tx.returnRecord.deleteMany({ where: { orderId: order.id } });

      // 4. Delete Payments
      await tx.payment.deleteMany({ where: { orderId: order.id } });

      // 5. Delete Order Items
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });

      // 6. Delete Audit Logs
      await tx.auditLog.deleteMany({ where: { entityType: 'ORDER', entityId: order.id } });

      // 7. Deduct from Customer if applicable
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalOrders: { decrement: 1 },
            totalSpent: { decrement: order.total }
          }
        });
      }

      // 8. Delete the Order
      await tx.order.delete({ where: { id: order.id } });
    });

    res.json({ success: true, message: 'Order and associated records completely deleted' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order: ' + error.message });
  }
};

module.exports = {
  deleteOrder,
  getOrders,
  getOrderById,
  returnOrderItems
};

