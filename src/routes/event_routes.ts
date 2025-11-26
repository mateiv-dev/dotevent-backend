import { Router } from 'express';
import { createEvent, deleteEvent, getEvent, getEvents, updateEvent } from '../controllers/event_controller';
import { requireAuth } from '../middlewares/require_auth';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', requireAuth, createEvent);
router.put('/:id', requireAuth, updateEvent);
router.delete('/:id', requireAuth, deleteEvent);

export default router;
