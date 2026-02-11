import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { organizerRepository } from '../repository/organizer.repository';
import { IOrganizerStatus, IOrganizerRole } from '../models/organizer.model';
import { BadRequestError, NotFoundError, UnauthorizedError, InternalServerError } from '../errors';
import config from '../config';
import { SuccessResponse } from '../utils/response.util';
import mailService from './mail.service';
import { encode, encryptionKey } from './crypto.service';
import { organizerJWTCacheManager } from './cache/entities';
import { log } from 'winston';

class OrganizerAuthService {
    private readonly OTP_EXPIRY_MINUTES = 10;
    private readonly SALT_ROUNDS = 10;

    // ========================================================================
    // REGISTRATION (3 Steps)
    // ========================================================================

    async register(params: { firstName: string; lastName: string; email: string; phone: string; role?: string }) {
        const { firstName, lastName, email, phone, role = IOrganizerRole.ORGANIZER } = params;

        // Check if email already exists
        const existingOrganizer = await organizerRepository.getByEmail(email);
        if (existingOrganizer) {
            if (existingOrganizer.status === IOrganizerStatus.VERIFIED) {
                throw new BadRequestError('Email already registered. Please login.');
            }
            // Resend OTP for pending registrations
            await this.sendOtp(email);
            return new SuccessResponse('OTP sent to email. Please verify.', { status: existingOrganizer.status });
        }

        // Create new organizer
        await organizerRepository.create({
            firstName,
            lastName,
            email,
            phone,
            role,
            status: IOrganizerStatus.PENDING,
        });

        // Send OTP
        await this.sendOtp(email);

        return new SuccessResponse('Registration started. OTP sent to email.', { status: IOrganizerStatus.PENDING });
    }

    async verifyRegistrationOtp(params: { email: string; otp: string }) {
        const { email, otp } = params;

        const organizer = await organizerRepository.getByEmailWithOtp(email);
        if (!organizer) {
            throw new NotFoundError('Organizer not found. Please register first.');
        }

        if (organizer.status === IOrganizerStatus.VERIFIED) {
            throw new BadRequestError('Account already verified. Please login.');
        }

        await this.validateOtp(organizer, otp);

        // Update status to OTP_VERIFIED
        await organizerRepository.updateStatus(email, IOrganizerStatus.OTP_VERIFIED);
        await organizerRepository.clearOtp(email);

        return new SuccessResponse('OTP verified. Please set your password.', { status: IOrganizerStatus.OTP_VERIFIED });
    }

    async setPassword(params: { email: string; password: string }) {
        const { email, password } = params;

        const organizer = await organizerRepository.getByEmail(email);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }
        console.log(organizer);


        // If already verified, they should login instead
        if (organizer.status === IOrganizerStatus.VERIFIED) {
            throw new BadRequestError('Account already verified. Please login.');
        }

        if (organizer.status !== IOrganizerStatus.OTP_VERIFIED) {
            throw new BadRequestError('Please verify your email first.');
        }

        // Generate token FIRST to ensure JWT secrets are valid
        // This prevents the user from being stuck in a bad state if token generation fails
        const accessToken = await this.generateJWTToken(organizer._id.toString(), organizer.role);
        if (!accessToken) throw new InternalServerError('Failed to generate access token');
        console.log(accessToken);

        // Hash and save password, then update status
        const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
        console.log(hashedPassword);

        await organizerRepository.setPassword(email, hashedPassword);
        await organizerRepository.updateStatus(email, IOrganizerStatus.VERIFIED);

        // Get updated organizer
        const updatedOrganizer = await organizerRepository.getByEmail(email);

