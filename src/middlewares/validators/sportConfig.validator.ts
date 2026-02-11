import { body, param } from 'express-validator';
import { ISportType, IScoringType, IMatchDurationType } from '../../models/sportConfig.model';

export const sportParamValidator = [
    param('sport')
        .isIn(Object.values(ISportType)).withMessage('Invalid sport type.'),
];

export const sportConfigIdValidator = [
    param('id')
        .isMongoId().withMessage('Invalid sport config ID.'),
];

export const createSportConfigValidator = [
    body('sport')
        .notEmpty().withMessage('Sport is required.')
        .isIn(Object.values(ISportType)).withMessage('Invalid sport type.'),
    body('displayName')
        .trim()
        .notEmpty().withMessage('Display name is required.'),
    body('scoringType')
        .notEmpty().withMessage('Scoring type is required.')
        .isIn(Object.values(IScoringType)).withMessage('Invalid scoring type.'),
    body('matchDurationType')
        .notEmpty().withMessage('Match duration type is required.')
        .isIn(Object.values(IMatchDurationType)).withMessage('Invalid match duration type.'),
    body('teamConfig.minPlayersPerTeam')
        .notEmpty().withMessage('Min players per team is required.')
        .isInt({ min: 1 }).withMessage('Min players must be at least 1.'),
    body('teamConfig.maxPlayersPerTeam')
        .notEmpty().withMessage('Max players per team is required.')
        .isInt({ min: 1 }).withMessage('Max players must be at least 1.'),
    body('teamConfig.playersOnField')
        .notEmpty().withMessage('Players on field is required.')
        .isInt({ min: 1 }).withMessage('Players on field must be at least 1.'),
    body('matchFormats')
        .isArray({ min: 1 }).withMessage('At least one match format is required.'),
    body('matchFormats.*.name')
        .notEmpty().withMessage('Match format name is required.'),
    body('matchFormats.*.playersPerSide')
        .isInt({ min: 1 }).withMessage('Players per side must be at least 1.'),
    body('bestOfOptions')
        .isArray({ min: 1 }).withMessage('At least one best-of option is required.'),
];

export const updateSportConfigValidator = [
    param('id')
        .isMongoId().withMessage('Invalid sport config ID.'),
    body('displayName')
        .optional()
        .trim(),
    body('scoringType')
        .optional()
        .isIn(Object.values(IScoringType)).withMessage('Invalid scoring type.'),
    body('matchDurationType')
        .optional()
        .isIn(Object.values(IMatchDurationType)).withMessage('Invalid match duration type.'),
    body('teamConfig.minPlayersPerTeam')
        .optional()
        .isInt({ min: 1 }).withMessage('Min players must be at least 1.'),
    body('teamConfig.maxPlayersPerTeam')
        .optional()
        .isInt({ min: 1 }).withMessage('Max players must be at least 1.'),
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean.'),
];
