import { param, body } from 'express-validator';

export const categoryIdValidator = [
    param('categoryId')
        .isMongoId().withMessage('Invalid category ID.'),
];

export const matchIdValidator = [
    param('id')
        .isMongoId().withMessage('Invalid match ID.'),
];

export const recordResultValidator = [
    param('id')
        .isMongoId().withMessage('Invalid match ID.'),
    body('winnerId')
        .notEmpty().withMessage('Winner ID is required.')
        .isMongoId().withMessage('Invalid winner ID.'),
    body('winReason')
        .optional()
        .isString().withMessage('Win reason must be a string.'),
    body('gameScores')
        .optional()
        .isArray().withMessage('Game scores must be an array.'),
    body('setScores')
        .optional()
        .isArray().withMessage('Set scores must be an array.'),
    body('periodScores')
        .optional()
        .isArray().withMessage('Period scores must be an array.'),
    body('inningsScores')
        .optional()
        .isArray().withMessage('Innings scores must be an array.'),
    body('result')
        .optional()
        .isObject().withMessage('Result must be an object.'),
];

export const updateScheduleValidator = [
    param('id')
        .isMongoId().withMessage('Invalid match ID.'),
    body('date')
        .optional()
        .isISO8601().withMessage('Date must be a valid ISO date.'),
    body('time')
        .optional()
        .isString().withMessage('Time must be a string.'),
    body('court')
        .optional()
        .isString().withMessage('Court must be a string.'),
    body('venue')
        .optional()
        .isString().withMessage('Venue must be a string.'),
];

export const swapCompetitorsValidator = [
    body('matchId1')
        .isMongoId().withMessage('Invalid match ID 1.'),
    body('slot1')
        .isIn(['player1', 'player2']).withMessage('Slot1 must be player1 or player2.'),
    body('matchId2')
        .isMongoId().withMessage('Invalid match ID 2.'),
    body('slot2')
        .isIn(['player1', 'player2']).withMessage('Slot2 must be player1 or player2.'),
];

export const reshuffleValidator = [
    param('categoryId')
        .isMongoId().withMessage('Invalid category ID.'),
];
