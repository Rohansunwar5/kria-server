import { Request, Response, NextFunction } from 'express';
import { organizerAuthService } from '../services/organizerAuth.service';

// ============================================================================
// REGISTRATION
// ============================================================================

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, phone, role } = req.body;
    const response = await organizerAuthService.register({ firstName, lastName, email, phone, role });
    next(response);
};

export const verifyRegistrationOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const response = await organizerAuthService.verifyRegistrationOtp({ email, otp });
    next(response);
};

export const setPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const response = await organizerAuthService.setPassword({ email, password });
    next(response);
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const response = await organizerAuthService.resendOtp(email);
    next(response);
};

// ============================================================================
// LOGIN
// ============================================================================

export const loginWithPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const response = await organizerAuthService.loginWithPassword({ email, password });
    next(response);
};

export const loginWithOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const response = await organizerAuthService.loginWithOtp({ email });
    next(response);
};

export const verifyLoginOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const response = await organizerAuthService.verifyLoginOtp({ email, otp });
    next(response);
};

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const response = await organizerAuthService.forgotPassword(email);
    next(response);
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, newPassword } = req.body;
    const response = await organizerAuthService.resetPassword({ email, otp, newPassword });
    next(response);
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.organizer;
    const { currentPassword, newPassword } = req.body;
    const response = await organizerAuthService.changePassword({ organizerId: _id, currentPassword, newPassword });
    next(response);
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.organizer;
    const response = await organizerAuthService.getProfile(_id);
    next(response);
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.organizer;
    const { firstName, lastName, phone } = req.body;
    const response = await organizerAuthService.updateProfile(_id, { firstName, lastName, phone });
    next(response);
};

export const updateProfileImage = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.organizer;
    const imagePath = req.file?.path ?? '';
    const response = await organizerAuthService.updateProfileImage(_id, imagePath);
    next(response);
};

export const updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.organizer;
    const { name, logo, description } = req.body;
    const response = await organizerAuthService.updateOrganization(_id, { name, logo, description });
    next(response);
};

// ============================================================================
// TOKENS
// ============================================================================

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;
    const response = await organizerAuthService.refreshToken(refreshToken);
    next(response);
};

// ============================================================================
// FCM
// ============================================================================

export const addFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.organizer;
    const { token } = req.body;
    const response = await organizerAuthService.addFcmToken(_id, token);
    next(response);
};

export const removeFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.organizer;
    const { token } = req.body;
    const response = await organizerAuthService.removeFcmToken(_id, token);
    next(response);
};
