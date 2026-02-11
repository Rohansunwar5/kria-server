import mongoose from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

export enum IGender {
    MALE = 'male',
    FEMALE = 'female',
    MIXED = 'mixed'
}

export enum IMatchType {
    SINGLES = 'singles',
    DOUBLES = 'doubles'
}

export enum IBracketType {
    LEAGUE = 'league',
    KNOCKOUT = 'knockout',
    HYBRID = 'hybrid'
}

export enum ICategoryStatus {
    SETUP = 'setup',
    REGISTRATION = 'registration',
    AUCTION = 'auction',
    BRACKET_CONFIGURED = 'bracket_configured',
    ONGOING = 'ongoing',
    COMPLETED = 'completed'
}

// ============================================================================
// SCHEMA
// ============================================================================

const categorySchema = new mongoose.Schema(
    {
        tournamentId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxLength: 100,
        },
        gender: {
            type: String,
            required: true,
            enum: IGender,
        },
        ageGroup: {
            min: {
                type: Number,
                min: 0,
            },
            max: {
                type: Number,
                min: 0,
            },
            label: {
                type: String,
                required: true,
                trim: true,
            },
        },
        matchType: {
            type: String,
            required: true,
            enum: IMatchType,
        },
        matchFormat: {
            bestOf: {
                type: Number,
                required: true,
                enum: [1, 3, 5],
                default: 3,
            },
            pointsPerGame: {
                type: Number,
                required: true,
                min: 1,
                default: 21,
            },
            tieBreakPoints: {
                type: Number,
                min: 1,
            },
        },
        bracketType: {
            type: String,
            required: true,
            enum: IBracketType,
            default: IBracketType.KNOCKOUT,
        },
        hybridConfig: {
            leagueSize: {
                type: Number,
                min: 2,
            },
            topN: {
                type: Number,
                min: 1,
            },
        },
        status: {
            type: String,
            required: true,
            enum: ICategoryStatus,
            default: ICategoryStatus.SETUP,
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

categorySchema.index({ tournamentId: 1 });
categorySchema.index({ tournamentId: 1, name: 1 }, { unique: true });
categorySchema.index({ status: 1 });

// ============================================================================
// INTERFACE
// ============================================================================

export interface ICategory extends mongoose.Document {
    _id: string;
    tournamentId: string;
    name: string;
    gender: string;
    ageGroup: {
        min?: number;
        max?: number;
        label: string;
    };
    matchType: string;
    matchFormat: {
        bestOf: number;
        pointsPerGame: number;
        tieBreakPoints?: number;
    };
    bracketType: string;
    hybridConfig?: {
        leagueSize: number;
        topN: number;
    };
    status: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<ICategory>('Category', categorySchema);
