import { Router } from 'express';
import streamRoutes from './stream.routes.js';
import jobsRoutes from './jobs.routes.js';
import anilistRoutes from './anilist.routes.js';
import seriesRoutes from './series.routes.js';
import avatarRoutes from './avatar.routes.js';

const apiRouter = Router();

apiRouter.use('/avatars', avatarRoutes);
apiRouter.use('/series', seriesRoutes);
apiRouter.use('/stream', streamRoutes);
apiRouter.use('/jobs', jobsRoutes);
apiRouter.use('/anilist', anilistRoutes);

export default apiRouter;
