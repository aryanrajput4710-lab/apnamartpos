const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Search customer by phone or name
const searchCustomers = async (req, res) => {
  try {
    const { q = '' } = req.query;
    
    // Normalize phone (strip non-digits for searching if we want, but for now simple ILIKE)
    const normalizedQ = q.replace(/[^a-zA-Z0-9]/g, ''); // basic stripping if needed, but simple contains is fine

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { phone: { contains: q } },
          { name: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 20
    });

    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error('Search customer error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create a new customer
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    // Basic normalization: remove spaces, dashes
    const normalizedPhone = phone.replace(/[\s-]/g, '');

    // Check if customer exists
    const existing = await prisma.customer.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'Customer with this phone already exists', 
        data: existing 
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: normalizedPhone,
        email,
        address
      }
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    } : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orders: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.customer.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer by id error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCustomerOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { customerId: id };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { payments: true, items: true }
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
    console.error('Get customer orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  searchCustomers,
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomerOrders
};
