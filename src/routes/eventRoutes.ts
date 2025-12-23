import { Router } from 'express';
import { createEvent, deleteEvent, getEvent, getFilteredEvents, updateEvent, getPendingEvents, registerParticipant, unregisterParticipant } from '../controllers/eventController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRoles as requireRoles } from '@middlewares/roleMiddleware';
import { approveEvent, rejectEvent } from '@controllers/adminController';
import { Role } from 'types/Role';
import { upload } from '@middlewares/multerMiddleware';

const MAX_FILES_COUNT = 10;

const router = Router();

router.get('/', getFilteredEvents);
router.get('/:id', getEvent);

router.get('/pending', requireAuth, requireRoles([Role.ADMIN]), getPendingEvents);
router.post('/:id/approve', requireAuth, requireRoles([Role.ADMIN]), approveEvent);
router.post('/:id/reject', requireAuth, requireRoles([Role.ADMIN]), rejectEvent);

router.post('/', requireAuth, requireRoles([Role.ORGANIZER, Role.STUDENT_REP, Role.ADMIN]), upload.array('files', MAX_FILES_COUNT), createEvent);
router.put('/:id', requireAuth, requireRoles([Role.ORGANIZER, Role.STUDENT_REP, Role.ADMIN]), upload.array('files', MAX_FILES_COUNT), updateEvent);
router.delete('/:id', requireAuth, requireRoles([Role.ORGANIZER, Role.STUDENT_REP, Role.ADMIN]), deleteEvent);

router.post('/:id/register', requireAuth, requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]), registerParticipant);
router.delete('/:id/register', requireAuth, requireRoles([Role.SIMPLE_USER, Role.STUDENT, Role.STUDENT_REP]), unregisterParticipant);

export default router;
