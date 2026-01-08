import {
  createEventUpdatedNotifications,
  deleteNotification,
  getUnreadCount,
  getNotifications as getUserNotifications,
  markAllAsRead,
  markAsRead,
} from '@controllers/notificationController';
import { requireAuth } from '@middlewares/authMiddleware';
import { requireRoles } from '@middlewares/roleMiddleware';
import { Router } from 'express';
import { Role } from 'types/Role';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requireAuth,
  requireRoles([
    Role.SIMPLE_USER,
    Role.STUDENT,
    Role.STUDENT_REP,
    Role.ORGANIZER,
  ]),
  getUserNotifications,
);

router.post(
  '/event-updated/:eventId',
  requireAuth,
  requireRoles([Role.STUDENT_REP, Role.ORGANIZER]),
  createEventUpdatedNotifications,
);

router.get(
  '/unread-count',
  requireAuth,
  requireRoles([
    Role.SIMPLE_USER,
    Role.STUDENT,
    Role.STUDENT_REP,
    Role.ORGANIZER,
  ]),
  getUnreadCount,
);

router.put(
  '/:id/read',
  requireAuth,
  requireRoles([
    Role.SIMPLE_USER,
    Role.STUDENT,
    Role.STUDENT_REP,
    Role.ORGANIZER,
  ]),
  markAsRead,
);

router.put(
  '/read-all',
  requireAuth,
  requireRoles([
    Role.SIMPLE_USER,
    Role.STUDENT,
    Role.STUDENT_REP,
    Role.ORGANIZER,
  ]),
  markAllAsRead,
);

router.delete(
  '/:notificationId',
  requireAuth,
  requireRoles([
    Role.SIMPLE_USER,
    Role.STUDENT,
    Role.STUDENT_REP,
    Role.ORGANIZER,
  ]),
  deleteNotification,
);

export default router;
