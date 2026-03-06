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
}

export const matchRepository = new MatchRepository();
