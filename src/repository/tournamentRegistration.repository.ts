import TournamentRegistrationModel, {
    ITournamentRegistration,
    ITournamentRegistrationStatus
} from '../models/tournamentRegistration.model';

class TournamentRegistrationRepository {
    private readonly _model = TournamentRegistrationModel;

    async create(data: Partial<ITournamentRegistration>): Promise<ITournamentRegistration> {
        const registration = await this._model.create(data);
        return registration.toObject();
    }

    async getById(id: string): Promise<ITournamentRegistration | null> {
        return this._model.findById(id).lean();
    }

    async getByPlayer(playerId: string): Promise<ITournamentRegistration[]> {
        return this._model.find({ playerId, isActive: true }).lean();
    }

    async getByTournament(tournamentId: string, filters: {
        categoryId?: string;
        status?: string;
        teamId?: string;
    } = {}): Promise<ITournamentRegistration[]> {
        const query: Record<string, unknown> = { tournamentId, isActive: true };
        if (filters.categoryId) query.categoryId = filters.categoryId;
        if (filters.status) query.status = filters.status;
        if (filters.teamId) query.teamId = filters.teamId;

        return this._model.find(query).sort({ createdAt: -1 }).lean();
    }

    async getByCategory(categoryId: string): Promise<ITournamentRegistration[]> {
        return this._model.find({ categoryId, isActive: true }).sort({ 'profile.name': 1 }).lean();
    }

    async getByTeam(teamId: string): Promise<ITournamentRegistration[]> {
        return this._model.find({ teamId, isActive: true }).lean();
    }

    async getApprovedUnassigned(categoryId: string): Promise<ITournamentRegistration[]> {
        return this._model.find({
            categoryId,
            status: ITournamentRegistrationStatus.APPROVED,
            teamId: { $exists: false },
            isActive: true
        }).lean();
    }

    async update(id: string, data: Partial<ITournamentRegistration>): Promise<ITournamentRegistration | null> {
        return this._model.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async updateStatus(id: string, status: ITournamentRegistrationStatus): Promise<ITournamentRegistration | null> {
        return this._model.findByIdAndUpdate(id, { status }, { new: true }).lean();
    }

    async assignToTeam(id: string, teamId: string, soldPrice: number): Promise<ITournamentRegistration | null> {
        return this._model.findByIdAndUpdate(id, {
            teamId,
            status: ITournamentRegistrationStatus.AUCTIONED,
            'auctionData.soldPrice': soldPrice,
            'auctionData.auctionedAt': new Date(),
        }, { new: true }).lean();
    }

    async manualAssign(id: string, teamId: string): Promise<ITournamentRegistration | null> {
        return this._model.findByIdAndUpdate(id, {
            teamId,
            status: ITournamentRegistrationStatus.ASSIGNED,
        }, { new: true }).lean();
    }

    async unassignFromTeam(id: string): Promise<ITournamentRegistration | null> {
        return this._model.findByIdAndUpdate(id, {
            $unset: { teamId: 1, 'auctionData.soldPrice': 1, 'auctionData.auctionedAt': 1 },
            status: ITournamentRegistrationStatus.APPROVED,
        }, { new: true }).lean();
    }

    async updateStats(id: string, stats: {
        matchesPlayed?: number;
        matchesWon?: number;
        pointsContributed?: number;
    }): Promise<ITournamentRegistration | null> {
        const updateObj: Record<string, number> = {};
        if (stats.matchesPlayed !== undefined) updateObj['stats.matchesPlayed'] = stats.matchesPlayed;
        if (stats.matchesWon !== undefined) updateObj['stats.matchesWon'] = stats.matchesWon;
        if (stats.pointsContributed !== undefined) updateObj['stats.pointsContributed'] = stats.pointsContributed;

        return this._model.findByIdAndUpdate(id, { $inc: updateObj }, { new: true }).lean();
    }

    async delete(id: string): Promise<ITournamentRegistration | null> {
        return this._model.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    }

    async exists(playerId: string, tournamentId: string, categoryId: string): Promise<boolean> {
        const registration = await this._model.findOne({
            playerId,
            tournamentId,
            categoryId,
            isActive: true
        }).lean();
        return !!registration;
    }

    async countByCategory(categoryId: string, status?: string): Promise<number> {
        const query: Record<string, unknown> = { categoryId, isActive: true };
        if (status) query.status = status;
        return this._model.countDocuments(query);
    }

    async countByTeam(teamId: string): Promise<number> {
        return this._model.countDocuments({ teamId, isActive: true });
    }
}

export const tournamentRegistrationRepository = new TournamentRegistrationRepository();
