import mongoose from 'mongoose';
import MatchModel, { IMatch } from '../models/match.model';

class MatchRepository {
    private readonly _model = MatchModel;

    async create(data: Partial<IMatch>): Promise<IMatch> {
        const match = await this._model.create(data);
        return match.toObject();
    }

    async bulkCreate(matches: Partial<IMatch>[]): Promise<IMatch[]> {
        const docs = await this._model.insertMany(matches);
        return (docs || []).map((d: any) => (d.toObject ? d.toObject() : d));
    }

    async getById(id: string): Promise<IMatch | null> {
        return this._model.findById(id).lean();
    }

    async getByCategory(categoryId: string): Promise<IMatch[]> {
        return this._model.find({ categoryId, isActive: true })
            .sort({ bracketRound: 1, matchNumber: 1 })
            .lean();
    }

    async getByCategoryAndRound(categoryId: string, bracketRound: string): Promise<IMatch[]> {
        return this._model.find({ categoryId, bracketRound, isActive: true })
            .sort({ matchNumber: 1 })
            .lean();
    }

    async getByTournament(tournamentId: string): Promise<IMatch[]> {
        return this._model.find({ tournamentId, isActive: true })
            .sort({ bracketRound: 1, matchNumber: 1 })
            .lean();
    }

    async getByTeam(teamId: string): Promise<IMatch[]> {
        return this._model.find({
            $or: [{ 'teams.team1Id': teamId }, { 'teams.team2Id': teamId }],
            isActive: true
        })
            .sort({ 'schedule.date': 1 })
            .lean();
    }

