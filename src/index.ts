import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import itemRoutes from './routes/itemRoutes';

const api = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

if (!PORT) {
  throw new Error("PORT is not defined");
}
if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

api.use(cors());
api.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

api.get('/', (req: Request, res: Response) => {
  res.send('All systems are fully operational');
});

api.use('/items', itemRoutes);

api.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});