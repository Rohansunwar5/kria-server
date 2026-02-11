import mongoose from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

export enum IMatchStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    WALKOVER = 'walkover'
}

// ============================================================================
// SUB-SCHEMAS - Flexible scoring for different sports
// ============================================================================

// For points-based sports (Badminton, Table Tennis)
const pointsScoreSchema = new mongoose.Schema(
    {
        gameNumber: { type: Number, required: true, min: 1 },
        team1Score: { type: Number, required: true, min: 0, default: 0 },
        team2Score: { type: Number, required: true, min: 0, default: 0 },
        winnerId: { type: mongoose.Types.ObjectId },
    },
    { _id: false }
);

// For sets-based sports (Tennis)
const setsScoreSchema = new mongoose.Schema(
    {
        setNumber: { type: Number, required: true, min: 1 },
        team1Games: { type: Number, required: true, min: 0, default: 0 },
        team2Games: { type: Number, required: true, min: 0, default: 0 },
        winnerId: { type: mongoose.Types.ObjectId },
        isTieBreak: { type: Boolean, default: false },
        tieBreakScore: {
            team1: { type: Number, min: 0 },
            team2: { type: Number, min: 0 },
        },
    },
    { _id: false }
);

// For time-based sports (Football, Kabaddi)
const periodScoreSchema = new mongoose.Schema(
    {
        periodNumber: { type: Number, required: true, min: 1 },
        periodName: { type: String }, // "First Half", "Second Half", "Extra Time"
        team1Score: { type: Number, required: true, min: 0, default: 0 },
        team2Score: { type: Number, required: true, min: 0, default: 0 },
    },
    { _id: false }
);

// For cricket (innings-based)
const inningsScoreSchema = new mongoose.Schema(
    {
        inningsNumber: { type: Number, required: true, min: 1 },
        battingTeamId: { type: mongoose.Types.ObjectId, required: true },
        runs: { type: Number, required: true, min: 0, default: 0 },
        wickets: { type: Number, required: true, min: 0, max: 10, default: 0 },
        overs: { type: Number, required: true, min: 0, default: 0 },
        balls: { type: Number, min: 0, max: 5, default: 0 },
        extras: {
            wides: { type: Number, default: 0 },
            noBalls: { type: Number, default: 0 },
            byes: { type: Number, default: 0 },
            legByes: { type: Number, default: 0 },
        },
        isDeclared: { type: Boolean, default: false },
        isAllOut: { type: Boolean, default: false },
    },
    { _id: false }
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const matchSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        categoryId: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        sportType: {
            type: String,
            required: true,
        },
        bracketRound: {
            type: String,
            required: true,
            trim: true,
        },
        matchNumber: {
            type: Number,
            required: true,
            min: 1,
        },
        teams: {
            team1Id: {
                type: mongoose.Types.ObjectId,
                required: true,
            },
            team2Id: {
                type: mongoose.Types.ObjectId,
                required: true,
            },
            team1Name: {
                type: String,
                required: true,
            },
            team2Name: {
                type: String,
                required: true,
            },
        },
        players: {
            team1Players: [{
                type: mongoose.Types.ObjectId,
            }],
            team2Players: [{
                type: mongoose.Types.ObjectId,
            }],
        },
        schedule: {
            date: { type: Date },
            time: { type: String, trim: true },
            court: { type: String, trim: true },
            venue: { type: String, trim: true },
        },
        status: {
            type: String,
            required: true,
            enum: IMatchStatus,
            default: IMatchStatus.SCHEDULED,
        },

        // ========== FLEXIBLE SCORING ==========
        // Points-based (Badminton, Table Tennis)
        gameScores: [pointsScoreSchema],

        // Sets-based (Tennis)
        setScores: [setsScoreSchema],

        // Period-based (Football, Kabaddi)
        periodScores: [periodScoreSchema],

        // Innings-based (Cricket)
        inningsScores: [inningsScoreSchema],

        // Match configuration (copied from category at match creation)
        matchConfig: {
            bestOf: { type: Number },
            pointsToWin: { type: Number },
            maxOvers: { type: Number },
            periodMinutes: { type: Number },
            numberOfPeriods: { type: Number },
        },

        // Final result summary (works for all sports)
        result: {
            team1Summary: { type: String }, // "2 sets", "3-1", "245/8"
            team2Summary: { type: String },
            team1Total: { type: Number }, // For simple comparison
            team2Total: { type: Number },
            marginOfVictory: { type: String }, // "by 2 games", "by 50 runs"
        },

        winnerId: {
            type: mongoose.Types.ObjectId,
        },
        winReason: {
            type: String, // "by_score", "walkover", "forfeit", "dls"
        },
        recordedBy: {
            type: mongoose.Types.ObjectId,
        },
        lockedAt: {
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

matchSchema.index({ tournamentId: 1, categoryId: 1, status: 1 });
matchSchema.index({ 'teams.team1Id': 1 });
matchSchema.index({ 'teams.team2Id': 1 });
matchSchema.index({ 'schedule.date': 1 });
matchSchema.index({ categoryId: 1, bracketRound: 1, matchNumber: 1 }, { unique: true });

// ============================================================================
// INTERFACES
// ============================================================================

export interface IGameScore {
    gameNumber: number;
    team1Score: number;
    team2Score: number;
    winnerId?: mongoose.Types.ObjectId;
}

export interface ISetScore {
    setNumber: number;
    team1Games: number;
    team2Games: number;
    winnerId?: mongoose.Types.ObjectId;
    isTieBreak: boolean;
    tieBreakScore?: {
        team1: number;
        team2: number;
    };
}

export interface IPeriodScore {
    periodNumber: number;
    periodName?: string;
    team1Score: number;
    team2Score: number;
}

export interface IInningsScore {
    inningsNumber: number;
    battingTeamId: mongoose.Types.ObjectId;
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    extras: {
        wides: number;
        noBalls: number;
        byes: number;
        legByes: number;
    };
    isDeclared: boolean;
    isAllOut: boolean;
}

export interface IMatch extends mongoose.Document {
    _id: string;
    tournamentId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    sportType: string;
    bracketRound: string;
    matchNumber: number;
    teams: {
        team1Id: mongoose.Types.ObjectId;
        team2Id: mongoose.Types.ObjectId;
        team1Name: string;
        team2Name: string;
    };
    players: {
        team1Players: mongoose.Types.ObjectId[];
        team2Players: mongoose.Types.ObjectId[];
    };
    schedule?: {
        date?: Date;
        time?: string;
        court?: string;
        venue?: string;
    };
    status: string;
    gameScores: IGameScore[];
    setScores: ISetScore[];
    periodScores: IPeriodScore[];
    inningsScores: IInningsScore[];
    matchConfig?: {
        bestOf?: number;
        pointsToWin?: number;
        maxOvers?: number;
        periodMinutes?: number;
        numberOfPeriods?: number;
    };
    result?: {
        team1Summary?: string;
        team2Summary?: string;
        team1Total?: number;
        team2Total?: number;
        marginOfVictory?: string;
    };
    winnerId?: mongoose.Types.ObjectId;
    winReason?: string;
    recordedBy?: mongoose.Types.ObjectId;
    lockedAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IMatch>('Match', matchSchema);
