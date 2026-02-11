import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    createTournamentValidator,
    updateTournamentValidator,
    getTournamentValidator,
    getAllTournamentsValidator,
    addStaffValidator,
    removeStaffValidator,
} from '../middlewares/validators/tournament.validator';
import {
    createTournament,
    getTournament,
    getAllTournaments,
    getMyTournaments,
    updateTournament,
    deleteTournament,
    openRegistration,
    closeRegistration,
    startAuction,
    startTournament,
    completeTournament,
    cancelTournament,
    addStaff,
    removeStaff,
} from '../controllers/tournament.controller';

const tournamentRouter = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// Get all tournaments (public)
tournamentRouter.get('/', getAllTournamentsValidator, validateRequest, asyncHandler(getAllTournaments));

// Get tournament by ID (public)
tournamentRouter.get('/:id', getTournamentValidator, validateRequest, asyncHandler(getTournament));

// ============================================================================
// PROTECTED ROUTES (Organizer Only)
// ============================================================================

// Get my tournaments
tournamentRouter.get('/organizer/my-tournaments', isOrganizerLoggedIn, asyncHandler(getMyTournaments));

// Create tournament
tournamentRouter.post('/', isOrganizerLoggedIn, createTournamentValidator, validateRequest, asyncHandler(createTournament));

// Update tournament
tournamentRouter.put('/:id', isOrganizerLoggedIn, updateTournamentValidator, validateRequest, asyncHandler(updateTournament));

// Delete tournament
tournamentRouter.delete('/:id', isOrganizerLoggedIn, getTournamentValidator, validateRequest, asyncHandler(deleteTournament));

// ============================================================================
// STATUS MANAGEMENT ROUTES
// ============================================================================

// Open registration
tournamentRouter.post('/:id/open-registration', isOrganizerLoggedIn, getTournamentValidator, validateRequest, asyncHandler(openRegistration));

// Close registration
tournamentRouter.post('/:id/close-registration', isOrganizerLoggedIn, getTournamentValidator, validateRequest, asyncHandler(closeRegistration));

// Start auction
tournamentRouter.post('/:id/start-auction', isOrganizerLoggedIn, getTournamentValidator, validateRequest, asyncHandler(startAuction));

// Start tournament
tournamentRouter.post('/:id/start', isOrganizerLoggedIn, getTournamentValidator, validateRequest, asyncHandler(startTournament));

// Complete tournament
tournamentRouter.post('/:id/complete', isOrganizerLoggedIn, getTournamentValidator, validateRequest, asyncHandler(completeTournament));

// Cancel tournament
tournamentRouter.post('/:id/cancel', isOrganizerLoggedIn, getTournamentValidator, validateRequest, asyncHandler(cancelTournament));

// ============================================================================
// STAFF MANAGEMENT ROUTES
// ============================================================================

// Add staff
tournamentRouter.post('/:id/staff', isOrganizerLoggedIn, addStaffValidator, validateRequest, asyncHandler(addStaff));

// Remove staff
tournamentRouter.delete('/:id/staff/:staffId', isOrganizerLoggedIn, removeStaffValidator, validateRequest, asyncHandler(removeStaff));

export default tournamentRouter;
