import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UnauthorizedError, BadRequestError } from '../errors';
import { playerRepository } from '../repository/player.repository';
import { playerJWTCacheManager } from '../services/cache/entities';
import { decode, encryptionKey } from '../services/crypto.service';

interface IJWTPayload {
    _id: string;
    type: string;
}

export const isPlayerLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new BadRequestError('Authorization header is missing');
        }

        const token = authHeader.split(' ')[1];
        if (!token) throw new BadRequestError('Token is missing or invalid');

        const decoded = jwt.verify(token, config.JWT_SECRET) as IJWTPayload;

        if (decoded.type !== 'player') {
            throw new UnauthorizedError('Invalid token type. Player token required.');
        }

        // Validate against Redis cache
        const key = await encryptionKey(config.JWT_CACHE_ENCRYPTION_KEY);
        const cachedJWT = await playerJWTCacheManager.get({ userId: decoded._id });

        if (cachedJWT) {
            const decodedJWT = await decode(cachedJWT, key);
            if (decodedJWT !== token) {
                throw new UnauthorizedError('Session Expired!');
            }
        }

        const player = await playerRepository.getById(decoded._id);
        if (!player) {
            throw new UnauthorizedError('Player not found.');
        }

        if (!player.isActive) {
            throw new UnauthorizedError('Account is deactivated.');
        }

        req.player = { _id: player._id.toString() };
        next();
    } catch (error) {
        console.error('[isPlayerLoggedIn] Error:', error);
        if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError('Token expired.'));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Invalid token.'));
        } else {
            next(error);
        }
    }
};
