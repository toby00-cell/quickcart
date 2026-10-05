require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Cart = require('./models/Cart');

const categories = [
  { name: 'Yoruba', description: 'Classic dishes from the South West' },
  { name: 'Igbo', description: 'Soups and delicacies from the South East' },
  { name: 'Hausa', description: 'Northern favourites, from tuwo to suya' },
];

// [name, description, price, icon, image file in frontend/public/images]
const menu = {
  Yoruba: [
    ['Amala & Ewedu with Gbegiri', 'Soft amala with ewedu and gbegiri soup', 3500, '🍲', 'amala-ewedu-gbegiri.jpg'],
    ['Ofada Rice with Ayamase Sauce', 'Local ofada rice with spicy green pepper stew', 4500, '🍱', 'ofada-rice-ayamase.jpg'],
    ['Efo Riro with Beef & Fish', 'Rich vegetable stew with assorted meat and fish', 4000, '🥘', 'efo-riro.jpg'],
  ],
  Igbo: [
    ['Ofe Nsala (White Soup) & Pounded Yam', 'Peppery white soup with pounded yam', 5000, '🍲', 'ofe-nsala.jpg'],
    ['Abacha & Ugba (African Salad)', 'Shredded cassava with oil bean and garnishes', 3000, '🥗', 'abacha-ugba.jpg'],
    ['Ofe Owerri & Garri', 'Vegetable soup from Owerri served with garri', 4800, '🍲', 'ofe-owerri.jpg'],
  ],
  Hausa: [
    ['Tuwon Shinkafa & Miyan Kuka', 'Rice tuwo with baobab leaf soup', 3200, '🫓', 'tuwo-shinkafa-miyan-kuka.jpg'],
    ['Suya (Beef Skewers)', 'Spicy grilled beef skewers with yaji', 2500, '🍢', 'suya.jpg'],
    ['Miyan Taushe & Masa', 'Pumpkin soup with rice cakes', 3800, '🍲', 'miyan-taushe-masa.jpg'],
  ],
};

const PORTIONS = 100;

(async () => {
  await connectDB(process.env.MONGO_URI);
  await Promise.all([Category.deleteMany({}), Product.deleteMany({})]);

  // npm run seed -- --reset also clears orders, payments and carts (fresh demo)
  if (process.argv.includes('--reset')) {
    await Promise.all([Order.deleteMany({}), Payment.deleteMany({}), Cart.deleteMany({})]);
  }

  const cats = await Category.insertMany(categories);
  const docs = [];
  cats.forEach((c) =>
    (menu[c.name] || []).forEach(([name, description, price, icon, image]) =>
      docs.push({ name, description, price, icon, imageUrl: `/images/${image}`, stock: PORTIONS, category: c._id })
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
  console.log(`Seeded ${cats.length} categories, ${docs.length} dishes. Admin: ${adminEmail}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
