import { Request, Response, NextFunction } from 'express';
import { tournamentService } from '../services/tournament.service';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export const createTournament = async (req: Request, res: Response, next: NextFunction) => {
    const organizerId = req.organizer._id;
    const response = await tournamentService.create(req.body, organizerId);
    next(response);
};

export const getTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const response = await tournamentService.getById(id);
    next(response);
};

export const getAllTournaments = async (req: Request, res: Response, next: NextFunction) => {
    const { status, sport, city, page, limit } = req.query;
    const response = await tournamentService.getAll({
        status: status as string,
        sport: sport as string,
        city: city as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
    });
    next(response);
};

export const getMyTournaments = async (req: Request, res: Response, next: NextFunction) => {
    const organizerId = req.organizer._id;
    const response = await tournamentService.getMyTournaments(organizerId);
    next(response);
};

export const updateTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.update(id, req.body, userId);
    next(response);
};

export const deleteTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.delete(id, userId);
    next(response);
};

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

export const openRegistration = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.openRegistration(id, userId);
    next(response);
};

export const closeRegistration = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.closeRegistration(id, userId);
    next(response);
};

export const startAuction = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.startAuction(id, userId);
    next(response);
};

export const startTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.startTournament(id, userId);
    next(response);
};

export const completeTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.completeTournament(id, userId);
    next(response);
};

export const cancelTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.cancelTournament(id, userId);
    next(response);
};

// ============================================================================
// STAFF MANAGEMENT
// ============================================================================

export const addStaff = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { staffId } = req.body;
    const userId = req.organizer._id;
    const response = await tournamentService.addStaff(id, staffId, userId);
    next(response);
};

export const removeStaff = async (req: Request, res: Response, next: NextFunction) => {
    const { id, staffId } = req.params;
    const userId = req.organizer._id;
    const response = await tournamentService.removeStaff(id, staffId, userId);
    next(response);
};
