const { z } = require('zod');

const variantSchema = z.object({
  color: z.string().optional(),
  size: z.string().optional(),
  netQuantity: z.string().optional(),
  costPrice: z.number().min(0),
  mrp: z.number().positive('MRP must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  discountType: z.enum(['NONE', 'PERCENTAGE', 'FIXED']).default('NONE'),
  discountValue: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional()
});

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  variants: z.array(variantSchema).optional()
});

module.exports = { createProductSchema };
