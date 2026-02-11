import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    sportParamValidator,
    sportConfigIdValidator,
    createSportConfigValidator,
    updateSportConfigValidator,
} from '../middlewares/validators/sportConfig.validator';
import {
    getAllSportConfigs,
    getSportConfig,
    createSportConfig,
    updateSportConfig,
    deleteSportConfig,
    seedSportConfigs,
} from '../controllers/sportConfig.controller';

const sportConfigRouter = Router();

// PUBLIC ROUTES
sportConfigRouter.get('/', asyncHandler(getAllSportConfigs));
sportConfigRouter.get('/:sport', sportParamValidator, validateRequest, asyncHandler(getSportConfig));

// ADMIN ROUTES (Organizer only for now)

sportConfigRouter.post('/seed', isOrganizerLoggedIn, asyncHandler(seedSportConfigs));
sportConfigRouter.post('/', isOrganizerLoggedIn, createSportConfigValidator, validateRequest, asyncHandler(createSportConfig));
sportConfigRouter.put('/:id', isOrganizerLoggedIn, updateSportConfigValidator, validateRequest, asyncHandler(updateSportConfig));
sportConfigRouter.delete('/:id', isOrganizerLoggedIn, sportConfigIdValidator, validateRequest, asyncHandler(deleteSportConfig));

export default sportConfigRouter;
