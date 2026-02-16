import { Request, Response, NextFunction } from 'express';
import { tournamentRegistrationService } from '../services/tournamentRegistration.service';

export const registerForTournament = async (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.player._id;
    const response = await tournamentRegistrationService.register(playerId, req.body);
    next(response);
};

export const getMyRegistrations = async (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.player._id;
    const response = await tournamentRegistrationService.getMyRegistrations(playerId);
    next(response);
};

export const withdrawRegistration = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const playerId = req.player._id;
    const response = await tournamentRegistrationService.withdraw(id, playerId);
    next(response);
};

export const getRegistrationsByTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId } = req.params;
    const { categoryId, status, teamId } = req.query;
    const userId = req.organizer._id;
    const response = await tournamentRegistrationService.getByTournament(
        tournamentId,
        { categoryId: categoryId as string, status: status as string, teamId: teamId as string },
        userId
    );
    next(response);
};

export const getRegistrationsByCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const response = await tournamentRegistrationService.getByCategory(categoryId);
    next(response);
};

export const approveRegistration = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentRegistrationService.approve(id, userId);
    next(response);
};

export const rejectRegistration = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentRegistrationService.reject(id, userId);
    next(response);
};

export const bulkApproveRegistrations = async (req: Request, res: Response, next: NextFunction) => {
    const { registrationIds } = req.body;
    const userId = req.organizer._id;
    const response = await tournamentRegistrationService.bulkApprove(registrationIds, userId);
    next(response);
};

export const assignPlayerToTeam = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { teamId, soldPrice } = req.body;
    const userId = req.organizer._id;
    const response = await tournamentRegistrationService.assignToTeam(id, teamId, soldPrice, userId);
    next(response);
};

export const manualAssignPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { teamId } = req.body;
    const userId = req.organizer._id;
    const response = await tournamentRegistrationService.manualAssign(id, teamId, userId);
    next(response);
};

export const unassignPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentRegistrationService.unassign(id, userId);
    next(response);
};

export const getTeamRoster = async (req: Request, res: Response, next: NextFunction) => {
    const { teamId } = req.params;
    const response = await tournamentRegistrationService.getTeamRoster(teamId);
    next(response);
};

export const getAvailableForAuction = async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const response = await tournamentRegistrationService.getAvailableForAuction(categoryId);
    next(response);
};
