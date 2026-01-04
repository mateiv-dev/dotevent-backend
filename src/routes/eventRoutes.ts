import { approveEvent, rejectEvent } from '@controllers/adminController';
import {
  addReview,
  deleteReview,
  getEventReviews,
} from '@controllers/reviewController';
import { getFavoriteEvents } from '@controllers/userController';
import { createReviewSchema } from '@dtos/ReviewDto';
import { upload } from '@middlewares/multerMiddleware';
import { requireRoles } from '@middlewares/roleMiddleware';
import { validate } from '@middlewares/validateInputData';
import { Router } from 'express';
import { Role } from 'types/Role';
import {
  addEventToFavorites,
  createEvent,
  deleteEvent,
  getEvent,
  getFilteredEvents,
  getPendingEvents,
  registerParticipant,
  removeEventFromFavorites,
  unregisterParticipant,
  updateEvent,
} from '../controllers/eventController';
import { requireAuth } from '../middlewares/authMiddleware';

const MAX_FILES_COUNT = 10;

const router = Router();

router.get('/', getFilteredEvents);
router.get(
  '/favorites',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  getFavoriteEvents,
);
router.get('/:id', getEvent);

router.get('/:eventId/reviews', getEventReviews);

router.post(
  '/:eventId/reviews',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  validate(createReviewSchema),
  addReview,
);

router.delete(
  '/:eventId/reviews/:reviewId',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  deleteReview,
);

router.post(
  '/:id/favorite',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  addEventToFavorites,
);
router.delete(
  '/:id/favorite',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  removeEventFromFavorites,
);

router.get(
  '/pending',
  requireAuth,
  requireRoles([Role.ADMIN]),
  getPendingEvents,
);
router.post(
  '/:id/approve',
  requireAuth,
  requireRoles([Role.ADMIN]),
  approveEvent,
);
router.post(
  '/:id/reject',
  requireAuth,
  requireRoles([Role.ADMIN]),
  rejectEvent,
);

router.post(
  '/',
  requireAuth,
  requireRoles([Role.ORGANIZER, Role.STUDENT_REP]),
  upload.array('files', MAX_FILES_COUNT),
  createEvent,
);
router.put(
  '/:id',
  requireAuth,
  requireRoles([Role.ORGANIZER, Role.STUDENT_REP]),
  upload.array('files', MAX_FILES_COUNT),
  updateEvent,
);
router.delete(
  '/:id',
  requireAuth,
  requireRoles([Role.ORGANIZER, Role.STUDENT_REP]),
  deleteEvent,
);

router.post(
  '/:id/register',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  registerParticipant,
);
router.delete(
  '/:id/register',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  unregisterParticipant,
);

export default router;
