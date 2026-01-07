import { MAX_FILES_COUNT } from '@config/storage';
import { approveEvent, rejectEvent } from '@controllers/adminController';
import { addReview, getEventReviews } from '@controllers/reviewController';
import { createReviewSchema } from '@dtos/ReviewDto';
import { requireRoles } from '@middlewares/roleMiddleware';
import { handleFileUpload } from '@middlewares/uploadMiddleware';
import { validate } from '@middlewares/validateInputData';
import { Router } from 'express';
import { Role } from 'types/Role';
import {
  CreateEventSchema,
  UpdateEventSchema,
} from 'validators/inputEventDataValidator';
import {
  addEventToFavorites,
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  getPendingEvents,
  registerParticipant,
  removeEventFromFavorites,
  unregisterParticipant,
  updateEvent,
} from '../controllers/eventController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Events

router.get('/', getEvents);
router.get('/:id', getEvent);

router.post(
  '/',
  requireAuth,
  requireRoles([Role.ORGANIZER, Role.STUDENT_REP]),
  handleFileUpload('files', MAX_FILES_COUNT),
  validate(CreateEventSchema),
  createEvent,
);

router.put(
  '/:eventId',
  requireAuth,
  requireRoles([Role.ORGANIZER, Role.STUDENT_REP]),
  handleFileUpload('files', MAX_FILES_COUNT),
  validate(UpdateEventSchema),
  updateEvent,
);

router.delete(
  '/:id',
  requireAuth,
  requireRoles([Role.ORGANIZER, Role.STUDENT_REP]),
  deleteEvent,
);

// Reviews

router.get('/:eventId/reviews', getEventReviews);

router.post(
  '/:eventId/reviews',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  validate(createReviewSchema),
  addReview,
);

// Favorites

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

// Pending

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

// Event Registration

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
