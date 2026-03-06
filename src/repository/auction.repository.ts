import AuctionModel, { IAuction, IAuctionStatus, IAuctionLog } from '../models/auction.model';

class AuctionRepository {
    private readonly _model = AuctionModel;

    async create(data: Partial<IAuction>): Promise<IAuction> {
        const auction = await this._model.create(data);
        return auction.toObject();
    }

    async getById(id: string): Promise<IAuction | null> {
        return this._model.findById(id).lean();
    }

    async getByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<IAuction | null> {
        return this._model.findOne({ tournamentId, categoryId, isActive: true }).lean();
    }

    async getByTournament(tournamentId: string): Promise<IAuction[]> {
        return this._model.find({ tournamentId, isActive: true }).lean();
    }

    async getStatus(tournamentId: string, categoryId: string): Promise<IAuction | null> {
        return this._model.findOne(
            { tournamentId, categoryId, isActive: true },
        ).lean();
    }

    async updateStatus(id: string, status: IAuctionStatus, extra: Record<string, unknown> = {}): Promise<IAuction | null> {
        return this._model.findByIdAndUpdate(id, { status, ...extra }, { new: true }).lean();
    }

    async setCurrentPlayer(id: string, index: number, registrationId: string): Promise<IAuction | null> {
        return this._model.findByIdAndUpdate(id, {
            currentPlayerIndex: index,
            currentRegistrationId: registrationId,
            status: IAuctionStatus.IN_PROGRESS,
            lastSoldResult: null,
        }, { new: true }).lean();
    }

    async markSold(id: string, soldResult: {
        registrationId: string;
        playerName: string;
        teamId: string;
        teamName: string;
        teamColor: string;
        soldPrice: number;
    }, log: Omit<IAuctionLog, '_id'>): Promise<IAuction | null> {
        return this._model.findByIdAndUpdate(id, {
            status: IAuctionStatus.SOLD,
            lastSoldResult: { ...soldResult, timestamp: new Date() },
            $push: { logs: log },
        }, { new: true }).lean();
    }

    async removeLastLog(id: string): Promise<IAuction | null> {
        const auction = await this._model.findById(id);
        if (!auction || auction.logs.length === 0) return null;
        auction.logs.pop();
        await auction.save();
        return auction.toObject();
    }

    async update(id: string, data: Partial<IAuction>): Promise<IAuction | null> {
        return this._model.findByIdAndUpdate(id, data, { new: true }).lean();
    }
}

export const auctionRepository = new AuctionRepository();
