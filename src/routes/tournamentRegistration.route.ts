import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isPlayerLoggedIn } from '../middlewares/isPlayerLoggedIn.middleware';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    registerValidator,
    registrationIdValidator,
    tournamentRegistrationsValidator,
    categoryIdValidator,
    teamIdValidator,
    assignToTeamValidator,
    manualAssignValidator,
    bulkApproveValidator,
} from '../middlewares/validators/tournamentRegistration.validator';
import {
    registerForTournament,
    getMyRegistrations,
    withdrawRegistration,
    getRegistrationsByTournament,
    getRegistrationsByCategory,
    approveRegistration,
    rejectRegistration,
    bulkApproveRegistrations,
    assignPlayerToTeam,
    manualAssignPlayer,
    unassignPlayer,
    getTeamRoster,
    getAvailableForAuction,
} from '../controllers/tournamentRegistration.controller';

const registrationRouter = Router();

// PLAYER ROUTES

// Register for a tournament category
registrationRouter.post('/register', isPlayerLoggedIn, registerValidator, validateRequest, asyncHandler(registerForTournament));

// Get my registrations
registrationRouter.get('/my-registrations', isPlayerLoggedIn, asyncHandler(getMyRegistrations));

// Withdraw registration
registrationRouter.post('/:id/withdraw', isPlayerLoggedIn, registrationIdValidator, validateRequest, asyncHandler(withdrawRegistration));

// ORGANIZER/STAFF ROUTES

// Get registrations by tournament
registrationRouter.get('/tournaments/:tournamentId', isOrganizerLoggedIn, tournamentRegistrationsValidator, validateRequest, asyncHandler(getRegistrationsByTournament));

// Get registrations by category (public for auction display)
registrationRouter.get('/categories/:categoryId', categoryIdValidator, validateRequest, asyncHandler(getRegistrationsByCategory));

// Approve registration
registrationRouter.post('/:id/approve', isOrganizerLoggedIn, registrationIdValidator, validateRequest, asyncHandler(approveRegistration));

// Reject registration
registrationRouter.post('/:id/reject', isOrganizerLoggedIn, registrationIdValidator, validateRequest, asyncHandler(rejectRegistration));

// Bulk approve
registrationRouter.post('/bulk-approve', isOrganizerLoggedIn, bulkApproveValidator, validateRequest, asyncHandler(bulkApproveRegistrations));

// TEAM ASSIGNMENT ROUTES

// Assign player to team (auction)
registrationRouter.post('/:id/assign', isOrganizerLoggedIn, assignToTeamValidator, validateRequest, asyncHandler(assignPlayerToTeam));

// Manual assign (reassignment)
registrationRouter.post('/:id/manual-assign', isOrganizerLoggedIn, manualAssignValidator, validateRequest, asyncHandler(manualAssignPlayer));

// Unassign player
registrationRouter.post('/:id/unassign', isOrganizerLoggedIn, registrationIdValidator, validateRequest, asyncHandler(unassignPlayer));

// Get team roster
registrationRouter.get('/teams/:teamId/roster', teamIdValidator, validateRequest, asyncHandler(getTeamRoster));

// Get available players for auction
registrationRouter.get('/categories/:categoryId/available', isOrganizerLoggedIn, categoryIdValidator, validateRequest, asyncHandler(getAvailableForAuction));

export default registrationRouter;
