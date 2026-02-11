import mongoose from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

export enum ISport {
    BADMINTON = 'badminton',
    CRICKET = 'cricket',
    FOOTBALL = 'football',
    KABADDI = 'kabaddi',
    TABLE_TENNIS = 'table_tennis',
    TENNIS = 'tennis'
}

export enum ITournamentStatus {
    DRAFT = 'draft',
    REGISTRATION_OPEN = 'registration_open',
    REGISTRATION_CLOSED = 'registration_closed',
    AUCTION_IN_PROGRESS = 'auction_in_progress',
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum IAuctionType {
    MANUAL = 'manual',
    LIVE = 'live'
}

// ============================================================================
// SCHEMA
// ============================================================================

const tournamentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxLength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxLength: 2000,
        },
        sport: {
            type: String,
            required: true,
            enum: ISport,
            default: ISport.BADMINTON,
        },
        bannerImage: {
            type: String,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        venue: {
            name: {
                type: String,
                required: true,
                trim: true,
            },
            address: {
                type: String,
                trim: true,
            },
            city: {
                type: String,
                required: true,
                trim: true,
            },
            coordinates: {
                lat: { type: Number },
                lng: { type: Number },
            },
        },
        registrationDeadline: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ITournamentStatus,
            default: ITournamentStatus.DRAFT,
        },
        createdBy: {
            type: String,
            required: true,
        },
        staffIds: [{
            type: String,
        }],
        settings: {
            maxTeams: {
                type: Number,
                min: 2,
                default: 8,
            },
            defaultBudget: {
                type: Number,
                min: 0,
                default: 100000,
            },
            auctionType: {
                type: String,
                enum: IAuctionType,
                default: IAuctionType.MANUAL,
            },
            allowLateRegistration: {
                type: Boolean,
                default: false,
            },
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

tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ createdBy: 1 });
tournamentSchema.index({ 'venue.city': 1 });
tournamentSchema.index({ sport: 1, status: 1 });

// ============================================================================
// INTERFACE
// ============================================================================

export interface ITournament extends mongoose.Document {
    _id: string;
    name: string;
    description?: string;
    sport: string;
    bannerImage?: string;
    startDate: Date;
    endDate: Date;
    venue: {
        name: string;
        address?: string;
        city: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    registrationDeadline: Date;
    status: string;
    createdBy: string;
    staffIds: string[];
    settings: {
        maxTeams: number;
        defaultBudget: number;
        auctionType: string;
        allowLateRegistration: boolean;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<ITournament>('Tournament', tournamentSchema);
