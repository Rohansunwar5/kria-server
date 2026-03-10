import mongoose from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

export enum IAuctionStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    PAUSED = 'paused',
    SOLD = 'sold',
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
        registrationId: {
            type: String,
            required: true,
        },
        playerName: {
            type: String,
            required: true,
        },
        teamId: {
            type: String,
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
            type: String,
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

const bidHistoryEntrySchema = new mongoose.Schema(
    {
        teamId: { type: String, required: true },
        teamName: { type: String, required: true },
        amount: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

// ============================================================================
// SCHEMA
// ============================================================================

const auctionSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: String,
            required: true,
        },
        categoryId: {
            type: String,
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
        playerQueue: [{
            type: String,
        }],
        currentPlayerIndex: {
            type: Number,
            default: 0,
        },
        currentRegistrationId: {
            type: String,
        },
        lastSoldResult: {
            registrationId: { type: String },
            playerName: { type: String },
            teamId: { type: String },
            teamName: { type: String },
            teamColor: { type: String },
            soldPrice: { type: Number },
            timestamp: { type: Date },
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
            hardLimit: {
                type: Number,
                min: 0,
                default: 0,
            },
        },
        liveBid: {
            currentPrice: { type: Number, default: 0 },
            highestBidderId: { type: String, default: '' },
            highestBidderName: { type: String, default: '' },
            bidHistory: [bidHistoryEntrySchema],
            tiedTeams: [{ type: String }],
            tieBreakerActive: { type: Boolean, default: false },
            spinWinnerId: { type: String, default: null },
            spinStartedAt: { type: Date, default: null }
        },
        unsoldQueue: [{ type: String }],
        rotationCount: { type: Number, default: 0 },
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
    registrationId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    finalPrice: number;
    auctionType: string;
    recordedBy: string;
    timestamp: Date;
}

export interface ILastSoldResult {
    registrationId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    teamColor: string;
    soldPrice: number;
    timestamp: Date;
}

export interface IAuction extends mongoose.Document {
    _id: string;
    tournamentId: string;
    categoryId: string;
    status: string;
    auctionType: string;
    playerQueue: string[];
    currentPlayerIndex: number;
    currentRegistrationId?: string;
    lastSoldResult?: ILastSoldResult;
    settings: {
        minBidIncrement: number;
        bidDurationSeconds: number;
        hardLimit: number;
    };
    liveBid: {
        currentPrice: number;
        highestBidderId: string;
        highestBidderName: string;
        bidHistory: { teamId: string; teamName: string; amount: number; timestamp: Date }[];
        tiedTeams: string[];
        tieBreakerActive: boolean;
        spinWinnerId: string | null;
        spinStartedAt: Date | null;
    };
    unsoldQueue: string[];
    rotationCount: number;
    logs: IAuctionLog[];
    startedAt?: Date;
    completedAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IAuction>('Auction', auctionSchema);
