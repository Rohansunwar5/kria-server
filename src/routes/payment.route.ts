import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { isPlayerLoggedIn } from '../middlewares/isPlayerLoggedIn.middleware';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
import { validateRequest } from '../middlewares/validators';
import {
    createPaymentOrderValidator,
    verifyPaymentValidator,
    getPaymentStatusValidator,
    getPaymentsByTournamentValidator,
} from '../middlewares/validators/payment.validator';
import {
    createPaymentOrder,
    verifyPayment,
    getPaymentStatus,
    getPlayerPayments,
    getPaymentsByTournament,
} from '../controllers/payment.controller';

const paymentRouter = Router();

// ============================================================================
// PLAYER ROUTES
// ============================================================================

// Create a Razorpay payment order for category registration
paymentRouter.post(
    '/create-order',
    isPlayerLoggedIn,
    createPaymentOrderValidator,
    validateRequest,
    asyncHandler(createPaymentOrder)
);

// Verify payment and auto-register player
paymentRouter.post(
    '/verify',
    isPlayerLoggedIn,
    verifyPaymentValidator,
    validateRequest,
    asyncHandler(verifyPayment)
);

// Get payment status by order ID
paymentRouter.get(
    '/status/:orderId',
    isPlayerLoggedIn,
    getPaymentStatusValidator,
    validateRequest,
    asyncHandler(getPaymentStatus)
);

// Get all payments (invoices) for the logged-in player
paymentRouter.get(
    '/my-payments',
    isPlayerLoggedIn,
    asyncHandler(getPlayerPayments)
);

// ============================================================================
// ORGANIZER ROUTES
// ============================================================================

// Get all payments for a tournament
paymentRouter.get(
    '/tournaments/:tournamentId',
    isOrganizerLoggedIn,
    getPaymentsByTournamentValidator,
    validateRequest,
    asyncHandler(getPaymentsByTournament)
);

export default paymentRouter;
