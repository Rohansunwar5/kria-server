import { Router } from 'express';
import * as organizerAuthController from '../controllers/organizerAuth.controller';
import { isOrganizerLoggedIn } from '../middlewares/isOrganizerLoggedIn.middleware';
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
    updateOrganizationValidator,
} from '../middlewares/validators/auth.validator';
import { profileImageUpload } from '../utils/multer.util';

const organizerAuthRouter = Router();

// PUBLIC ROUTES - Registration

organizerAuthRouter.post('/register', registerValidator, asyncHandler(organizerAuthController.register));
organizerAuthRouter.post('/verify-otp', verifyOtpValidator, asyncHandler(organizerAuthController.verifyRegistrationOtp));
organizerAuthRouter.post('/set-password', setPasswordValidator, asyncHandler(organizerAuthController.setPassword));
organizerAuthRouter.post('/resend-otp', resendOtpValidator, asyncHandler(organizerAuthController.resendOtp));

// PUBLIC ROUTES - Login

organizerAuthRouter.post('/login', loginWithPasswordValidator, asyncHandler(organizerAuthController.loginWithPassword));
organizerAuthRouter.post('/login/otp', loginWithOtpValidator, asyncHandler(organizerAuthController.loginWithOtp));
organizerAuthRouter.post('/login/otp/verify', verifyOtpValidator, asyncHandler(organizerAuthController.verifyLoginOtp));

// PUBLIC ROUTES - Password Recovery

organizerAuthRouter.post('/forgot-password', forgotPasswordValidator, asyncHandler(organizerAuthController.forgotPassword));
organizerAuthRouter.post('/reset-password', resetPasswordValidator, asyncHandler(organizerAuthController.resetPassword));

// PUBLIC ROUTES - Token Refresh

organizerAuthRouter.post('/refresh-token', refreshTokenValidator, asyncHandler(organizerAuthController.refreshToken));

// PROTECTED ROUTES - Profile

organizerAuthRouter.get('/profile', isOrganizerLoggedIn, asyncHandler(organizerAuthController.getProfile));
organizerAuthRouter.patch('/profile', isOrganizerLoggedIn, updateProfileValidator, asyncHandler(organizerAuthController.updateProfile));
organizerAuthRouter.put('/profile-image', isOrganizerLoggedIn, profileImageUpload.single('image'), asyncHandler(organizerAuthController.updateProfileImage));
organizerAuthRouter.patch('/organization', isOrganizerLoggedIn, updateOrganizationValidator, asyncHandler(organizerAuthController.updateOrganization));

// PROTECTED ROUTES - Password Change

organizerAuthRouter.post('/change-password', isOrganizerLoggedIn, changePasswordValidator, asyncHandler(organizerAuthController.changePassword));

// PROTECTED ROUTES - FCM Token

organizerAuthRouter.post('/fcm-token', isOrganizerLoggedIn, fcmTokenValidator, asyncHandler(organizerAuthController.addFcmToken));
organizerAuthRouter.delete('/fcm-token', isOrganizerLoggedIn, fcmTokenValidator, asyncHandler(organizerAuthController.removeFcmToken));

export default organizerAuthRouter;
