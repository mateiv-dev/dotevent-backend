import { getUserRoleRequests } from '@controllers/roleRequestController';
import {
  deleteUser,
  getUser,
  getUserFavoriteEvents,
  getUserOrganizationEvents,
  getUserRegistration,
  getUserRegistrations,
  getUsers,
  createUser as registerUser,
  syncEmail,
  updateUser,
} from '@controllers/userController';
import { requireAuth } from '@middlewares/authMiddleware';
import { requireRoles } from '@middlewares/roleMiddleware';
import { validate } from '@middlewares/validateInputDataMiddleware';
import { Router } from 'express';
import { Role } from 'types/Role';
import {
  CreateUserSchema,
  UpdateUserSchema,
} from 'validators/inputUserDataValidator';

const router = Router();

router.get('/', requireAuth, requireRoles([Role.ADMIN]), getUsers);

router.get('/me', requireAuth, getUser);
router.post('/register', requireAuth, validate(CreateUserSchema), registerUser);
router.put('/me', requireAuth, validate(UpdateUserSchema), updateUser);
router.put('/me/update-email', requireAuth, syncEmail);
router.delete('/me', requireAuth, deleteUser);

router.get(
  '/me/events',
  requireAuth,
  requireRoles([Role.STUDENT_REP, Role.ORGANIZER]),
  getUserOrganizationEvents,
);

router.get(
  '/me/events/organization',
  requireAuth,
  requireRoles([Role.STUDENT_REP, Role.ORGANIZER]),
  getUserOrganizationEvents,
);

router.get(
  '/me/favorite-events',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getUserFavoriteEvents,
);

router.get(
  '/me/registrations',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getUserRegistrations,
);

router.get(
  '/me/registrations/:eventId',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getUserRegistration,
);

router.get(
  '/me/role-requests',
  requireAuth,
  requireRoles([
    Role.SIMPLE_USER,
    Role.STUDENT,
    Role.STUDENT_REP,
    Role.ORGANIZER,
  ]),
  getUserRoleRequests,
);

router.get(
  '/me/reviews',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getUserRoleRequests,
);

export default router;
