import dotenv from 'dotenv';
import app from './app';
import { connectMongoDB } from '@config/mongodb';
import { startReminderSystem } from 'jobs/eventReminderScheduler';

dotenv.config();

(async () => {
  const PORT = process.env.PORT;
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!PORT) {
    console.error('CRITICAL_ERROR: PORT is not defined');
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error('CRITICAL_ERROR: MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    await connectMongoDB(MONGODB_URI);

    startReminderSystem(5000); // 1 min

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1); 
  }
})();
