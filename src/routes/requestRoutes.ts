import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireAdmin } from '@middlewares/adminMiddleware';
import { getRoleRequests, approveRequest, rejectRequest } from '@controllers/adminController';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', getRoleRequests);
router.post('/:id/approve', approveRequest);
router.post('/:id/reject', rejectRequest);

export default router;
