import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    categoryIdValidator,
    matchIdValidator,
    recordResultValidator,
    updateScheduleValidator,
    swapCompetitorsValidator,
    reshuffleValidator,
} from '../middlewares/validators/match.validator';
import {
    generateBracket,
    getMatchesByCategory,
    getMatchById,
    recordResult,
    updateSchedule,
    swapCompetitors,
    reshuffleBracket,
} from '../controllers/match.controller';

const matchRouter = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// Get all matches for a category (bracket view)
matchRouter.get('/categories/:categoryId', categoryIdValidator, validateRequest, asyncHandler(getMatchesByCategory));

// Get single match detail
matchRouter.get('/:id', matchIdValidator, validateRequest, asyncHandler(getMatchById));

// ============================================================================
// PROTECTED ROUTES (Organizer/Staff Only)
// ============================================================================

// Generate bracket for a category
matchRouter.post('/generate/:categoryId', isOrganizerLoggedIn, categoryIdValidator, validateRequest, asyncHandler(generateBracket));

// Record match result
matchRouter.post('/:id/result', isOrganizerLoggedIn, recordResultValidator, validateRequest, asyncHandler(recordResult));

// Update match schedule
matchRouter.put('/:id/schedule', isOrganizerLoggedIn, updateScheduleValidator, validateRequest, asyncHandler(updateSchedule));

// Swap competitors between two match slots
matchRouter.put('/swap', isOrganizerLoggedIn, swapCompetitorsValidator, validateRequest, asyncHandler(swapCompetitors));

// Reshuffle bracket (randomize Round 1 assignments)
matchRouter.post('/reshuffle/:categoryId', isOrganizerLoggedIn, reshuffleValidator, validateRequest, asyncHandler(reshuffleBracket));

export default matchRouter;
