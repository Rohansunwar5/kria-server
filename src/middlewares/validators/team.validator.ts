import { body, param } from 'express-validator';

export const createTeamValidator = [
    param('tournamentId')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('name')
        .trim()
        .notEmpty().withMessage('Team name is required.')
        .isLength({ max: 100 }).withMessage('Team name must be at most 100 characters.'),
    body('logo')
        .optional()
        .isURL().withMessage('Logo must be a valid URL.'),
    body('primaryColor')
        .optional()
        .trim()
        .isLength({ max: 7 }).withMessage('Primary color must be a valid hex code.'),
    body('secondaryColor')
        .optional()
        .trim()
        .isLength({ max: 7 }).withMessage('Secondary color must be a valid hex code.'),
    body('owner.name')
        .trim()
        .notEmpty().withMessage('Owner name is required.'),
    body('owner.phone')
        .trim()
        .notEmpty().withMessage('Owner phone is required.'),
    body('owner.email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid owner email.'),
    body('whatsappGroupLink')
        .optional()
        .trim()
        .isURL().withMessage('WhatsApp group link must be a valid URL.'),
    body('initialBudget')
        .optional()
        .isInt({ min: 0 }).withMessage('Initial budget must be non-negative.'),
];

export const updateTeamValidator = [
    param('id')
        .isMongoId().withMessage('Invalid team ID.'),
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Team name must be at most 100 characters.'),
    body('logo')
        .optional()
        .isURL().withMessage('Logo must be a valid URL.'),
    body('primaryColor')
        .optional()
        .trim()
        .isLength({ max: 7 }).withMessage('Primary color must be a valid hex code.'),
    body('secondaryColor')
        .optional()
        .trim()
        .isLength({ max: 7 }).withMessage('Secondary color must be a valid hex code.'),
    body('owner.name')
        .optional()
        .trim(),
    body('owner.phone')
        .optional()
        .trim(),
    body('owner.email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid owner email.'),
    body('whatsappGroupLink')
        .optional()
        .trim()
        .isURL().withMessage('WhatsApp group link must be a valid URL.'),
];

export const getTeamValidator = [
    param('id')
        .isMongoId().withMessage('Invalid team ID.'),
];

export const getTeamsByTournamentValidator = [
    param('tournamentId')
        .isMongoId().withMessage('Invalid tournament ID.'),
];

export const updateBudgetValidator = [
    param('id')
        .isMongoId().withMessage('Invalid team ID.'),
    body('budget')
        .notEmpty().withMessage('Budget is required.')
        .isInt({ min: 0 }).withMessage('Budget must be non-negative.'),
];

export const resetBudgetValidator = [
    param('id')
        .isMongoId().withMessage('Invalid team ID.'),
];
