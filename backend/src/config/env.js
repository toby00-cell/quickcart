require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];

const checkEnv = () => {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = { checkEnv };
