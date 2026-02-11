import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { playerRepository } from '../repository/player.repository';
import { IPlayerStatus } from '../models/player.model';

import config from '../config';
import mailService from './mail.service';
import { BadRequestError, NotFoundError, UnauthorizedError, InternalServerError } from '../errors';
import { SuccessResponse } from '../utils/response.util';
import { encode, encryptionKey } from './crypto.service';
import { playerJWTCacheManager } from './cache/entities';

class PlayerAuthService {
    private readonly OTP_EXPIRY_MINUTES = 10;
    private readonly SALT_ROUNDS = 10;

    // ========================================================================
    // REGISTRATION (3 Steps)
    // ========================================================================

    async register(params: { firstName: string; lastName: string; email: string; phone: string }) {
        const { firstName, lastName, email, phone } = params;

        // Check if email already exists
        const existingPlayer = await playerRepository.getByEmail(email);
        if (existingPlayer) {
            if (existingPlayer.status === IPlayerStatus.VERIFIED) {
                throw new BadRequestError('Email already registered. Please login.');
            }
            // Resend OTP for pending registrations
            await this.sendOtp(email);
            return new SuccessResponse('OTP sent to email. Please verify.', { status: existingPlayer.status });
        }

        // Create new player
        await playerRepository.create({
            firstName,
            lastName,
            email,
            phone,
            status: IPlayerStatus.PENDING,
        });

        // Send OTP
        await this.sendOtp(email);

        return new SuccessResponse('Registration started. OTP sent to email.', { status: IPlayerStatus.PENDING });
    }

    async verifyRegistrationOtp(params: { email: string; otp: string }) {
        const { email, otp } = params;

        const player = await playerRepository.getByEmailWithOtp(email);
        if (!player) {
            throw new NotFoundError('Player not found. Please register first.');
        }

        if (player.status === IPlayerStatus.VERIFIED) {
            throw new BadRequestError('Account already verified. Please login.');
        }

        await this.validateOtp(player, otp);

        // Update status to OTP_VERIFIED
        await playerRepository.updateStatus(email, IPlayerStatus.OTP_VERIFIED);
        await playerRepository.clearOtp(email);

        return new SuccessResponse('OTP verified. Please set your password.', { status: IPlayerStatus.OTP_VERIFIED });
    }

    async setPassword(params: { email: string; password: string }) {
        const { email, password } = params;

        const player = await playerRepository.getByEmail(email);
        if (!player) {
            throw new NotFoundError('Player not found.');
        }

        // If already verified, they should login instead
        if (player.status === IPlayerStatus.VERIFIED) {
            throw new BadRequestError('Account already verified. Please login.');
        }

        if (player.status !== IPlayerStatus.OTP_VERIFIED) {
            throw new BadRequestError('Please verify your email first.');
        }

        // Generate token FIRST to ensure JWT secrets are valid
        // This prevents the user from being stuck in a bad state if token generation fails
        const accessToken = await this.generateJWTToken(player._id.toString());
        if (!accessToken) throw new InternalServerError('Failed to generate access token');

        // Hash and save password, then update status
        const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
        await playerRepository.setPassword(email, hashedPassword);
        await playerRepository.updateStatus(email, IPlayerStatus.VERIFIED);

        // Get updated player
        const updatedPlayer = await playerRepository.getByEmail(email);

        return new SuccessResponse('Registration complete.', {
            accessToken,
            player: updatedPlayer,
        });
    }

    // ========================================================================
    // LOGIN (2 Options)
    // ========================================================================

    async loginWithPassword(params: { email: string; password: string }) {
        const { email, password } = params;

        const player = await playerRepository.getByEmailWithPassword(email);
        if (!player) {
            throw new NotFoundError('Player not found. Please register first.');
        }

        if (player.status !== IPlayerStatus.VERIFIED) {
            throw new BadRequestError('Account not verified. Please complete registration.');
        }

        if (!player.password) {
            throw new BadRequestError('Password not set. Please use OTP login.');
        }

        const isMatch = await bcrypt.compare(password, player.password);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid email or password.');
        }

        const accessToken = await this.generateJWTToken(player._id.toString());
        if (!accessToken) throw new InternalServerError('Failed to generate access token');

        const playerData = await playerRepository.getByEmail(email);

