import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';

export const createTeam = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId } = req.params;
    const userId = req.organizer._id;
    const response = await teamService.create(tournamentId, req.body, userId);
    next(response);
};

export const getTeam = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const response = await teamService.getById(id);
    next(response);
};

export const getTeamsByTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId } = req.params;
    const response = await teamService.getByTournament(tournamentId);
    next(response);
};

export const updateTeam = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await teamService.update(id, req.body, userId);
    next(response);
};

export const deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await teamService.delete(id, userId);
    next(response);
};

export const updateTeamBudget = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { budget } = req.body;
    const userId = req.organizer._id;
    const response = await teamService.updateBudget(id, budget, userId);
    next(response);
};

export const resetTeamBudget = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await teamService.resetBudget(id, userId);
    next(response);
};
