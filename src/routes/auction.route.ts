import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    startAuctionValidator,
    auctionStatusValidator,
    sellPlayerValidator,
    auctionActionValidator,
} from '../middlewares/validators/auction.validator';
import {
    startAuction,
    getAuctionStatus,
    sellPlayer,
    nextPlayer,
    skipPlayer,
    undoLastAction,
    pauseAuction,
    getSoldLog,
} from '../controllers/auction.controller';

const auctionRouter = Router();

// ============================================================================
// PUBLIC ROUTES (for auction display polling)
// ============================================================================

// Get auction status (polled by display page — no auth)
auctionRouter.get('/:tournamentId/:categoryId/status', auctionStatusValidator, validateRequest, asyncHandler(getAuctionStatus));

// Get sold log (public for display)
auctionRouter.get('/:tournamentId/:categoryId/sold-log', auctionStatusValidator, validateRequest, asyncHandler(getSoldLog));

// ============================================================================
// PROTECTED ROUTES (Organizer/Staff Only)
// ============================================================================

// Start auction for a category
auctionRouter.post('/start', isOrganizerLoggedIn, startAuctionValidator, validateRequest, asyncHandler(startAuction));

// Sell current player to team
auctionRouter.post('/sell', isOrganizerLoggedIn, sellPlayerValidator, validateRequest, asyncHandler(sellPlayer));

// Move to next player
auctionRouter.post('/next', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(nextPlayer));

// Skip current player (unsold)
auctionRouter.post('/skip', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(skipPlayer));

// Undo last action
auctionRouter.post('/undo', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(undoLastAction));

// Pause / Resume auction
auctionRouter.post('/pause', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(pauseAuction));

export default auctionRouter;
