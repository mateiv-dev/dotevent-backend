import { deleteReview } from '@controllers/reviewController';
import { requireAuth } from '@middlewares/authMiddleware';
import { requireRoles } from '@middlewares/roleMiddleware';
import { Router } from 'express';
import { Role } from 'types/Role';

const router = Router();

router.delete(
  '/reviews/:reviewId',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  deleteReview,
);

export default router;