        return new SuccessResponse('Registration complete.', {
            accessToken,
            organizer: updatedOrganizer,
        });
    }

    // ========================================================================
    // LOGIN (2 Options)
    // ========================================================================

    async loginWithPassword(params: { email: string; password: string }) {
        const { email, password } = params;

        const organizer = await organizerRepository.getByEmailWithPassword(email);
        if (!organizer) {
            throw new NotFoundError('Organizer not found. Please register first.');
        }

        if (organizer.status !== IOrganizerStatus.VERIFIED) {
            throw new BadRequestError('Account not verified. Please complete registration.');
        }

        if (!organizer.password) {
            throw new BadRequestError('Password not set. Please use OTP login.');
        }

        const isMatch = await bcrypt.compare(password, organizer.password);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid email or password.');
        }

        const accessToken = await this.generateJWTToken(organizer._id.toString(), organizer.role);
        if (!accessToken) throw new InternalServerError('Failed to generate access token');

        const organizerData = await organizerRepository.getByEmail(email);

        return new SuccessResponse('Login successful.', {
            accessToken,
            organizer: organizerData,
        });
    }

    async loginWithOtp(params: { email: string }) {
        const { email } = params;

        const organizer = await organizerRepository.getByEmail(email);
        if (!organizer) {
            throw new NotFoundError('Organizer not found. Please register first.');
        }

        if (organizer.status !== IOrganizerStatus.VERIFIED) {
            throw new BadRequestError('Account not verified. Please complete registration.');
        }

        await this.sendOtp(email);

        return new SuccessResponse('OTP sent to email.');
    }

    async verifyLoginOtp(params: { email: string; otp: string }) {
        const { email, otp } = params;

        const organizer = await organizerRepository.getByEmailWithOtp(email);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }

        if (organizer.status !== IOrganizerStatus.VERIFIED) {
            throw new BadRequestError('Account not verified.');
        }

        await this.validateOtp(organizer, otp);
        await organizerRepository.clearOtp(email);

        const accessToken = await this.generateJWTToken(organizer._id.toString(), organizer.role);
        if (!accessToken) throw new InternalServerError('Failed to generate access token');

        const organizerData = await organizerRepository.getByEmail(email);

        return new SuccessResponse('Login successful.', {
            accessToken,
            organizer: organizerData,
        });
    }

    // ========================================================================
    // PASSWORD MANAGEMENT
    // ========================================================================

    async forgotPassword(email: string) {
        const organizer = await organizerRepository.getByEmail(email);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }

        if (organizer.status !== IOrganizerStatus.VERIFIED) {
            throw new BadRequestError('Account not verified.');
        }

        await this.sendOtp(email);

        return new SuccessResponse('OTP sent to email.');
    }

    async resetPassword(params: { email: string; otp: string; newPassword: string }) {
        const { email, otp, newPassword } = params;

        const organizer = await organizerRepository.getByEmailWithOtp(email);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }

        await this.validateOtp(organizer, otp);

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await organizerRepository.setPassword(email, hashedPassword);
        await organizerRepository.clearOtp(email);

        return new SuccessResponse('Password reset successfully.');
    }

    async changePassword(params: { organizerId: string; currentPassword: string; newPassword: string }) {
        const { organizerId, currentPassword, newPassword } = params;

        const organizer = await organizerRepository.getByEmailWithPassword(
            (await organizerRepository.getById(organizerId))?.email ?? ''
        );
        if (!organizer || !organizer.password) {
            throw new NotFoundError('Organizer not found.');
        }

        const isMatch = await bcrypt.compare(currentPassword, organizer.password);
        if (!isMatch) {
            throw new UnauthorizedError('Current password is incorrect.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await organizerRepository.updatePassword(organizerId, hashedPassword);

        return new SuccessResponse('Password changed successfully.');
    }

    // ========================================================================
    // PROFILE
    // ========================================================================

    async getProfile(organizerId: string) {
        const organizer = await organizerRepository.getById(organizerId);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }

        return new SuccessResponse('Profile fetched.', organizer);
    }

    async updateProfile(organizerId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
        const organizer = await organizerRepository.updateById(organizerId, data);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }

        return new SuccessResponse('Profile updated.', organizer);
    }

    async updateProfileImage(organizerId: string, imagePath: string) {
        const organizer = await organizerRepository.updateProfileImage(organizerId, imagePath);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }

        return new SuccessResponse('Profile image updated.', organizer);
    }

    async updateOrganization(organizerId: string, organization: { name?: string; logo?: string; description?: string }) {
        const organizer = await organizerRepository.updateOrganization(organizerId, organization);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }

        return new SuccessResponse('Organization details updated.', organizer);
    }

    // ========================================================================
    // TOKEN MANAGEMENT
    // ========================================================================

    async refreshToken(token: string) {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET) as { _id: string; role: string };
            const organizer = await organizerRepository.getById(decoded._id);

            if (!organizer) {
                throw new UnauthorizedError('Invalid token.');
            }

            const accessToken = await this.generateJWTToken(organizer._id.toString(), organizer.role);
            if (!accessToken) throw new InternalServerError('Failed to generate access token');

            return new SuccessResponse('Token refreshed.', { accessToken });
        } catch {
            throw new UnauthorizedError('Invalid or expired token.');
        }
    }

    async resendOtp(email: string) {
        const organizer = await organizerRepository.getByEmail(email);
        if (!organizer) {
            throw new NotFoundError('Organizer not found.');
        }

        await this.sendOtp(email);

        return new SuccessResponse('OTP sent to email.');
    }

    // ========================================================================
    // FCM TOKENS
    // ========================================================================

    async addFcmToken(organizerId: string, token: string) {
        await organizerRepository.addFcmToken(organizerId, token);
        return new SuccessResponse('FCM token added.');
    }

    async removeFcmToken(organizerId: string, token: string) {
        await organizerRepository.removeFcmToken(organizerId, token);
        return new SuccessResponse('FCM token removed.');
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private async sendOtp(email: string) {
        const otp = nanoid(6).toUpperCase();
        const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
        console.log('OTP:', otp);

        await organizerRepository.updateOtp(email, { code: otp, expiresAt });
        await mailService.sendEmail(email, 'otp.ejs', { otp }, 'Kria Sports - Email Verification OTP');
    }

    private async validateOtp(organizer: { otp?: { code: string; expiresAt: Date } }, inputOtp: string) {
        if (!organizer.otp?.code || !organizer.otp?.expiresAt) {
            throw new BadRequestError('OTP not found. Please request a new one.');
        }

        if (new Date() > organizer.otp.expiresAt) {
            throw new BadRequestError('OTP has expired. Please request a new one.');
        }

        if (organizer.otp.code !== inputOtp) {
            throw new BadRequestError('Invalid OTP.');
        }
    }

    private async generateJWTToken(organizerId: string, role: string) {
        const token = jwt.sign(
            { _id: organizerId, type: 'organizer', role },
            config.JWT_SECRET,
            { expiresIn: config.ACCESS_TOKEN_EXPIRY || '7d' }
        );

        const key = await encryptionKey(config.JWT_CACHE_ENCRYPTION_KEY);
        const encryptedData = await encode(token, key);
        await organizerJWTCacheManager.set({ userId: organizerId }, encryptedData);

        return token;
    }
}

export const organizerAuthService = new OrganizerAuthService();
