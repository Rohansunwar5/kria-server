import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId } = req.params;
    const userId = req.organizer._id;
    const response = await categoryService.create(tournamentId, req.body, userId);
    next(response);
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const response = await categoryService.getById(id);
    next(response);
};

export const getCategoriesByTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId } = req.params;
    const response = await categoryService.getByTournament(tournamentId);
    next(response);
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await categoryService.update(id, req.body, userId);
    next(response);
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await categoryService.delete(id, userId);
    next(response);
};

// Status transitions
export const openCategoryRegistration = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await categoryService.openRegistration(id, userId);
    next(response);
};

export const startCategoryAuction = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await categoryService.startAuction(id, userId);
    next(response);
};

export const configureCategoryBracket = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await categoryService.configureBracket(id, userId);
    next(response);
};

export const startCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await categoryService.startCategory(id, userId);
    next(response);
};

export const completeCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await categoryService.completeCategory(id, userId);
    next(response);
};
