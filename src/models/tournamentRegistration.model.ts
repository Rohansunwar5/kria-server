import mongoose from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

export enum ITournamentRegistrationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    AUCTIONED = 'auctioned',
    ASSIGNED = 'assigned',
    WITHDRAWN = 'withdrawn'
}

export enum ISkillLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    PROFESSIONAL = 'professional'
}

export enum IPlayerGender {
    MALE = 'male',
    FEMALE = 'female'
}

const tournamentRegistrationSchema = new mongoose.Schema(
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
        profile: {
            name: {
                type: String,
                required: true,
                trim: true,
            },
            age: {
                type: Number,
                required: true,
                min: 1,
            },
            gender: {
                type: String,
                required: true,
                enum: IPlayerGender,
            },
            phone: {
                type: String,
                required: true,
                trim: true,
            },
            photo: {
                type: String,
            },
            skillLevel: {
                type: String,
                enum: ISkillLevel,
            },
        },
        status: {
            type: String,
            required: true,
            enum: ITournamentRegistrationStatus,
            default: ITournamentRegistrationStatus.PENDING,
        },
        teamId: {
            type: String,
        },
        auctionData: {
            basePrice: {
                type: Number,
                min: 0,
                default: 1000,
            },
            soldPrice: {
                type: Number,
                min: 0,
            },
            auctionedAt: {
                type: Date,
            },
        },
        stats: {
            matchesPlayed: {
                type: Number,
                default: 0,
                min: 0,
            },
            matchesWon: {
                type: Number,
                default: 0,
                min: 0,
            },
            pointsContributed: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

tournamentRegistrationSchema.index({ tournamentId: 1, categoryId: 1, status: 1 });
tournamentRegistrationSchema.index({ playerId: 1 });
tournamentRegistrationSchema.index({ teamId: 1 });
tournamentRegistrationSchema.index({ playerId: 1, tournamentId: 1, categoryId: 1 }, { unique: true });

export interface ITournamentRegistration extends mongoose.Document {
    _id: string;
    playerId: string;
    tournamentId: string;
    categoryId: string;
    profile: {
        name: string;
        age: number;
        gender: string;
        phone: string;
        photo?: string;
        skillLevel?: string;
    };
    status: string;
    teamId?: string;
    auctionData?: {
        basePrice: number;
        soldPrice?: number;
        auctionedAt?: Date;
    };
    stats: {
        matchesPlayed: number;
        matchesWon: number;
        pointsContributed: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<ITournamentRegistration>('TournamentRegistration', tournamentRegistrationSchema);