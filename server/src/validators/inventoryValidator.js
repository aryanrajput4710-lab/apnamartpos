const { z } = require('zod');

const stockActionSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().optional()
});

const adjustStockSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  physicalStock: z.number().int().min(0, 'Stock cannot be negative'),
  reason: z.string().optional()
});

module.exports = { stockActionSchema, adjustStockSchema };
