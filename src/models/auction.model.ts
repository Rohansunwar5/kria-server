import mongoose from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

export enum IAuctionStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    PAUSED = 'paused',
    COMPLETED = 'completed'
}

export enum IAuctionLogType {
    MANUAL = 'manual',
    LIVE = 'live'
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const auctionLogSchema = new mongoose.Schema(
    {
        playerId: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        playerName: {
            type: String,
            required: true,
        },
        teamId: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        teamName: {
            type: String,
            required: true,
        },
        finalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        auctionType: {
            type: String,
            required: true,
            enum: IAuctionLogType,
        },
        recordedBy: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { _id: true }
);

// ============================================================================
// SCHEMA
// ============================================================================

const auctionSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        categoryId: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: IAuctionStatus,
            default: IAuctionStatus.NOT_STARTED,
        },
        auctionType: {
            type: String,
            required: true,
            enum: IAuctionLogType,
            default: IAuctionLogType.MANUAL,
        },
        currentPlayerId: {
            type: mongoose.Types.ObjectId,
        },
        settings: {
            minBidIncrement: {
                type: Number,
                required: true,
                min: 1,
                default: 100,
            },
            bidDurationSeconds: {
                type: Number,
                min: 5,
                default: 30,
            },
        },
        logs: [auctionLogSchema],
        startedAt: {
            type: Date,
        },
        completedAt: {
            type: Date,
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

auctionSchema.index({ tournamentId: 1, categoryId: 1 }, { unique: true });
auctionSchema.index({ status: 1 });
auctionSchema.index({ 'logs.timestamp': -1 });

// ============================================================================
// INTERFACES
// ============================================================================

export interface IAuctionLog {
    _id: string;
    playerId: mongoose.Types.ObjectId;
    playerName: string;
    teamId: mongoose.Types.ObjectId;
    teamName: string;
    finalPrice: number;
    auctionType: string;
    recordedBy: mongoose.Types.ObjectId;
    timestamp: Date;
}

export interface IAuction extends mongoose.Document {
    _id: string;
    tournamentId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    status: string;
    auctionType: string;
    currentPlayerId?: mongoose.Types.ObjectId;
    settings: {
        minBidIncrement: number;
        bidDurationSeconds: number;
    };
    logs: IAuctionLog[];
    startedAt?: Date;
    completedAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IAuction>('Auction', auctionSchema);
