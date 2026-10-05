process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongo;
let adminToken;
let customerToken;
let category;
let product;

const address = { fullName: 'Ada Obi', phone: '08012345678', street: '12 Market Road', state: 'Lagos', lga: 'Ikeja' };
const abujaAddress = { ...address, state: 'FCT - Abuja', lga: require('../src/data/locations.json')['FCT - Abuja'][0] };
const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin1234', role: 'admin' });
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin1234' })).body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Auth', () => {
  it('registers a customer and never returns the password', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Ada Obi', email: 'ada@test.com', password: 'Passw0rd1', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.role).toBe('customer'); // role cannot be self-assigned
    customerToken = res.body.data.token;
  });

  it('rejects weak passwords and invalid emails', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Bob', email: 'nope', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
  });

  it('rejects duplicate emails', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Ada Obi', email: 'ada@test.com', password: 'Passw0rd1' });
    expect(res.status).toBe(409);
  });

  it('rejects wrong credentials with a clear message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ada@test.com', password: 'wrongpass1' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('protects private routes', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/cart')).status).toBe(401);
  });
});

describe('Products & categories', () => {
  it('blocks customers from admin actions', async () => {
    const res = await request(app).post('/api/categories').set(auth(customerToken)).send({ name: 'Rice Dishes' });
    expect(res.status).toBe(403);
  });

  it('lets admin create category and product', async () => {
    const c = await request(app).post('/api/categories').set(auth(adminToken)).send({ name: 'Rice Dishes' });
    expect(c.status).toBe(201);
    category = c.body.data;
    const p = await request(app).post('/api/products').set(auth(adminToken)).send({ name: 'Jollof Rice & Chicken', description: 'Party jollof with grilled chicken', price: 25000, stock: 5, icon: '🍛', category: category._id });
    expect(p.status).toBe(201);
    product = p.body.data;
  });

  it('validates product input', async () => {
    const res = await request(app).post('/api/products').set(auth(adminToken)).send({ name: 'Bad', price: -5, stock: 1, category: 'abc' });
    expect(res.status).toBe(400);
  });

  it('supports search, filter and pagination', async () => {
    const res = await request(app).get(`/api/products?search=jollof&category=${category._id}&page=1&limit=5`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('returns 404 for unknown product and 400 for bad id', async () => {
    expect((await request(app).get('/api/products/64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
    expect((await request(app).get('/api/products/not-an-id')).status).toBe(400);
  });
});

describe('Cart → Order → Payment', () => {
  let order;
  let payment;

  it('adds to cart and blocks over-stock quantities', async () => {
    const ok = await request(app).post('/api/cart/items').set(auth(customerToken)).send({ productId: product._id, quantity: 2 });
    expect(ok.status).toBe(201);
    expect(ok.body.data.totalAmount).toBe(50000);
    const tooMany = await request(app).post('/api/cart/items').set(auth(customerToken)).send({ productId: product._id, quantity: 10 });
    expect(tooMany.status).toBe(400);
  });

  it('rejects checkout with missing address or an LGA that is not in the state', async () => {
    const res = await request(app).post('/api/orders').set(auth(customerToken)).send({});
    expect(res.status).toBe(400);
    const bad = await request(app).post('/api/orders').set(auth(customerToken)).send({ shippingAddress: { ...address, lga: 'Not A Real LGA' } });
    expect(bad.status).toBe(400);
  });

  it('places an order, reduces stock and empties the cart', async () => {
    const res = await request(app).post('/api/orders').set(auth(customerToken)).send({ shippingAddress: address });
    expect(res.status).toBe(201);
    order = res.body.data;
    expect(order.subtotal).toBe(50000);
    expect(order.deliveryFee).toBe(1500); // Lagos
    expect(order.totalAmount).toBe(51500);
    expect(order.status).toBe('pending');
    expect(order.orderNumber).toMatch(/^ND-[A-F0-9]{10}$/);
    const p = await request(app).get(`/api/products/${product._id}`);
    expect(p.body.data.stock).toBe(3);
    const cart = await request(app).get('/api/cart').set(auth(customerToken));
    expect(cart.body.data.items).toHaveLength(0);
  });

  it('fails payment then succeeds on retry', async () => {
    const init1 = await request(app).post('/api/payments/initiate').set(auth(customerToken)).send({ orderId: order._id });
    expect(init1.status).toBe(201);
    const fail = await request(app).post('/api/payments/confirm').set(auth(customerToken)).send({ reference: init1.body.data.reference, outcome: 'failed' });
    expect(fail.body.data.order.paymentStatus).toBe('failed');

    const init2 = await request(app).post('/api/payments/initiate').set(auth(customerToken)).send({ orderId: order._id });
    payment = init2.body.data;
    const ok = await request(app).post('/api/payments/confirm').set(auth(customerToken)).send({ reference: payment.reference, outcome: 'success' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.order.status).toBe('confirmed');
    expect(ok.body.data.order.paymentStatus).toBe('paid');
  });

  it('prevents paying twice and settling a settled payment', async () => {
    expect((await request(app).post('/api/payments/initiate').set(auth(customerToken)).send({ orderId: order._id })).status).toBe(400);
    expect((await request(app).post('/api/payments/confirm').set(auth(customerToken)).send({ reference: payment.reference, outcome: 'success' })).status).toBe(400);
  });

  it("hides other customers' orders", async () => {
    const other = await request(app).post('/api/auth/register').send({ name: 'Eve Test', email: 'eve@test.com', password: 'Passw0rd1' });
    const res = await request(app).get(`/api/orders/${order._id}`).set(auth(other.body.data.token));
    expect(res.status).toBe(404);
  });

  it('lets admin progress status in valid order only', async () => {
    const bad = await request(app).patch(`/api/orders/${order._id}/status`).set(auth(adminToken)).send({ status: 'delivered' });
    expect(bad.status).toBe(400); // cannot skip preparing and out_for_delivery
    const unknown = await request(app).patch(`/api/orders/${order._id}/status`).set(auth(adminToken)).send({ status: 'teleported' });
    expect(unknown.status).toBe(400);
    for (const status of ['preparing', 'out_for_delivery', 'delivered']) {
      const r = await request(app).patch(`/api/orders/${order._id}/status`).set(auth(adminToken)).send({ status });
      expect(r.status).toBe(200);
      expect(r.body.data.status).toBe(status);
    }
  });

  it('blocks customers from the admin order list; admin can see it', async () => {
    expect((await request(app).get('/api/orders/admin/all').set(auth(customerToken))).status).toBe(403);
    const res = await request(app).get('/api/orders/admin/all?status=delivered').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it('restocks when an order is cancelled', async () => {
    await request(app).post('/api/cart/items').set(auth(customerToken)).send({ productId: product._id, quantity: 1 });
    const o = await request(app).post('/api/orders').set(auth(customerToken)).send({ shippingAddress: abujaAddress });
    expect(o.body.data.deliveryFee).toBe(3500); // outside Lagos
    const before = (await request(app).get(`/api/products/${product._id}`)).body.data.stock;
    const c = await request(app).patch(`/api/orders/${o.body.data._id}/cancel`).set(auth(customerToken));
    expect(c.status).toBe(200);
    const after = (await request(app).get(`/api/products/${product._id}`)).body.data.stock;
    expect(after).toBe(before + 1);
  });
});

describe('Tracking & locations', () => {
  it('lists delivery states and the fee rule', async () => {
    const res = await request(app).get('/api/locations');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data.states)).toHaveLength(37);
    expect(res.body.data.fees).toEqual({ Lagos: 1500, default: 3500 });
  });

  it('tracks an order by code without logging in and hides personal details', async () => {
    const list = await request(app).get('/api/orders/admin/all?status=delivered').set(auth(adminToken));
    const code = list.body.data.items[0].orderNumber;
    const res = await request(app).get(`/api/orders/track/${code.toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('delivered');
    expect(res.body.data.destination).toBe('Ikeja, Lagos');
    expect(JSON.stringify(res.body)).not.toMatch(/08012345678|12 Market Road|Ada Obi/);
  });

  it('returns 404 for an unknown tracking code', async () => {
    const res = await request(app).get('/api/orders/track/ND-0000000000');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('No order was found with that tracking code');
  });
});

describe('Misc', () => {
  it('returns JSON 404 for unknown routes and handles bad JSON', async () => {
    const r = await request(app).get('/api/nothing');
    expect(r.status).toBe(404);
    expect(r.body.success).toBe(false);
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(bad.status).toBe(400);
  });
});
