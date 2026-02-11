import mongoose from 'mongoose';

// ============================================================================
// SCHEMA
// ============================================================================

const teamSchema = new mongoose.Schema(
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
        logo: {
            type: String,
        },
        primaryColor: {
            type: String,
            trim: true,
            maxLength: 7, // Hex color code
        },
        secondaryColor: {
            type: String,
            trim: true,
            maxLength: 7,
        },
        owner: {
            name: {
                type: String,
                required: true,
                trim: true,
            },
            phone: {
                type: String,
                required: true,
                trim: true,
            },
            email: {
                type: String,
                trim: true,
                lowercase: true,
            },
        },
        whatsappGroupLink: {
            type: String,
            trim: true,
        },
        budget: {
            type: Number,
            required: true,
            min: 0,
        },
        initialBudget: {
            type: Number,
            required: true,
            min: 0,
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

teamSchema.index({ tournamentId: 1 });
teamSchema.index({ tournamentId: 1, name: 1 }, { unique: true });
teamSchema.index({ 'owner.phone': 1 });

// ============================================================================
// INTERFACE
// ============================================================================

export interface ITeam extends mongoose.Document {
    _id: string;
    tournamentId: string;
    name: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    owner: {
        name: string;
        phone: string;
        email?: string;
    };
    whatsappGroupLink?: string;
    budget: number;
    initialBudget: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<ITeam>('Team', teamSchema);
