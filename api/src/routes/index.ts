import { Router } from 'express';
import streamRoutes from './stream.routes.js';
import jobsRoutes from './jobs.routes.js';
import anilistRoutes from './anilist.routes.js';

const apiRouter = Router();

apiRouter.use('/stream', streamRoutes);
apiRouter.use('/jobs', jobsRoutes);
apiRouter.use('/anilist', anilistRoutes);

export default apiRouter;
