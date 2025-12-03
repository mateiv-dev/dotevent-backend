import { Router } from 'express';
import { requireAuth } from '@middlewares/authMiddleware';
import { createUser as registerUser, getMe, deleteMe, updateMe, syncEmail, getUsers, getMeRequests, createRequest } from '@controllers/userController';
import { requireAdmin } from '@middlewares/adminMiddleware';

const router = Router();

router.get('/', requireAuth, requireAdmin, getUsers);

router.post('/register', requireAuth, registerUser);
router.get('/me', requireAuth, getMe);
router.delete('/me', requireAuth, deleteMe);
router.put('/me', requireAuth, updateMe);
router.put('me/update-email', requireAuth, syncEmail);

router.get('/me/requests', requireAuth, getMeRequests);
router.post('/me/requests', requireAuth, createRequest);

export default router;
