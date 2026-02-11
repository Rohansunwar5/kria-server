import SportConfigModel, { ISportConfig } from '../models/sportConfig.model';

class SportConfigRepository {
    private readonly _model = SportConfigModel;

    async create(data: Partial<ISportConfig>): Promise<ISportConfig> {
        const config = await this._model.create(data);
        return config.toObject();
    }

    async getById(id: string): Promise<ISportConfig | null> {
        return this._model.findById(id).lean();
    }

    async getBySport(sport: string): Promise<ISportConfig | null> {
        return this._model.findOne({ sport, isActive: true }).lean();
    }

    async getAll(): Promise<ISportConfig[]> {
        return this._model.find({ isActive: true }).sort({ displayName: 1 }).lean();
    }

    async getActive(): Promise<ISportConfig[]> {
        return this._model.find({ isActive: true }).sort({ displayName: 1 }).lean();
    }

    async update(id: string, data: Partial<ISportConfig>): Promise<ISportConfig | null> {
        return this._model.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async updateBySport(sport: string, data: Partial<ISportConfig>): Promise<ISportConfig | null> {
        return this._model.findOneAndUpdate({ sport }, data, { new: true, upsert: true }).lean();
    }

    async delete(id: string): Promise<ISportConfig | null> {
        return this._model.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    }

    async exists(sport: string): Promise<boolean> {
        const config = await this._model.findOne({ sport }).lean();
        return !!config;
    }
}

export const sportConfigRepository = new SportConfigRepository();
