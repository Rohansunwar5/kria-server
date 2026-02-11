import mongoose from 'mongoose';

export enum ISportType {
    BADMINTON = 'badminton',
    CRICKET = 'cricket',
    FOOTBALL = 'football',
    KABADDI = 'kabaddi',
    TABLE_TENNIS = 'table_tennis',
    TENNIS = 'tennis'
}

export enum IScoringType {
    POINTS = 'points', // Simple points (badminton, table tennis)
    SETS_GAMES = 'sets_games', // Tennis style (sets -> games -> points)
    GOALS = 'goals', // Football
    RUNS_WICKETS = 'runs_wickets', // Cricket
    RAID_POINTS = 'raid_points' // Kabaddi
}

export enum IMatchDurationType {
    POINTS_BASED = 'points_based', // Play until X points
    TIME_BASED = 'time_based', // Play for X minutes
    OVERS_BASED = 'overs_based', // Cricket - play X overs
    SETS_BASED = 'sets_based' // Play until X sets won
}

const sportConfigSchema = new mongoose.Schema(
    {
        sport: {
            type: String,
            required: true,
            unique: true,
            enum: ISportType,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        scoringType: {
            type: String,
            required: true,
            enum: IScoringType,
        },
        matchDurationType: {
            type: String,
            required: true,
            enum: IMatchDurationType,
        },
        teamConfig: {
            minPlayersPerTeam: {
                type: Number,
                required: true,
                min: 1,
            },
            maxPlayersPerTeam: {
                type: Number,
                required: true,
                min: 1,
            },
            playersOnField: {
                type: Number,
                required: true,
                min: 1,
            },
            allowSubstitutes: {
                type: Boolean,
                default: true,
            },
        },
        matchFormats: [{
            name: { type: String, required: true },
            playersPerSide: { type: Number, required: true },
            description: { type: String },
        }],
        scoringConfig: {
            pointsToWin: { type: Number },
            minPointsDifference: { type: Number },
            maxPoints: { type: Number },
            setsToWin: { type: Number },
            gamesPerSet: { type: Number },
            pointsPerGame: { type: Number },
            periodDurationMinutes: { type: Number },
            numberOfPeriods: { type: Number },
            overtimeRules: { type: String },
            defaultOvers: { type: Number },
            allowTieBreaker: { type: Boolean, default: true },
            tieBreakerRules: { type: String },
        },
        bestOfOptions: [{
            type: Number,
            enum: [1, 3, 5, 7],
        }],
        scoreLabels: {
            primary: { type: String }, // "Points", "Goals", "Runs"
            secondary: { type: String }, // "Games", "Wickets", "Sets"
            tertiary: { type: String }, // "Sets"
        },
        defaults: {
            bestOf: { type: Number },
            pointsToWin: { type: Number },
            tieBreakerPoints: { type: Number },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

sportConfigSchema.index({ sport: 1 });
sportConfigSchema.index({ isActive: 1 });

export interface IMatchFormat {
    name: string;
    playersPerSide: number;
    description?: string;
}

export interface ISportConfig extends mongoose.Document {
    _id: string;
    sport: string;
    displayName: string;
    scoringType: string;
    matchDurationType: string;
    teamConfig: {
        minPlayersPerTeam: number;
        maxPlayersPerTeam: number;
        playersOnField: number;
        allowSubstitutes: boolean;
    };
    matchFormats: IMatchFormat[];
    scoringConfig: {
        pointsToWin?: number;
        minPointsDifference?: number;
        maxPoints?: number;
        setsToWin?: number;
        gamesPerSet?: number;
        pointsPerGame?: number;
        periodDurationMinutes?: number;
        numberOfPeriods?: number;
        overtimeRules?: string;
        defaultOvers?: number;
        allowTieBreaker: boolean;
        tieBreakerRules?: string;
    };
    bestOfOptions: number[];
    scoreLabels: {
        primary?: string;
        secondary?: string;
        tertiary?: string;
    };
    defaults: {
        bestOf?: number;
        pointsToWin?: number;
        tieBreakerPoints?: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<ISportConfig>('SportConfig', sportConfigSchema);
