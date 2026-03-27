import PaymentModel, { IPayment, IPaymentStatus } from '../models/payment.model';

class PaymentRepository {
    private readonly _model = PaymentModel;

    async create(data: Partial<IPayment>): Promise<IPayment> {
        const payment = await this._model.create(data);
        return payment.toObject();
    }

    async getById(id: string): Promise<IPayment | null> {
        return this._model.findById(id).lean();
    }

    async getByOrderId(razorpayOrderId: string): Promise<IPayment | null> {
        return this._model.findOne({ razorpayOrderId }).lean();
    }

    async getByPlayerAndCategory(playerId: string, tournamentId: string, categoryId: string): Promise<IPayment | null> {
        return this._model.findOne({
            playerId,
            tournamentId,
            categoryId,
            status: IPaymentStatus.PAID,
            isActive: true,
        }).lean();
    }

    async getPendingByPlayerAndCategory(playerId: string, tournamentId: string, categoryId: string): Promise<IPayment | null> {
        return this._model.findOne({
            playerId,
            tournamentId,
            categoryId,
            status: IPaymentStatus.CREATED,
            isActive: true,
        }).lean();
    }

    async updateStatus(id: string, status: IPaymentStatus, extra?: Partial<IPayment>): Promise<IPayment | null> {
        return this._model.findByIdAndUpdate(id, { status, ...extra }, { new: true }).lean();
    }

    async getByPlayer(playerId: string): Promise<IPayment[]> {
        return this._model.find({ playerId, status: IPaymentStatus.PAID, isActive: true }).sort({ createdAt: -1 }).lean();
    }

    async getByTournament(tournamentId: string): Promise<IPayment[]> {
        return this._model.find({ tournamentId, isActive: true }).sort({ createdAt: -1 }).lean();
    }
}

export const paymentRepository = new PaymentRepository();
