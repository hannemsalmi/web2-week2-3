import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoConnect = async () => {
  try {
    if (process.env.DATABASE_URL) {
      const connection = await mongoose.connect(process.env.DATABASE_URL);
      console.log('DB connected successfully');
      return connection;
    }
    throw new Error('DB_URL not defined');
  } catch (error) {
    console.error('Connection to db failed: ', (error as Error).message);
  }
};

export default mongoConnect;
