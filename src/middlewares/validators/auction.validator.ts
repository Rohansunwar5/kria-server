import { body, param } from 'express-validator';

export const startAuctionValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
    body('bidIncrement')
        .optional()
        .isInt({ min: 1 }).withMessage('Bid increment must be a positive integer.'),
    body('hardLimit')
        .optional()
        .isInt({ min: 0 }).withMessage('Hard limit must be a non-negative integer.'),
];

export const placeBidValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
    body('teamId')
        .notEmpty().withMessage('Team ID is required.')
        .isMongoId().withMessage('Invalid team ID.'),
];

export const markHardLimitTieValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
    body('teamId')
        .notEmpty().withMessage('Team ID is required.')
        .isMongoId().withMessage('Invalid team ID.'),
];

export const resolveHardLimitValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
    body('winnerTeamId')
        .notEmpty().withMessage('Winner team ID is required.')
        .isMongoId().withMessage('Invalid winner team ID.'),
];

export const auctionStatusValidator = [
    param('tournamentId')
        .isMongoId().withMessage('Invalid tournament ID.'),
    param('categoryId')
        .isMongoId().withMessage('Invalid category ID.'),
];

export const sellPlayerValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
    body('teamId')
        .notEmpty().withMessage('Team ID is required.')
        .isMongoId().withMessage('Invalid team ID.'),
    body('soldPrice')
        .notEmpty().withMessage('Sold price is required.')
        .isInt({ min: 0 }).withMessage('Sold price must be non-negative.'),
];

export const auctionActionValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
];

export const bulkUploadValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
];
