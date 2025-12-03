import { Router } from 'express';
import { createEvent, deleteEvent, getEvent, getApprovedEvents, updateEvent, getPendingEvents } from '../controllers/eventController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requirePostPermission } from '@middlewares/postMiddleware';
import { requireAdmin } from '@middlewares/adminMiddleware';
import { approveEvent, rejectEvent } from '@controllers/adminController';

const router = Router();

router.get('/', getApprovedEvents);
router.get('/pending', requireAuth, requireAdmin, getPendingEvents);
router.get('/:id', getEvent);
router.post('/', requireAuth, requirePostPermission, createEvent);
router.put('/:id', requireAuth, requirePostPermission, updateEvent);
router.delete('/:id', requireAuth, requirePostPermission, deleteEvent);

router.post('/:id/approve', requireAuth, requireAdmin, approveEvent);
router.post('/:id/reject', requireAuth, requireAdmin, rejectEvent);

export default router;