        return new SuccessResponse('Login successful.', {
            accessToken,
            player: playerData,
        });
    }

    async loginWithOtp(params: { email: string }) {
        const { email } = params;

        const player = await playerRepository.getByEmail(email);
        if (!player) {
            throw new NotFoundError('Player not found. Please register first.');
        }

        if (player.status !== IPlayerStatus.VERIFIED) {
            throw new BadRequestError('Account not verified. Please complete registration.');
        }

        await this.sendOtp(email);

        return new SuccessResponse('OTP sent to email.');
    }

    async verifyLoginOtp(params: { email: string; otp: string }) {
        const { email, otp } = params;

        const player = await playerRepository.getByEmailWithOtp(email);
        if (!player) {
            throw new NotFoundError('Player not found.');
        }

        if (player.status !== IPlayerStatus.VERIFIED) {
            throw new BadRequestError('Account not verified.');
        }

        await this.validateOtp(player, otp);
        await playerRepository.clearOtp(email);

        const accessToken = await this.generateJWTToken(player._id.toString());
        if (!accessToken) throw new InternalServerError('Failed to generate access token');

        const playerData = await playerRepository.getByEmail(email);

        return new SuccessResponse('Login successful.', {
            accessToken,
            player: playerData,
        });
    }

    // ========================================================================
    // PASSWORD MANAGEMENT
    // ========================================================================

    async forgotPassword(email: string) {
        const player = await playerRepository.getByEmail(email);
        if (!player) {
            throw new NotFoundError('Player not found.');
        }

        if (player.status !== IPlayerStatus.VERIFIED) {
            throw new BadRequestError('Account not verified.');
        }

        await this.sendOtp(email);

        return new SuccessResponse('OTP sent to email.');
    }

    async resetPassword(params: { email: string; otp: string; newPassword: string }) {
        const { email, otp, newPassword } = params;

        const player = await playerRepository.getByEmailWithOtp(email);
        if (!player) {
            throw new NotFoundError('Player not found.');
        }

        await this.validateOtp(player, otp);

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await playerRepository.setPassword(email, hashedPassword);
        await playerRepository.clearOtp(email);

        return new SuccessResponse('Password reset successfully.');
    }

    async changePassword(params: { playerId: string; currentPassword: string; newPassword: string }) {
        const { playerId, currentPassword, newPassword } = params;

        const player = await playerRepository.getByEmailWithPassword(
            (await playerRepository.getById(playerId))?.email ?? ''
        );
        if (!player || !player.password) {
            throw new NotFoundError('Player not found.');
        }

        const isMatch = await bcrypt.compare(currentPassword, player.password);
        if (!isMatch) {
            throw new UnauthorizedError('Current password is incorrect.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await playerRepository.updatePassword(playerId, hashedPassword);

        return new SuccessResponse('Password changed successfully.');
    }

    // ========================================================================
    // PROFILE
    // ========================================================================

    async getProfile(playerId: string) {
        const player = await playerRepository.getById(playerId);
        if (!player) {
            throw new NotFoundError('Player not found.');
        }

        return new SuccessResponse('Profile fetched.', player);
    }

    async updateProfile(playerId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
        const player = await playerRepository.updateById(playerId, data);
        if (!player) {
            throw new NotFoundError('Player not found.');
        }

        return new SuccessResponse('Profile updated.', player);
    }

    async updateProfileImage(playerId: string, imagePath: string) {
        const player = await playerRepository.updateProfileImage(playerId, imagePath);
        if (!player) {
            throw new NotFoundError('Player not found.');
        }

        return new SuccessResponse('Profile image updated.', player);
    }

    // ========================================================================
    // TOKEN MANAGEMENT
    // ========================================================================

    async refreshToken(token: string) {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET) as { _id: string };
            const player = await playerRepository.getById(decoded._id);

            if (!player) {
                throw new UnauthorizedError('Invalid token.');
            }

            const accessToken = await this.generateJWTToken(player._id.toString());
            if (!accessToken) throw new InternalServerError('Failed to generate access token');

            return new SuccessResponse('Token refreshed.', { accessToken });
        } catch {
            throw new UnauthorizedError('Invalid or expired token.');
        }
    }

    async resendOtp(email: string) {
        const player = await playerRepository.getByEmail(email);
        if (!player) {
            throw new NotFoundError('Player not found.');
        }

        await this.sendOtp(email);

        return new SuccessResponse('OTP sent to email.');
    }

    // ========================================================================
    // FCM TOKENS
    // ========================================================================

    async addFcmToken(playerId: string, token: string) {
        await playerRepository.addFcmToken(playerId, token);
        return new SuccessResponse('FCM token added.');
    }

    async removeFcmToken(playerId: string, token: string) {
        await playerRepository.removeFcmToken(playerId, token);
        return new SuccessResponse('FCM token removed.');
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private async sendOtp(email: string) {
        const otp = nanoid(6).toUpperCase();
        const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
        console.log(otp);

        await playerRepository.updateOtp(email, { code: otp, expiresAt });
        // await mailService.sendEmail(email, 'otp.ejs', { otp }, 'Kria Sports - Email Verification OTP');
    }

    private async validateOtp(player: { otp?: { code: string; expiresAt: Date } }, inputOtp: string) {
        if (!player.otp?.code || !player.otp?.expiresAt) {
            throw new BadRequestError('OTP not found. Please request a new one.');
        }

        if (new Date() > player.otp.expiresAt) {
            throw new BadRequestError('OTP has expired. Please request a new one.');
        }

        if (player.otp.code !== inputOtp) {
            throw new BadRequestError('Invalid OTP.');
        }
    }

    private async generateJWTToken(playerId: string) {
        const token = jwt.sign(
            { _id: playerId, type: 'player' },
            config.JWT_SECRET,
            { expiresIn: config.ACCESS_TOKEN_EXPIRY || '7d' }
        );

        const key = await encryptionKey(config.JWT_CACHE_ENCRYPTION_KEY);
        const encryptedData = await encode(token, key);
        await playerJWTCacheManager.set({ userId: playerId }, encryptedData);

        return token;
    }
}

export const playerAuthService = new PlayerAuthService();
