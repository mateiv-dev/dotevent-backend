import { Router } from 'express';
import { requireAuth } from '@middlewares/authMiddleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '@controllers/notificationController';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
