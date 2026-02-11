import { Router } from 'express';
import { country, health, helloWorld } from '../controllers/health.controller';
import { asyncHandler } from '../utils/asynchandler';
import playerAuthRouter from './playerAuth.route';
import organizerAuthRouter from './organizerAuth.route';
import contactRouter from './contact.route';
import tournamentRouter from './tournament.route';
import teamRouter from './team.route';
import categoryRouter from './category.route';
import registrationRouter from './tournamentRegistration.route';
import sportConfigRouter from './sportConfig.route';

const v1Router = Router();

v1Router.get('/', asyncHandler(helloWorld));
v1Router.get('/health', asyncHandler(health));

// Auth Routes (separate for player and organizer)
v1Router.use('/player/auth', playerAuthRouter);
v1Router.use('/organizer/auth', organizerAuthRouter);

v1Router.use('/contact', contactRouter);
v1Router.get('/country', asyncHandler(country));

// Tournament Management Routes
v1Router.use('/tournament', tournamentRouter);

// Team Routes (nested under tournaments and standalone)
v1Router.use('/', teamRouter);

// Category Routes (nested under tournaments and standalone)
v1Router.use('/', categoryRouter);

// Player Registration Routes
v1Router.use('/registrations', registrationRouter);

// Sport Configuration Routes
v1Router.use('/sports', sportConfigRouter);

export default v1Router;
