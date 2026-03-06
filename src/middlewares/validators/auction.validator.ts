import { body, param } from 'express-validator';

export const startAuctionValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
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
