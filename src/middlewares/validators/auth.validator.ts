import { validateRequest } from '.';
import { isRequired } from '../../utils/validator.utils';

// ============================================================================
// REGISTRATION
// ============================================================================

export const registerValidator = [
  isRequired('firstName'),
  isRequired('lastName'),
  isRequired('email'),
  isRequired('phone'),
  ...validateRequest
];

export const verifyOtpValidator = [
  isRequired('email'),
  isRequired('otp'),
  ...validateRequest
];

export const setPasswordValidator = [
  isRequired('email'),
  isRequired('password'),
  ...validateRequest
];

export const resendOtpValidator = [
  isRequired('email'),
  ...validateRequest
];

// ============================================================================
// LOGIN
// ============================================================================

export const loginWithPasswordValidator = [
  isRequired('email'),
  isRequired('password'),
  ...validateRequest
];

export const loginWithOtpValidator = [
  isRequired('email'),
  ...validateRequest
];

// ============================================================================
// OAUTH & TOKEN
// ============================================================================

export const googleAuthValidator = [
  isRequired('code'),
  ...validateRequest
];

export const refreshTokenValidator = [
  isRequired('refreshToken'),
  ...validateRequest
];

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

export const forgotPasswordValidator = [
  isRequired('email'),
  ...validateRequest
];

export const resetPasswordValidator = [
  isRequired('email'),
  isRequired('otp'),
  isRequired('newPassword'),
  ...validateRequest
];

export const changePasswordValidator = [
  isRequired('currentPassword'),
  isRequired('newPassword'),
  ...validateRequest
];

// ============================================================================
// PROFILE
// ============================================================================

export const updateProfileValidator = [
  isRequired('firstName', true),
  isRequired('lastName', true),
  isRequired('phone', true),
  ...validateRequest
];

// ============================================================================
// FCM TOKEN
// ============================================================================

export const fcmTokenValidator = [
  isRequired('token'),
  ...validateRequest
];

// ============================================================================
// ORGANIZATION (Organizer only)
// ============================================================================

export const updateOrganizationValidator = [
  isRequired('name', true),
  isRequired('description', true),
  ...validateRequest
];