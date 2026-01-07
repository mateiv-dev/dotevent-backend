import {
  approveRequest as approveRoleRequest,
  getRoleRequests,
  rejectRequest as rejectRoleRequest,
} from '@controllers/adminController';
import {
  createRoleRequest,
  deleteRoleRequest,
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
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  createRoleRequest,
);

router.delete(
  '/',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  deleteRoleRequest,
);

router.post('/:requestId/approve', approveRoleRequest);
router.post('/:requestId/reject', rejectRoleRequest);

export default router;
