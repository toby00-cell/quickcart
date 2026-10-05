const { z } = require('zod');
const { isValidLocation } = require('../utils/delivery');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

const idParam = z.object({ id: objectId });
const productIdParam = z.object({ productId: objectId });

const password = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const register = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address'),
  password,
  phone: z.string().trim().min(7).max(20).optional(),
});

const login = z.object({
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const updateProfile = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  address: z
    .object({ street: z.string().trim(), city: z.string().trim(), state: z.string().trim() })
    .partial()
    .optional(),
});

const category = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2).max(60),
  description: z.string().trim().max(300).optional(),
});

const productBase = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  price: z.number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' }).positive('Price must be greater than 0'),
  stock: z.number({ invalid_type_error: 'Stock must be a number' }).int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
  category: objectId,
  icon: z.string().trim().max(8, 'Icon must be a single emoji').optional(),
  imageUrl: z.string().trim().url('Image URL must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});
const productCreate = productBase;
const productUpdate = productBase.partial();

const productQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: objectId.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const cartAdd = z.object({
  productId: objectId,
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(100).default(1),
});
const cartUpdate = z.object({
  quantity: z.number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' }).int().min(1, 'Quantity must be at least 1').max(100),
});

const checkout = z.object({
  shippingAddress: z
    .object({
      fullName: z.string({ required_error: 'Full name is required' }).trim().min(2, 'Enter the recipient name'),
      phone: z.string({ required_error: 'Phone is required' }).trim().min(7, 'Enter a valid phone number').max(20),
      street: z.string({ required_error: 'Street address is required' }).trim().min(5, 'Enter the full street address').max(300),
      state: z.string({ required_error: 'State is required' }).trim(),
      lga: z.string({ required_error: 'LGA is required' }).trim(),
    })
    .superRefine((a, ctx) => {
      if (!isValidLocation(a.state, a.lga)) {
        ctx.addIssue({ code: 'custom', path: ['lga'], message: 'Choose a valid state and LGA' });
      }
    }),
});

const trackParam = z.object({ code: z.string().trim().min(5, 'Enter a tracking code').max(40) });

const orderQuery = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']).optional(),
  search: z.string().trim().max(60).optional(),
  from: z.coerce.date({ invalid_type_error: 'Invalid from date' }).optional(),
  to: z.coerce.date({ invalid_type_error: 'Invalid to date' }).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const orderStatus = z.object({
  status: z.enum(['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Status must be one of: confirmed, preparing, out_for_delivery, delivered, cancelled' }),
  }),
});

const paymentInitiate = z.object({
  orderId: objectId,
  method: z.enum(['card', 'bank_transfer', 'pay_on_delivery']).default('card'),
});

const paymentConfirm = z.object({
  reference: z.string({ required_error: 'Reference is required' }).min(5),
  outcome: z.enum(['success', 'failed'], { errorMap: () => ({ message: 'Outcome must be success or failed' }) }),
});

module.exports = {
  idParam, productIdParam, register, login, updateProfile, category,
  productCreate, productUpdate, productQuery, cartAdd, cartUpdate,
  checkout, trackParam, orderQuery, orderStatus, paymentInitiate, paymentConfirm,
};
