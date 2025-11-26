import mongoose from 'mongoose';

export const connectMongoDB = async (mongoDbUri: string) => {
  if (!mongoDbUri) {
    console.error("MONGODB_URI is null");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoDbUri);
    console.log(`MongoDB connected successfully`);
  } 
  catch (err) {
    const error = err as Error;
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); 
  }
};
