import { Router } from 'express';
import { createEvent, deleteEvent, getEvent, getEvents, updateEvent } from '../controllers/event_controller';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
