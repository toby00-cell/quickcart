const { checkEnv } = require('./config/env');
checkEnv();
const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err.message);
    process.exit(1);
  });
