import TeamModel, { ITeam } from '../models/team.model';

class TeamRepository {
    private readonly _model = TeamModel;

    async create(data: Partial<ITeam>): Promise<ITeam> {
        const team = await this._model.create(data);
        return team.toObject();
    }

    async getById(id: string): Promise<ITeam | null> {
        return this._model.findById(id).lean();
    }

    async getByTournament(tournamentId: string): Promise<ITeam[]> {
        return this._model.find({ tournamentId, isActive: true }).lean();
    }

    async update(id: string, data: Partial<ITeam>): Promise<ITeam | null> {
        return this._model.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async delete(id: string): Promise<ITeam | null> {
        return this._model.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    }

    async hardDelete(id: string): Promise<boolean> {
        const result = await this._model.findByIdAndDelete(id);
        return !!result;
    }

    async deductBudget(id: string, amount: number): Promise<ITeam | null> {
        return this._model.findByIdAndUpdate(
            id,
            { $inc: { budget: -amount } },
            { new: true }
        ).lean();
    }

    async restoreBudget(id: string, amount: number): Promise<ITeam | null> {
        return this._model.findByIdAndUpdate(
            id,
            { $inc: { budget: amount } },
            { new: true }
        ).lean();
    }

    async resetBudget(id: string): Promise<ITeam | null> {
        const team = await this.getById(id);
        if (!team) return null;

        return this._model.findByIdAndUpdate(
            id,
            { budget: team.initialBudget },
            { new: true }
        ).lean();
    }

    async countByTournament(tournamentId: string): Promise<number> {
        return this._model.countDocuments({ tournamentId, isActive: true });
    }

    async existsByName(tournamentId: string, name: string): Promise<boolean> {
        const team = await this._model.findOne({
            tournamentId,
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            isActive: true
        }).lean();
        return !!team;
    }
}

export const teamRepository = new TeamRepository();
