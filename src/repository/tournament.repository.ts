import mongoose from 'mongoose';
import TournamentModel, { ITournament, ITournamentStatus } from '../models/tournament.model';

class TournamentRepository {
    private readonly _model = TournamentModel;

    async create(data: Partial<ITournament>): Promise<ITournament> {
        const tournament = await this._model.create(data);
        return tournament.toObject();
    }

    async getById(id: string): Promise<ITournament | null> {
        return this._model.findById(id).lean();
    }

    async getByIdWithCounts(id: string): Promise<any | null> {
        const result = await this._model.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'tournamentregistrations',
                    let: { tid: { $toString: '$_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$tournamentId', '$$tid'] },
                                isActive: true,
                                status: { $nin: ['withdrawn', 'rejected'] },
                            },
                        },
                        { $count: 'count' },
                    ],
                    as: '_regCount',
                },
            },
            {
                $lookup: {
                    from: 'teams',
                    let: { tid: { $toString: '$_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$tournamentId', '$$tid'] },
                                isActive: true,
                            },
                        },
                        { $count: 'count' },
                    ],
                    as: '_teamCount',
                },
            },
            {
                $addFields: {
                    registeredPlayersCount: {
                        $ifNull: [{ $arrayElemAt: ['$_regCount.count', 0] }, 0],
                    },
                    teamsCount: {
                        $ifNull: [{ $arrayElemAt: ['$_teamCount.count', 0] }, 0],
                    },
                },
            },
            { $project: { _regCount: 0, _teamCount: 0 } },
        ]);
        return result[0] || null;
    }

    async getAll(filters: {
        status?: string;
        sport?: string;
        city?: string;
        createdBy?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ tournaments: any[]; total: number }> {
        const { status, sport, city, createdBy, page = 1, limit = 20 } = filters;

        const match: Record<string, unknown> = { isActive: true };

        if (status) match.status = status;
        if (sport) match.sport = sport;
        if (city) match['venue.city'] = city;
        if (createdBy) match.createdBy = createdBy;

        const skip = (page - 1) * limit;

        const [result, total] = await Promise.all([
            this._model.aggregate([
                { $match: match },
                { $sort: { startDate: -1 as const } },
                { $skip: skip },
                { $limit: limit },
                // Count registered players (non-withdrawn, active)
                {
                    $lookup: {
                        from: 'tournamentregistrations',
                        let: { tid: { $toString: '$_id' } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$tournamentId', '$$tid'] },
                                    isActive: true,
                                    status: { $nin: ['withdrawn', 'rejected'] },
                                },
                            },
                            { $count: 'count' },
                        ],
                        as: '_regCount',
                    },
                },
                // Count teams
                {
                    $lookup: {
                        from: 'teams',
                        let: { tid: { $toString: '$_id' } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$tournamentId', '$$tid'] },
                                    isActive: true,
                                },
                            },
                            { $count: 'count' },
                        ],
                        as: '_teamCount',
                    },
                },
                {
                    $addFields: {
                        registeredPlayersCount: {
                            $ifNull: [{ $arrayElemAt: ['$_regCount.count', 0] }, 0],
                        },
                        teamsCount: {
                            $ifNull: [{ $arrayElemAt: ['$_teamCount.count', 0] }, 0],
                        },
                    },
                },
                { $project: { _regCount: 0, _teamCount: 0 } },
            ]),
            this._model.countDocuments(match),
        ]);

        return { tournaments: result, total };
    }

    async getByOrganizer(organizerId: string): Promise<ITournament[]> {
        return this._model.find({
            $or: [
                { createdBy: organizerId },
                { staffIds: organizerId }
            ],
            isActive: true
        }).sort({ createdAt: -1 }).lean();
    }

    async update(id: string, data: Partial<ITournament>): Promise<ITournament | null> {
        return this._model.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async updateStatus(id: string, status: ITournamentStatus): Promise<ITournament | null> {
        return this._model.findByIdAndUpdate(id, { status }, { new: true }).lean();
    }

    async delete(id: string): Promise<ITournament | null> {
        return this._model.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    }

    async hardDelete(id: string): Promise<boolean> {
        const result = await this._model.findByIdAndDelete(id);
        return !!result;
    }

    async addStaff(id: string, staffId: string): Promise<ITournament | null> {
        return this._model.findByIdAndUpdate(
            id,
            { $addToSet: { staffIds: staffId } },
            { new: true }
        ).lean();
    }

    async removeStaff(id: string, staffId: string): Promise<ITournament | null> {
        return this._model.findByIdAndUpdate(
            id,
            { $pull: { staffIds: staffId } },
            { new: true }
        ).lean();
    }

    async isOrganizerOrStaff(tournamentId: string, userId: string): Promise<boolean> {
        const tournament = await this._model.findOne({
            _id: tournamentId,
            $or: [
                { createdBy: userId },
                { staffIds: userId }
            ]
        }).lean();
        return !!tournament;
    }

    async isOrganizer(tournamentId: string, userId: string): Promise<boolean> {
        const tournament = await this._model.findOne({
            _id: tournamentId,
            createdBy: userId
        }).lean();
        return !!tournament;
    }
}

export const tournamentRepository = new TournamentRepository();
