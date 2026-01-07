import { getUserRoleRequests } from '@controllers/roleRequestController';
import {
  deleteUser,
  getUser,
  getUserEvents,
  getUserFavoriteEvents,
  getUserRegisteredEvents,
  getUsers,
  createUser as registerUser,
  syncEmail,
  updateUser,
} from '@controllers/userController';
import { requireAdmin } from '@middlewares/adminMiddleware';
import { requireAuth } from '@middlewares/authMiddleware';
import { requireRoles } from '@middlewares/roleMiddleware';
import { Router } from 'express';
import { Role } from 'types/Role';

const router = Router();

router.get('/', requireAuth, requireAdmin, getUsers);

router.get('/me', requireAuth, getUser);
router.post('/register', requireAuth, registerUser);
router.put('/me', requireAuth, updateUser);
router.put('/me/update-email', requireAuth, syncEmail);
router.delete('/me', requireAuth, deleteUser);

router.get(
  '/me/events',
  requireAuth,
  requireRoles([Role.STUDENT_REP, Role.ORGANIZER]),
  getUserEvents,
);

router.get(
  '/me/favorite-events',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getUserFavoriteEvents,
);

router.get(
  '/me/registered-events',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getUserRegisteredEvents,
);

router.get(
  '/me/registrations',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getUserRegisteredEvents,
);

router.get(
  '/me/role-requests',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getUserRoleRequests,
);

export default router;
