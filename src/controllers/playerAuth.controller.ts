import { Request, Response, NextFunction } from 'express';
import { playerAuthService } from '../services/playerAuth.service';

// ============================================================================
// REGISTRATION
// ============================================================================

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, phone } = req.body;
    const response = await playerAuthService.register({ firstName, lastName, email, phone });
    next(response);
};

export const verifyRegistrationOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const response = await playerAuthService.verifyRegistrationOtp({ email, otp });
    next(response);
};

export const setPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const response = await playerAuthService.setPassword({ email, password });
    next(response);
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const response = await playerAuthService.resendOtp(email);
    next(response);
};

// ============================================================================
// LOGIN
// ============================================================================

export const loginWithPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const response = await playerAuthService.loginWithPassword({ email, password });
    next(response);
};

export const loginWithOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const response = await playerAuthService.loginWithOtp({ email });
    next(response);
};

export const verifyLoginOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const response = await playerAuthService.verifyLoginOtp({ email, otp });
    next(response);
};

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const response = await playerAuthService.forgotPassword(email);
    next(response);
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, newPassword } = req.body;
    const response = await playerAuthService.resetPassword({ email, otp, newPassword });
    next(response);
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.player;
    const { currentPassword, newPassword } = req.body;
    const response = await playerAuthService.changePassword({ playerId: _id, currentPassword, newPassword });
    next(response);
};

// ============================================================================
// PROFILE
// ============================================================================

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.player;
    const response = await playerAuthService.getProfile(_id);
    next(response);
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.player;
    const { firstName, lastName, phone } = req.body;
    const response = await playerAuthService.updateProfile(_id, { firstName, lastName, phone });
    next(response);
};

export const updateProfileImage = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.player;
    const imagePath = req.file?.path ?? '';
    const response = await playerAuthService.updateProfileImage(_id, imagePath);
    next(response);
};

// ============================================================================
// TOKENS
// ============================================================================

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;
    const response = await playerAuthService.refreshToken(refreshToken);
    next(response);
};

// ============================================================================
// FCM
// ============================================================================

export const addFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.player;
    const { token } = req.body;
    const response = await playerAuthService.addFcmToken(_id, token);
    next(response);
};

export const removeFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.player;
    const { token } = req.body;
    const response = await playerAuthService.removeFcmToken(_id, token);
    next(response);
};
