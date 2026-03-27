import { body, param } from 'express-validator';

export const createPaymentOrderValidator = [
    body('tournamentId')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .isMongoId().withMessage('Invalid category ID.'),
];

export const verifyPaymentValidator = [
    body('razorpayOrderId')
        .notEmpty().withMessage('Razorpay order ID is required.'),
    body('razorpayPaymentId')
        .notEmpty().withMessage('Razorpay payment ID is required.'),
    body('razorpaySignature')
        .notEmpty().withMessage('Razorpay signature is required.'),
    body('profile.firstName')
        .trim()
        .notEmpty().withMessage('First name is required.'),
    body('profile.lastName')
        .trim()
        .notEmpty().withMessage('Last name is required.'),
    body('profile.age')
        .isInt({ min: 1 }).withMessage('Age must be a positive integer.'),
    body('profile.gender')
        .notEmpty().withMessage('Gender is required.'),
    body('profile.phone')
        .trim()
        .notEmpty().withMessage('Phone is required.'),
    body('profile.skillLevel')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
        .withMessage('Invalid skill level.'),
    body('basePrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Base price must be non-negative.'),
];

export const getPaymentStatusValidator = [
    param('orderId')
        .notEmpty().withMessage('Order ID is required.'),
];

export const getPaymentsByTournamentValidator = [
    param('tournamentId')
        .isMongoId().withMessage('Invalid tournament ID.'),
];
