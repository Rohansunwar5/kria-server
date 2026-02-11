import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    createTeamValidator,
    updateTeamValidator,
    getTeamValidator,
    getTeamsByTournamentValidator,
    updateBudgetValidator,
    resetBudgetValidator,
} from '../middlewares/validators/team.validator';
import {
    createTeam,
    getTeam,
    getTeamsByTournament,
    updateTeam,
    deleteTeam,
    updateTeamBudget,
    resetTeamBudget,
} from '../controllers/team.controller';

const teamRouter = Router();

// PUBLIC ROUTES

// Get teams by tournament (public)
teamRouter.get('/tournaments/:tournamentId/teams', getTeamsByTournamentValidator, validateRequest, asyncHandler(getTeamsByTournament));

// Get team by ID (public)
teamRouter.get('/teams/:id', getTeamValidator, validateRequest, asyncHandler(getTeam));


// PROTECTED ROUTES (Organizer/Staff Only)
// Create team
teamRouter.post('/tournaments/:tournamentId/teams', isOrganizerLoggedIn, createTeamValidator, validateRequest, asyncHandler(createTeam));

// Update team
teamRouter.put('/teams/:id', isOrganizerLoggedIn, updateTeamValidator, validateRequest, asyncHandler(updateTeam));

// Delete team
teamRouter.delete('/teams/:id', isOrganizerLoggedIn, getTeamValidator, validateRequest, asyncHandler(deleteTeam));

// Update team budget
teamRouter.put('/teams/:id/budget', isOrganizerLoggedIn, updateBudgetValidator, validateRequest, asyncHandler(updateTeamBudget));

// Reset team budget
teamRouter.post('/teams/:id/reset-budget', isOrganizerLoggedIn, resetBudgetValidator, validateRequest, asyncHandler(resetTeamBudget));

export default teamRouter;
