const fs = require('fs');

let controller = fs.readFileSync('server/src/controllers/inventoryController.js', 'utf8');

const batchStockInFn = `
const batchStockIn = async (req, res) => {
  try {
    const { items, reference } = req.body;
    
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }});
        const oldQty = variant.stock;
        const oldCost = parseFloat(variant.costPrice || 0);
        const newQty = parseInt(item.quantity);
        const landedCost = parseFloat(item.unitLandedCost);
        
        let newWAC = oldCost;
        if (oldQty + newQty > 0) {
          if (oldQty <= 0) {
            newWAC = landedCost;
          } else {
            newWAC = ((oldQty * oldCost) + (newQty * landedCost)) / (oldQty + newQty);
          }
        }
        
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: { increment: newQty },
            costPrice: newWAC
          }
        });
        
        await tx.inventoryTransaction.create({
          data: {
            variantId: variant.id,
            type: 'STOCK_IN',
            quantity: newQty,
            reference: reference || 'BATCH_RESTOCK',
            userId: req.user.id
          }
        });
      }
    });
    
    res.json({ success: true, message: 'Batch restock successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
`;

controller = controller.replace("module.exports = {", batchStockInFn);
controller = controller.replace("module.exports = {\n", "module.exports = {\n  batchStockIn,\n");
fs.writeFileSync('server/src/controllers/inventoryController.js', controller);

let routes = fs.readFileSync('server/src/routes/inventoryRoutes.js', 'utf8');
const newRoute = "router.post('/batch-stock-in', inventoryController.batchStockIn);\nmodule.exports = router;";
routes = routes.replace("module.exports = router;", newRoute);
fs.writeFileSync('server/src/routes/inventoryRoutes.js', routes);

