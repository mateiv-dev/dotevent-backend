import { MAX_FILES_COUNT } from '@config/storage';
import { addReview, getEventReviews } from '@controllers/reviewController';
import { requireRoles } from '@middlewares/roleMiddleware';
import { handleFileUpload } from '@middlewares/uploadMiddleware';
import { validate } from '@middlewares/validateInputData';
import { Router } from 'express';
import { Role } from 'types/Role';
import {
  CreateEventSchema,
  UpdateEventSchema,
} from 'validators/inputEventDataValidator';
import { createReviewSchema as CreateReviewSchema } from 'validators/inputReviewDataValidator';
import {
  addEventToFavorites,
  approveEvent,
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  getPendingEvents,
  registerParticipant,
  rejectEvent,
  removeEventFromFavorites,
  unregisterParticipant,
  updateEvent,
} from '../controllers/eventController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Events

router.get('/', getEvents);

router.get(
  '/pending',
  requireAuth,
  requireRoles([Role.ADMIN]),
  getPendingEvents,
);

router.get('/:eventId', getEvent);

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
  '/:eventId',
  requireAuth,
  requireRoles([Role.ORGANIZER, Role.STUDENT_REP]),
  deleteEvent,
);

// Event Reviews

router.get('/:eventId/reviews', getEventReviews);

router.post(
  '/:eventId/reviews',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  validate(CreateReviewSchema),
  addReview,
);

// Favorite Events

router.post(
  '/:eventId/favorite',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  addEventToFavorites,
);
router.delete(
  '/:eventId/favorite',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  removeEventFromFavorites,
);

// Event Proccessing

router.post(
  '/:eventId/approve',
  requireAuth,
  requireRoles([Role.ADMIN]),
  approveEvent,
);
router.post(
  '/:eventId/reject',
  requireAuth,
  requireRoles([Role.ADMIN]),
  rejectEvent,
);

// Event Registration

router.post(
  '/:eventId/register',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  registerParticipant,
);
router.delete(
  '/:eventId/register',
  requireAuth,
  requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]),
  unregisterParticipant,
);

export default router;
