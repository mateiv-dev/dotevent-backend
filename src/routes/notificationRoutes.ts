import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '@controllers/notificationController';
import { requireAuth } from '@middlewares/authMiddleware';
import { Router } from 'express';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:eventId', deleteNotification);

export default router;