    async update(id: string, data: Partial<IMatch>): Promise<IMatch | null> {
        return this._model.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async deleteByCategory(categoryId: string): Promise<number> {
        const result = await this._model.deleteMany({ categoryId });
        return result.deletedCount;
    }

    async countByCategory(categoryId: string): Promise<number> {
        return this._model.countDocuments({ categoryId, isActive: true });
    }

    // ─── Leaderboard aggregation ────────────────────────────────────────────

    async getLeaderboardByCategory(categoryId: string, sportType: string): Promise<any[]> {
        switch (sportType) {
            case 'badminton':
            case 'table_tennis':
                return this._buildPointsLeaderboard(categoryId);
            default:
                return this._buildGenericLeaderboard(categoryId);
        }
    }

    /** Points-based sports (badminton, table tennis) — rank by total points scored */
    private async _buildPointsLeaderboard(categoryId: string): Promise<any[]> {
        return this._model.aggregate([
            // 1. Completed non-bye matches in this category
            {
                $match: {
                    categoryId: new mongoose.Types.ObjectId(categoryId),
                    status: 'completed',
                    isActive: true,
                    winReason: { $ne: 'bye' },
                },
            },
            // 2. Compute totals from gameScores
            {
                $addFields: {
                    team1TotalPoints: { $sum: '$gameScores.team1Score' },
                    team2TotalPoints: { $sum: '$gameScores.team2Score' },
                    winnerIdStr: { $toString: '$winnerId' },
                },
            },
            // 3. Create competitor array (one entry per player in the match)
            {
                $addFields: {
                    competitors: [
                        {
                            playerId: '$player1.registrationId',
                            playerName: '$player1.name',
                            teamId: '$player1.teamId',
                            teamName: '$player1.teamName',
                            pointsScored: '$team1TotalPoints',
                            pointsConceded: '$team2TotalPoints',
                            isWinner: { $eq: ['$player1.registrationId', '$winnerIdStr'] },
                        },
                        {
                            playerId: '$player2.registrationId',
                            playerName: '$player2.name',
                            teamId: '$player2.teamId',
                            teamName: '$player2.teamName',
                            pointsScored: '$team2TotalPoints',
                            pointsConceded: '$team1TotalPoints',
                            isWinner: { $eq: ['$player2.registrationId', '$winnerIdStr'] },
                        },
                    ],
                },
            },
            // 4. Unwind — each match becomes 2 docs
            { $unwind: '$competitors' },
            // 5. Filter out TBD placeholders
            { $match: { 'competitors.playerId': { $ne: 'TBD' }, 'competitors.playerName': { $ne: null } } },
            // 6. Group by player
            {
                $group: {
                    _id: '$competitors.playerId',
                    playerName: { $first: '$competitors.playerName' },
                    teamName: { $first: '$competitors.teamName' },
                    teamId: { $first: '$competitors.teamId' },
                    matchesPlayed: { $sum: 1 },
                    matchesWon: { $sum: { $cond: ['$competitors.isWinner', 1, 0] } },
                    totalPointsScored: { $sum: '$competitors.pointsScored' },
                    totalPointsConceded: { $sum: '$competitors.pointsConceded' },
                },
            },
            // 7. Compute derived fields
            {
                $addFields: {
                    pointDiff: { $subtract: ['$totalPointsScored', '$totalPointsConceded'] },
                    winPercentage: {
                        $cond: [
                            { $eq: ['$matchesPlayed', 0] },
                            0,
                            { $round: [{ $multiply: [{ $divide: ['$matchesWon', '$matchesPlayed'] }, 100] }, 1] },
                        ],
                    },
                },
            },
            // 8. Sort
            { $sort: { totalPointsScored: -1, pointDiff: -1, winPercentage: -1 } },
            // 9. Add rank
            { $group: { _id: null, entries: { $push: '$$ROOT' } } },
            { $unwind: { path: '$entries', includeArrayIndex: 'rank' } },
            {
                $replaceRoot: {
                    newRoot: { $mergeObjects: ['$entries', { rank: { $add: ['$rank', 1] } }] },
                },
            },
        ]);
    }

    /** Generic fallback — win/loss record only (no sport-specific point scoring) */
    private async _buildGenericLeaderboard(categoryId: string): Promise<any[]> {
        return this._model.aggregate([
            {
                $match: {
                    categoryId: new mongoose.Types.ObjectId(categoryId),
                    status: 'completed',
                    isActive: true,
                    winReason: { $ne: 'bye' },
                },
            },
            {
                $addFields: {
                    winnerIdStr: { $toString: '$winnerId' },
                },
            },
            {
                $addFields: {
                    competitors: [
                        {
                            playerId: '$player1.registrationId',
                            playerName: '$player1.name',
                            teamId: '$player1.teamId',
                            teamName: '$player1.teamName',
                            isWinner: { $eq: ['$player1.registrationId', '$winnerIdStr'] },
                        },
                        {
                            playerId: '$player2.registrationId',
                            playerName: '$player2.name',
                            teamId: '$player2.teamId',
                            teamName: '$player2.teamName',
                            isWinner: { $eq: ['$player2.registrationId', '$winnerIdStr'] },
                        },
                    ],
                },
            },
            { $unwind: '$competitors' },
            { $match: { 'competitors.playerId': { $ne: 'TBD' }, 'competitors.playerName': { $ne: null } } },
            {
                $group: {
                    _id: '$competitors.playerId',
                    playerName: { $first: '$competitors.playerName' },
                    teamName: { $first: '$competitors.teamName' },
                    teamId: { $first: '$competitors.teamId' },
                    matchesPlayed: { $sum: 1 },
                    matchesWon: { $sum: { $cond: ['$competitors.isWinner', 1, 0] } },
                },
            },
            {
                $addFields: {
                    winPercentage: {
                        $cond: [
                            { $eq: ['$matchesPlayed', 0] },
                            0,
                            { $round: [{ $multiply: [{ $divide: ['$matchesWon', '$matchesPlayed'] }, 100] }, 1] },
                        ],
                    },
                },
            },
            { $sort: { matchesWon: -1, winPercentage: -1 } },
            { $group: { _id: null, entries: { $push: '$$ROOT' } } },
            { $unwind: { path: '$entries', includeArrayIndex: 'rank' } },
            {
                $replaceRoot: {
                    newRoot: { $mergeObjects: ['$entries', { rank: { $add: ['$rank', 1] } }] },
                },
            },
        ]);
    }
}

export const matchRepository = new MatchRepository();
