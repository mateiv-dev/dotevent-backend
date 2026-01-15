import { getTotalStatistics } from '@controllers/statisticsController';
import { requireAuth } from '@middlewares/authMiddleware';
import { requireRoles } from '@middlewares/roleMiddleware';
import { Router } from 'express';
import { Role } from 'types/Role';

const router = Router();

router.get('/', requireAuth, requireRoles([Role.ADMIN]), getTotalStatistics);

export default router;
