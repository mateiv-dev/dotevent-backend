'@controllers/adminController';
import {
  approveRoleRequest,
  createRoleRequest,
  deleteRoleRequest,
  getRoleRequests,
  rejectRoleRequest,
} from '@controllers/roleRequestController';
import { requireRoles } from '@middlewares/roleMiddleware';
import { Router } from 'express';
import { Role } from 'types/Role';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, requireRoles([Role.ADMIN]), getRoleRequests);

router.post(
  '/',
  requireAuth,
  requireRoles([
    Role.SIMPLE_USER,
    Role.STUDENT,
    Role.STUDENT_REP,
    Role.ORGANIZER,
  ]),
  createRoleRequest,
);

router.delete(
  '/',
  requireAuth,
  requireRoles([
    Role.SIMPLE_USER,
    Role.STUDENT,
    Role.STUDENT_REP,
    Role.ORGANIZER,
  ]),
  deleteRoleRequest,
);

router.post(
  '/:requestId/approve',
  requireAuth,
  requireRoles([Role.ADMIN]),
  approveRoleRequest,
);

router.post(
  '/:requestId/reject',
  requireAuth,
  requireRoles([Role.ADMIN]),
  rejectRoleRequest,
);

export default router;
