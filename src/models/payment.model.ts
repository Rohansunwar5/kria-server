import mongoose from 'mongoose';

export enum IPaymentStatus {
    CREATED = 'created',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

const paymentSchema = new mongoose.Schema(
    {
        playerId: {
            type: String,
            required: true,
        },
        tournamentId: {
            type: String,
            required: true,
        },
        categoryId: {
            type: String,
            required: true,
        },
        registrationId: {
            type: String,
        },
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        baseAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        feeBreakdown: {
            razorpayFee: { type: Number, default: 0 },
            platformFee: { type: Number, default: 0 },
            gst: { type: Number, default: 0 },
        },
        currency: {
            type: String,
            required: true,
            default: 'INR',
        },
        status: {
            type: String,
            required: true,
            enum: IPaymentStatus,
            default: IPaymentStatus.CREATED,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

paymentSchema.index({ playerId: 1, tournamentId: 1, categoryId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ status: 1 });

export interface IPayment extends mongoose.Document {
    _id: string;
    playerId: string;
    tournamentId: string;
    categoryId: string;
    registrationId?: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    baseAmount: number;
    feeBreakdown: {
        razorpayFee: number;
        platformFee: number;
        gst: number;
    };
    currency: string;
    status: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IPayment>('Payment', paymentSchema);
