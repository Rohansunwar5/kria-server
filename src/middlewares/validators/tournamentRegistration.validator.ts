import { body, param, query } from 'express-validator';
import { IPlayerGender, ISkillLevel } from '../../models/tournamentRegistration.model';

export const registerValidator = [
    body('tournamentId')
        .notEmpty().withMessage('Tournament ID is required.')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required.')
        .isMongoId().withMessage('Invalid category ID.'),
    body('profile.name')
        .trim()
        .notEmpty().withMessage('Name is required.'),
    body('profile.age')
        .notEmpty().withMessage('Age is required.')
        .isInt({ min: 1, max: 100 }).withMessage('Age must be between 1 and 100.'),
    body('profile.gender')
        .notEmpty().withMessage('Gender is required.')
        .isIn(Object.values(IPlayerGender)).withMessage('Invalid gender.'),
    body('profile.phone')
        .trim()
        .notEmpty().withMessage('Phone is required.'),
    body('profile.photo')
        .optional()
        .isURL().withMessage('Photo must be a valid URL.'),
    body('profile.skillLevel')
        .optional()
        .isIn(Object.values(ISkillLevel)).withMessage('Invalid skill level.'),
    body('basePrice')
        .optional()
        .isInt({ min: 0 }).withMessage('Base price must be non-negative.'),
];

export const registrationIdValidator = [
    param('id')
        .isMongoId().withMessage('Invalid registration ID.'),
];

export const tournamentRegistrationsValidator = [
    param('tournamentId')
        .isMongoId().withMessage('Invalid tournament ID.'),
    query('categoryId')
        .optional()
        .isMongoId().withMessage('Invalid category ID.'),
    query('status')
        .optional()
        .isString().withMessage('Status must be a string.'),
    query('teamId')
        .optional()
        .isMongoId().withMessage('Invalid team ID.'),
];

export const categoryIdValidator = [
    param('categoryId')
        .isMongoId().withMessage('Invalid category ID.'),
];

export const teamIdValidator = [
    param('teamId')
        .isMongoId().withMessage('Invalid team ID.'),
];

export const assignToTeamValidator = [
    param('id')
        .isMongoId().withMessage('Invalid registration ID.'),
    body('teamId')
        .notEmpty().withMessage('Team ID is required.')
        .isMongoId().withMessage('Invalid team ID.'),
    body('soldPrice')
        .notEmpty().withMessage('Sold price is required.')
        .isInt({ min: 0 }).withMessage('Sold price must be non-negative.'),
];

export const manualAssignValidator = [
    param('id')
        .isMongoId().withMessage('Invalid registration ID.'),
    body('teamId')
        .notEmpty().withMessage('Team ID is required.')
        .isMongoId().withMessage('Invalid team ID.'),
];

export const bulkApproveValidator = [
    body('registrationIds')
        .isArray({ min: 1 }).withMessage('At least one registration ID is required.')
        .custom((ids: string[]) => ids.every(id => /^[a-f\d]{24}$/i.test(id)))
        .withMessage('All registration IDs must be valid MongoDB ObjectIds.'),
];
