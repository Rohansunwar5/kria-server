import { Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service';

export const generateBracket = async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const userId = req.organizer._id;
    const response = await matchService.generateBracket(categoryId, userId);
    next(response);
};

export const getMatchesByCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const response = await matchService.getMatchesByCategory(categoryId);
    next(response);
};

export const getMatchById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const response = await matchService.getMatchById(id);
    next(response);
};

export const recordResult = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await matchService.recordResult(id, req.body, userId);
    next(response);
};

export const updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await matchService.updateSchedule(id, req.body, userId);
    next(response);
};

export const swapCompetitors = async (req: Request, res: Response, next: NextFunction) => {
    const { matchId1, slot1, matchId2, slot2 } = req.body;
    const userId = req.organizer._id;
    const response = await matchService.swapCompetitors(matchId1, slot1, matchId2, slot2, userId);
    next(response);
};

export const reshuffleBracket = async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const userId = req.organizer._id;
    const response = await matchService.reshuffleBracket(categoryId, userId);
    next(response);
};

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const response = await matchService.getLeaderboard(categoryId);
    next(response);
};
