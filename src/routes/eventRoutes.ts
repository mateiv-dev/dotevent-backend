import { Router } from 'express';
import { createEvent, deleteEvent, getEvent, getEvents, updateEvent } from '../controllers/eventController';
import { requireAuth } from '../middlewares/authMiddleware';
import { validateBody } from '@middlewares/validationMiddleware';
import { createEventSchema, updateEventSchema } from '@dtos/EventDto';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
// router.post('/', validateBody(createEventSchema), requireAuth, createEvent);
// router.put('/:id', validateBody(updateEventSchema), requireAuth, updateEvent);
router.post('/', requireAuth, createEvent);
router.put('/:id', requireAuth, updateEvent);
router.delete('/:id', requireAuth, deleteEvent);

export default router;
