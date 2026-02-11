import CategoryModel, { ICategory, ICategoryStatus } from '../models/category.model';

class CategoryRepository {
    private readonly _model = CategoryModel;

    async create(data: Partial<ICategory>): Promise<ICategory> {
        const category = await this._model.create(data);
        return category.toObject();
    }

    async getById(id: string): Promise<ICategory | null> {
        return this._model.findById(id).lean();
    }

    async getByTournament(tournamentId: string): Promise<ICategory[]> {
        return this._model.find({ tournamentId, isActive: true }).sort({ name: 1 }).lean();
    }

    async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
        return this._model.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async updateStatus(id: string, status: ICategoryStatus): Promise<ICategory | null> {
        return this._model.findByIdAndUpdate(id, { status }, { new: true }).lean();
    }

    async delete(id: string): Promise<ICategory | null> {
        return this._model.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    }

    async hardDelete(id: string): Promise<boolean> {
        const result = await this._model.findByIdAndDelete(id);
        return !!result;
    }

    async existsByName(tournamentId: string, name: string): Promise<boolean> {
        const category = await this._model.findOne({
            tournamentId,
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            isActive: true
        }).lean();
        return !!category;
    }

    async countByTournament(tournamentId: string): Promise<number> {
        return this._model.countDocuments({ tournamentId, isActive: true });
    }
}

export const categoryRepository = new CategoryRepository();
