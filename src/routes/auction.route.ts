import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    startAuctionValidator,
    auctionStatusValidator,
    sellPlayerValidator,
    auctionActionValidator,
    placeBidValidator,
    resolveHardLimitValidator,
} from '../middlewares/validators/auction.validator';
import {
    startAuction,
    getAuctionStatus,
    sellPlayer,
    placeBid,
    resolveHardLimit,
    startTieBreaker,
    triggerSpinWheel,
    nextPlayer,
    skipPlayer,
    undoLastAction,
    pauseAuction,
    endAuction,
    getSoldLog,
} from '../controllers/auction.controller';

const auctionRouter = Router();

// ============================================================================
// PUBLIC ROUTES (for auction display polling)
// ============================================================================

auctionRouter.get('/:tournamentId/:categoryId/status', auctionStatusValidator, validateRequest, asyncHandler(getAuctionStatus));
auctionRouter.get('/:tournamentId/:categoryId/sold-log', auctionStatusValidator, validateRequest, asyncHandler(getSoldLog));

// ============================================================================
// PROTECTED ROUTES (Organizer/Staff Only)
// ============================================================================

auctionRouter.post('/start', isOrganizerLoggedIn, startAuctionValidator, validateRequest, asyncHandler(startAuction));
auctionRouter.post('/sell', isOrganizerLoggedIn, sellPlayerValidator, validateRequest, asyncHandler(sellPlayer));
auctionRouter.post('/bid', isOrganizerLoggedIn, placeBidValidator, validateRequest, asyncHandler(placeBid));
auctionRouter.post('/start-tie-breaker', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(startTieBreaker));
auctionRouter.post('/trigger-spin', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(triggerSpinWheel));
auctionRouter.post('/resolve-hard-limit', isOrganizerLoggedIn, resolveHardLimitValidator, validateRequest, asyncHandler(resolveHardLimit));
auctionRouter.post('/next', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(nextPlayer));
auctionRouter.post('/skip', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(skipPlayer));
auctionRouter.post('/undo', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(undoLastAction));
auctionRouter.post('/pause', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(pauseAuction));
auctionRouter.post('/end', isOrganizerLoggedIn, auctionActionValidator, validateRequest, asyncHandler(endAuction));

export default auctionRouter;
