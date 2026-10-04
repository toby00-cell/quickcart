const mongoose = require('mongoose');

const connectDB = async (uri) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
};

module.exports = connectDB;
