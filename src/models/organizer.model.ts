import mongoose from 'mongoose';

export enum IOrganizerRole {
    ORGANIZER = 'organizer',
    STAFF = 'staff'
}

export enum IOrganizerStatus {
    PENDING = 'pending',
    OTP_VERIFIED = 'otp_verified',
    VERIFIED = 'verified',
    SUSPENDED = 'suspended'
}

export enum IOrganizerAuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google'
}

const organizerSchema = new mongoose.Schema(
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
        role: {
            type: String,
            required: true,
            enum: IOrganizerRole,
            default: IOrganizerRole.ORGANIZER,
        },
        status: {
            type: String,
            required: true,
            enum: IOrganizerStatus,
            default: IOrganizerStatus.PENDING,
        },
        authProvider: {
            type: String,
            required: true,
            enum: IOrganizerAuthProvider,
            default: IOrganizerAuthProvider.EMAIL,
        },
        profileImage: {
            type: String,
        },
        // Organization details
        organization: {
            name: { type: String, trim: true },
            logo: { type: String },
            description: { type: String },
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

organizerSchema.index({ email: 1 });
organizerSchema.index({ phone: 1 });
organizerSchema.index({ status: 1, role: 1 });

export interface IOrganizer extends mongoose.Document {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
    role: string;
    status: string;
    authProvider: string;
    profileImage?: string;
    organization?: {
        name?: string;
        logo?: string;
        description?: string;
    };
    fcmTokens: string[];
    otp?: {
        code: string;
        expiresAt: Date;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IOrganizer>('Organizer', organizerSchema);
