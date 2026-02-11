import { Request, Response, NextFunction } from 'express';
import { sportConfigService } from '../services/sportConfig.service';

export const getAllSportConfigs = async (req: Request, res: Response, next: NextFunction) => {
    const response = await sportConfigService.getAll();
    next(response);
};

export const getSportConfig = async (req: Request, res: Response, next: NextFunction) => {
    const { sport } = req.params;
    const response = await sportConfigService.getBySport(sport);
    next(response);
};

export const createSportConfig = async (req: Request, res: Response, next: NextFunction) => {
    const response = await sportConfigService.create(req.body);
    next(response);
};

export const updateSportConfig = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const response = await sportConfigService.update(id, req.body);
    next(response);
};

export const deleteSportConfig = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const response = await sportConfigService.delete(id);
    next(response);
};

export const seedSportConfigs = async (req: Request, res: Response, next: NextFunction) => {
    const response = await sportConfigService.seedDefaults();
    next(response);
};
