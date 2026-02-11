import mongoose from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

export enum IPlayerStatus {
    PENDING = 'pending',
    OTP_VERIFIED = 'otp_verified',
    VERIFIED = 'verified',
    SUSPENDED = 'suspended'
}

export enum IAuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google'
}

// ============================================================================
// SCHEMA
// ============================================================================

const playerSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            maxLength: 50,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            maxLength: 50,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            minLength: 8,
        },
        status: {
            type: String,
            required: true,
            enum: IPlayerStatus,
            default: IPlayerStatus.PENDING,
        },
        authProvider: {
            type: String,
            required: true,
            enum: IAuthProvider,
            default: IAuthProvider.EMAIL,
        },
        profileImage: {
            type: String,
        },
        fcmTokens: [{
            type: String,
        }],
        otp: {
            code: { type: String },
            expiresAt: { type: Date },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// ============================================================================
// INDEXES
// ============================================================================

playerSchema.index({ email: 1 });
playerSchema.index({ phone: 1 });
playerSchema.index({ status: 1 });

// ============================================================================
// INTERFACE
// ============================================================================

export interface IPlayer extends mongoose.Document {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
    status: string;
    authProvider: string;
    profileImage?: string;
    fcmTokens: string[];
    otp?: {
        code: string;
        expiresAt: Date;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IPlayer>('Player', playerSchema);
