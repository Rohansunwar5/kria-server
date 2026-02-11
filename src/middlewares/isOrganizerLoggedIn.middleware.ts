import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UnauthorizedError, BadRequestError } from '../errors';
import { organizerRepository } from '../repository/organizer.repository';
import { organizerJWTCacheManager } from '../services/cache/entities';
import { decode, encryptionKey } from '../services/crypto.service';

interface IJWTPayload {
    _id: string;
    type: string;
    role: string;
}

export const isOrganizerLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new BadRequestError('Authorization header is missing');
        }

        const token = authHeader.split(' ')[1];
        if (!token) throw new BadRequestError('Token is missing or invalid');

        const decoded = jwt.verify(token, config.JWT_SECRET) as IJWTPayload;

        if (decoded.type !== 'organizer') {
            throw new UnauthorizedError('Invalid token type. Organizer token required.');
        }

        // Validate against Redis cache
        const key = await encryptionKey(config.JWT_CACHE_ENCRYPTION_KEY);
        const cachedJWT = await organizerJWTCacheManager.get({ userId: decoded._id });

        if (cachedJWT) {
            const decodedJWT = await decode(cachedJWT, key);
            if (decodedJWT !== token) {
                throw new UnauthorizedError('Session Expired!');
            }
        }

        const organizer = await organizerRepository.getById(decoded._id);
        if (!organizer) {
            throw new UnauthorizedError('Organizer not found.');
        }

        if (!organizer.isActive) {
            throw new UnauthorizedError('Account is deactivated.');
        }

        req.organizer = { _id: organizer._id.toString(), role: organizer.role };
        next();
    } catch (error) {
        console.error('[isOrganizerLoggedIn] Error:', error);
        if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError('Token expired.'));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Invalid token.'));
        } else {
            next(error);
        }
    }
};

// Middleware to check if organizer has specific role
export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.organizer) {
            return next(new UnauthorizedError('Organizer not authenticated.'));
        }

        if (!allowedRoles.includes(req.organizer.role)) {
            return next(new UnauthorizedError('Insufficient permissions.'));
        }

        next();
    };
};
