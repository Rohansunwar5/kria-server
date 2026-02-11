import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    createCategoryValidator,
    updateCategoryValidator,
    getCategoryValidator,
    getCategoriesByTournamentValidator,
} from '../middlewares/validators/category.validator';
import {
    createCategory,
    getCategory,
    getCategoriesByTournament,
    updateCategory,
    deleteCategory,
    openCategoryRegistration,
    startCategoryAuction,
    configureCategoryBracket,
    startCategory,
    completeCategory,
} from '../controllers/category.controller';

const categoryRouter = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// Get categories by tournament (public)
categoryRouter.get('/tournaments/:tournamentId/categories', getCategoriesByTournamentValidator, validateRequest, asyncHandler(getCategoriesByTournament));

// Get category by ID (public)
categoryRouter.get('/categories/:id', getCategoryValidator, validateRequest, asyncHandler(getCategory));

// ============================================================================
// PROTECTED ROUTES (Organizer/Staff Only)
// ============================================================================

// Create category
categoryRouter.post('/tournaments/:tournamentId/categories', isOrganizerLoggedIn, createCategoryValidator, validateRequest, asyncHandler(createCategory));

// Update category
categoryRouter.put('/categories/:id', isOrganizerLoggedIn, updateCategoryValidator, validateRequest, asyncHandler(updateCategory));

// Delete category
categoryRouter.delete('/categories/:id', isOrganizerLoggedIn, getCategoryValidator, validateRequest, asyncHandler(deleteCategory));

// ============================================================================
// STATUS MANAGEMENT ROUTES
// ============================================================================

// Open registration
categoryRouter.post('/categories/:id/open-registration', isOrganizerLoggedIn, getCategoryValidator, validateRequest, asyncHandler(openCategoryRegistration));

// Start auction
categoryRouter.post('/categories/:id/start-auction', isOrganizerLoggedIn, getCategoryValidator, validateRequest, asyncHandler(startCategoryAuction));

// Configure bracket
categoryRouter.post('/categories/:id/configure-bracket', isOrganizerLoggedIn, getCategoryValidator, validateRequest, asyncHandler(configureCategoryBracket));

// Start category
categoryRouter.post('/categories/:id/start', isOrganizerLoggedIn, getCategoryValidator, validateRequest, asyncHandler(startCategory));

// Complete category
categoryRouter.post('/categories/:id/complete', isOrganizerLoggedIn, getCategoryValidator, validateRequest, asyncHandler(completeCategory));

export default categoryRouter;
