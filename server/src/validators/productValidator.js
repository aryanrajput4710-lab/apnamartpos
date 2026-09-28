const { z } = require('zod');

const variantSchema = z.object({
  color: z.string().optional(),
  size: z.string().optional(),
  netQuantity: z.string().optional(),
  costPrice: z.coerce.number().min(0),
  mrp: z.coerce.number().positive('MRP must be positive'),
  sellingPrice: z.coerce.number().positive('Selling price must be positive'),
  discountType: z.enum(['NONE', 'PERCENTAGE', 'FIXED']).default('NONE'),
  discountValue: z.coerce.number().min(0).default(0),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  sku: z.string().optional()
});

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(200),
    description: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    variants: z.array(variantSchema).optional()
  })
});

module.exports = { createProductSchema };
