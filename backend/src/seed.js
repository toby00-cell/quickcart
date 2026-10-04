require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

const categories = [
  { name: 'Electronics', description: 'Phones, laptops and accessories' },
  { name: 'Fashion', description: 'Clothing, shoes and bags' },
  { name: 'Home & Kitchen', description: 'Appliances and home essentials' },
  { name: 'Beauty', description: 'Skincare and personal care' },
];

const products = {
  Electronics: [
    ['Wireless Earbuds', 'Bluetooth 5.3 earbuds with charging case', 18500, 40],
    ['Smartphone Stand', 'Adjustable aluminium phone and tablet stand', 4500, 80],
    ['Power Bank 20000mAh', 'Fast-charging portable power bank', 16000, 35],
    ['USB-C Fast Charger', '30W USB-C wall charger', 7500, 60],
    ['Mechanical Keyboard', 'Compact RGB mechanical keyboard', 32000, 15],
  ],
  Fashion: [
    ['Classic White Sneakers', 'Comfortable everyday sneakers', 28000, 25],
    ['Canvas Backpack', 'Water-resistant 20L backpack', 15000, 30],
    ['Cotton Polo Shirt', 'Soft breathable polo shirt', 9500, 50],
    ['Leather Wallet', 'Slim genuine leather wallet', 8000, 45],
  ],
  'Home & Kitchen': [
    ['Electric Kettle 1.8L', 'Stainless steel fast-boil kettle', 14000, 20],
    ['Non-stick Frying Pan', '28cm non-stick frying pan', 11000, 35],
    ['LED Desk Lamp', 'Dimmable lamp with USB charging port', 12500, 28],
    ['Blender 600W', 'Multi-speed blender with 1.5L jar', 24000, 12],
  ],
  Beauty: [
    ['Vitamin C Serum', 'Brightening face serum 30ml', 9000, 55],
    ['Shea Butter Body Cream', 'Rich moisturising body cream', 5500, 70],
    ['Hair Dryer 2000W', 'Ionic hair dryer with 3 heat settings', 17000, 18],
  ],
};

(async () => {
  await connectDB(process.env.MONGO_URI);
  await Promise.all([Category.deleteMany({}), Product.deleteMany({})]);

  const cats = await Category.insertMany(categories);
  const docs = [];
  cats.forEach((c) =>
    (products[c.name] || []).forEach(([name, description, price, stock]) =>
      docs.push({ name, description, price, stock, category: c._id })
    )
  );
  await Product.insertMany(docs);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shop.com';
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({
      name: 'Store Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin1234',
      role: 'admin',
    });
  }
  console.log(`Seeded ${cats.length} categories, ${docs.length} products. Admin: ${adminEmail}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
