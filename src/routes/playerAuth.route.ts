import { Router } from 'express';
import * as playerAuthController from '../controllers/playerAuth.controller';
import { isPlayerLoggedIn } from '../middlewares/isPlayerLoggedIn.middleware';
import { asyncHandler } from '../utils/asynchandler';
import {
    registerValidator,
    verifyOtpValidator,
    setPasswordValidator,
    resendOtpValidator,
    loginWithPasswordValidator,
    loginWithOtpValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator,
    refreshTokenValidator,
    fcmTokenValidator,
    updateProfileValidator,
} from '../middlewares/validators/auth.validator';
import { profileImageUpload } from '../utils/multer.util';

const playerAuthRouter = Router();

// PUBLIC ROUTES - Registration

playerAuthRouter.post('/register', registerValidator, asyncHandler(playerAuthController.register));
playerAuthRouter.post('/verify-otp', verifyOtpValidator, asyncHandler(playerAuthController.verifyRegistrationOtp));
playerAuthRouter.post('/set-password', setPasswordValidator, asyncHandler(playerAuthController.setPassword));
playerAuthRouter.post('/resend-otp', resendOtpValidator, asyncHandler(playerAuthController.resendOtp));

// PUBLIC ROUTES - Login

playerAuthRouter.post('/login', loginWithPasswordValidator, asyncHandler(playerAuthController.loginWithPassword));
playerAuthRouter.post('/login/otp', loginWithOtpValidator, asyncHandler(playerAuthController.loginWithOtp));
playerAuthRouter.post('/login/otp/verify', verifyOtpValidator, asyncHandler(playerAuthController.verifyLoginOtp));

// PUBLIC ROUTES - Password Recovery

playerAuthRouter.post('/forgot-password', forgotPasswordValidator, asyncHandler(playerAuthController.forgotPassword));
playerAuthRouter.post('/reset-password', resetPasswordValidator, asyncHandler(playerAuthController.resetPassword));

// PUBLIC ROUTES - Token Refresh

playerAuthRouter.post('/refresh-token', refreshTokenValidator, asyncHandler(playerAuthController.refreshToken));

// PROTECTED ROUTES - Profile

playerAuthRouter.get('/profile', isPlayerLoggedIn, asyncHandler(playerAuthController.getProfile));
playerAuthRouter.patch('/profile', isPlayerLoggedIn, updateProfileValidator, asyncHandler(playerAuthController.updateProfile));
playerAuthRouter.put('/profile-image', isPlayerLoggedIn, profileImageUpload.single('image'), asyncHandler(playerAuthController.updateProfileImage));

// PROTECTED ROUTES - Password Change

playerAuthRouter.post('/change-password', isPlayerLoggedIn, changePasswordValidator, asyncHandler(playerAuthController.changePassword));

// PROTECTED ROUTES - FCM Token

playerAuthRouter.post('/fcm-token', isPlayerLoggedIn, fcmTokenValidator, asyncHandler(playerAuthController.addFcmToken));
playerAuthRouter.delete('/fcm-token', isPlayerLoggedIn, fcmTokenValidator, asyncHandler(playerAuthController.removeFcmToken));

export default playerAuthRouter;
