import { Router } from 'express';
import { jobsController } from '../controllers/jobs.controller.js';
import { requireModeratorOrAdmin } from '../middlewares/jwtAuthGuard.js';
import { strictRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// All job operations require moderator or admin privilege
router.use(requireModeratorOrAdmin);

// POST /api/v1/jobs/scrape - Queue a scrape job
router.post('/scrape', strictRateLimiter, jobsController.createScrapeJob);

// GET /api/v1/jobs/:jobId - Get job status
router.get('/:jobId', jobsController.getJobStatus);

// GET /api/v1/jobs - List jobs
router.get('/', jobsController.listJobs);

export default router;
