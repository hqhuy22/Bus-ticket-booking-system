import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
    });
    await mongoose.connect(`${process.env.MONGODB_URI}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;
