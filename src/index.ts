import { connectMongoDB } from '@config/mongodb';
import dotenv from 'dotenv';
import { startReminderSystem } from 'jobs/eventReminderScheduler';
import app from './app';

dotenv.config();

// const REMINDER_CHECK_INTERVAL = 1000 * 60 * 30; // 30 min
const REMINDER_CHECK_INTERVAL = 1000 * 30; // 30 s
const REMINDER_WINDOW_HOURS = 24;

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

    startReminderSystem(REMINDER_CHECK_INTERVAL, REMINDER_WINDOW_HOURS);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
})();
