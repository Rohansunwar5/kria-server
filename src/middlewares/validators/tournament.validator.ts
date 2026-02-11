import { body, param, query } from 'express-validator';
import { ISport, IAuctionType } from '../../models/tournament.model';

export const createTournamentValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Tournament name is required.')
        .isLength({ max: 100 }).withMessage('Tournament name must be at most 100 characters.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters.'),
    body('sport')
        .notEmpty().withMessage('Sport type is required.')
        .isIn(Object.values(ISport)).withMessage('Invalid sport type.'),
    body('startDate')
        .notEmpty().withMessage('Start date is required.')
        .isISO8601().withMessage('Invalid start date format.'),
    body('endDate')
        .notEmpty().withMessage('End date is required.')
        .isISO8601().withMessage('Invalid end date format.'),
    body('venue.name')
        .trim()
        .notEmpty().withMessage('Venue name is required.'),
    body('venue.city')
        .trim()
        .notEmpty().withMessage('Venue city is required.'),
    body('venue.address')
        .optional()
        .trim(),
    body('venue.coordinates.lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),
    body('venue.coordinates.lng')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
    body('registrationDeadline')
        .notEmpty().withMessage('Registration deadline is required.')
        .isISO8601().withMessage('Invalid registration deadline format.'),
    body('settings.maxTeams')
        .optional()
        .isInt({ min: 2 }).withMessage('Max teams must be at least 2.'),
    body('settings.defaultBudget')
        .optional()
        .isInt({ min: 0 }).withMessage('Default budget must be non-negative.'),
    body('settings.auctionType')
        .optional()
        .isIn(Object.values(IAuctionType)).withMessage('Invalid auction type.'),
    body('settings.allowLateRegistration')
        .optional()
        .isBoolean().withMessage('Allow late registration must be a boolean.'),
];

export const updateTournamentValidator = [
    param('id')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Tournament name must be at most 100 characters.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters.'),
    body('sport')
        .optional()
        .isIn(Object.values(ISport)).withMessage('Invalid sport type.'),
    body('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format.'),
    body('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format.'),
    body('venue.name')
        .optional()
        .trim(),
    body('venue.city')
        .optional()
        .trim(),
    body('registrationDeadline')
        .optional()
        .isISO8601().withMessage('Invalid registration deadline format.'),
    body('settings.maxTeams')
        .optional()
        .isInt({ min: 2 }).withMessage('Max teams must be at least 2.'),
    body('settings.defaultBudget')
        .optional()
        .isInt({ min: 0 }).withMessage('Default budget must be non-negative.'),
    body('settings.auctionType')
        .optional()
        .isIn(Object.values(IAuctionType)).withMessage('Invalid auction type.'),
];

export const getTournamentValidator = [
    param('id')
        .isMongoId().withMessage('Invalid tournament ID.'),
];

export const getAllTournamentsValidator = [
    query('status')
        .optional()
        .isString().withMessage('Status must be a string.'),
    query('sport')
        .optional()
        .isIn(Object.values(ISport)).withMessage('Invalid sport type.'),
    query('city')
        .optional()
        .isString().withMessage('City must be a string.'),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];

export const addStaffValidator = [
    param('id')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('staffId')
        .notEmpty().withMessage('Staff ID is required.')
        .isMongoId().withMessage('Invalid staff ID.'),
];

export const removeStaffValidator = [
    param('id')
        .isMongoId().withMessage('Invalid tournament ID.'),
    param('staffId')
        .isMongoId().withMessage('Invalid staff ID.'),
];
