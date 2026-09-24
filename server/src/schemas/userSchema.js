const { z } = require('zod');

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'CASHIER'], {
      required_error: 'Role is required',
      invalid_type_error: 'Role must be either ADMIN or CASHIER'
    }),
  }),
});

const toggleUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    isActive: z.boolean({
      required_error: 'isActive status is required',
      invalid_type_error: 'isActive must be a boolean'
    }),
  }),
});

module.exports = {
  createUserSchema,
  toggleUserSchema
};
