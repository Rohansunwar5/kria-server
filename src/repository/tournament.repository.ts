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

    async getAll(filters: {
        status?: string;
        sport?: string;
        city?: string;
        createdBy?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ tournaments: ITournament[]; total: number }> {
        const { status, sport, city, createdBy, page = 1, limit = 20 } = filters;

        const query: Record<string, unknown> = { isActive: true };

        if (status) query.status = status;
        if (sport) query.sport = sport;
        if (city) query['venue.city'] = city;
        if (createdBy) query.createdBy = createdBy;

        const skip = (page - 1) * limit;

        const [tournaments, total] = await Promise.all([
            this._model.find(query).sort({ startDate: -1 }).skip(skip).limit(limit).lean(),
            this._model.countDocuments(query),
        ]);

        return { tournaments, total };
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
