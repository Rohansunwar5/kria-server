import { body, param } from 'express-validator';
import { IGender, IMatchType, IBracketType } from '../../models/category.model';

export const createCategoryValidator = [
    param('tournamentId')
        .isMongoId().withMessage('Invalid tournament ID.'),
    body('name')
        .trim()
        .notEmpty().withMessage('Category name is required.')
        .isLength({ max: 100 }).withMessage('Category name must be at most 100 characters.'),
    body('gender')
        .notEmpty().withMessage('Gender is required.')
        .isIn(Object.values(IGender)).withMessage('Invalid gender.'),
    body('ageGroup.label')
        .trim()
        .notEmpty().withMessage('Age group label is required.'),
    body('ageGroup.min')
        .optional()
        .isInt({ min: 0 }).withMessage('Age group min must be non-negative.'),
    body('ageGroup.max')
        .optional()
        .isInt({ min: 0 }).withMessage('Age group max must be non-negative.'),
    body('matchType')
        .notEmpty().withMessage('Match type is required.')
        .isIn(Object.values(IMatchType)).withMessage('Invalid match type.'),
    body('matchFormat.bestOf')
        .optional()
        .isIn([1, 3, 5]).withMessage('Best of must be 1, 3, or 5.'),
    body('matchFormat.pointsPerGame')
        .optional()
        .isInt({ min: 1 }).withMessage('Points per game must be at least 1.'),
    body('matchFormat.tieBreakPoints')
        .optional()
        .isInt({ min: 1 }).withMessage('Tie break points must be at least 1.'),
    body('bracketType')
        .optional()
        .isIn(Object.values(IBracketType)).withMessage('Invalid bracket type.'),
    body('hybridConfig.leagueSize')
        .optional()
        .isInt({ min: 2 }).withMessage('League size must be at least 2.'),
    body('hybridConfig.topN')
        .optional()
        .isInt({ min: 1 }).withMessage('Top N must be at least 1.'),
];

export const updateCategoryValidator = [
    param('id')
        .isMongoId().withMessage('Invalid category ID.'),
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Category name must be at most 100 characters.'),
    body('gender')
        .optional()
        .isIn(Object.values(IGender)).withMessage('Invalid gender.'),
    body('ageGroup.label')
        .optional()
        .trim(),
    body('ageGroup.min')
        .optional()
        .isInt({ min: 0 }).withMessage('Age group min must be non-negative.'),
    body('ageGroup.max')
        .optional()
        .isInt({ min: 0 }).withMessage('Age group max must be non-negative.'),
    body('matchType')
        .optional()
        .isIn(Object.values(IMatchType)).withMessage('Invalid match type.'),
    body('matchFormat.bestOf')
        .optional()
        .isIn([1, 3, 5]).withMessage('Best of must be 1, 3, or 5.'),
    body('matchFormat.pointsPerGame')
        .optional()
        .isInt({ min: 1 }).withMessage('Points per game must be at least 1.'),
    body('bracketType')
        .optional()
        .isIn(Object.values(IBracketType)).withMessage('Invalid bracket type.'),
    body('hybridConfig.leagueSize')
        .optional()
        .isInt({ min: 2 }).withMessage('League size must be at least 2.'),
    body('hybridConfig.topN')
        .optional()
        .isInt({ min: 1 }).withMessage('Top N must be at least 1.'),
];

export const getCategoryValidator = [
    param('id')
        .isMongoId().withMessage('Invalid category ID.'),
];

export const getCategoriesByTournamentValidator = [
    param('tournamentId')
        .isMongoId().withMessage('Invalid tournament ID.'),
];
