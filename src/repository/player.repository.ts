import Player from '../models/player.model';

class PlayerRepository {
    private readonly _model = Player;

    // ========================================================================
    // CREATE
    // ========================================================================

    async create(data: { firstName: string; lastName: string; email: string; phone: string; status?: string }) {
        return this._model.create(data);
    }

    // ========================================================================
    // READ
    // ========================================================================

    async getById(id: string) {
        return this._model.findById(id).select('-password -otp').lean();
    }

    async getByEmail(email: string) {
        return this._model.findOne({ email }).select('-password').lean();
    }

    async getByEmailWithPassword(email: string) {
        return this._model.findOne({ email }).lean();
    }

    async getByEmailWithOtp(email: string) {
        return this._model.findOne({ email }).lean();
    }

    async getByPhone(phone: string) {
        return this._model.findOne({ phone }).select('-password -otp').lean();
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    async updateById(id: string, data: Partial<{ firstName: string; lastName: string; phone: string }>) {
        return this._model.findByIdAndUpdate(id, data, { new: true }).select('-password -otp').lean();
    }

    async updateByEmail(email: string, data: Partial<{ firstName: string; lastName: string; phone: string }>) {
        return this._model.findOneAndUpdate({ email }, data, { new: true }).select('-password -otp').lean();
    }

    async setPassword(email: string, hashedPassword: string) {
        return this._model.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }
        ).select('-password -otp').lean();
    }

    async updatePassword(id: string, hashedPassword: string) {
        return this._model.findByIdAndUpdate(
            id,
            { password: hashedPassword },
            { new: true }
        ).select('-password -otp').lean();
    }

    async updateStatus(email: string, status: string) {
        return this._model.findOneAndUpdate(
            { email },
            { status },
            { new: true }
        ).select('-password -otp').lean();
    }

    async updateOtp(email: string, otp: { code: string; expiresAt: Date }) {
        return this._model.findOneAndUpdate(
            { email },
            { otp },
            { new: true }
        ).select('-password').lean();
    }

    async clearOtp(email: string) {
        return this._model.findOneAndUpdate(
            { email },
            { $unset: { otp: '' } },
            { new: true }
        ).select('-password -otp').lean();
    }

    async updateProfileImage(id: string, imagePath: string) {
        return this._model.findByIdAndUpdate(
            id,
            { profileImage: imagePath },
            { new: true }
        ).select('-password -otp').lean();
    }

    // ========================================================================
    // FCM TOKENS
    // ========================================================================

    async addFcmToken(id: string, token: string) {
        return this._model.findByIdAndUpdate(
            id,
            { $addToSet: { fcmTokens: token } },
            { new: true }
        ).select('-password -otp').lean();
    }

    async removeFcmToken(id: string, token: string) {
        return this._model.findByIdAndUpdate(
            id,
            { $pull: { fcmTokens: token } },
            { new: true }
        ).select('-password -otp').lean();
    }

    // ========================================================================
    // DELETE
    // ========================================================================

    async softDelete(id: string) {
        return this._model.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        ).select('-password -otp').lean();
    }
}

export const playerRepository = new PlayerRepository();
