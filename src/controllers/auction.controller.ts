import { Request, Response, NextFunction } from 'express';
import { auctionService } from '../services/auction.service';

export const startAuction = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId, bidIncrement, hardLimit } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.startAuction(tournamentId, categoryId, userId, { bidIncrement, hardLimit });
    next(response);
};

export const getAuctionStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.params;
    const response = await auctionService.getStatus(tournamentId, categoryId);
    next(response);
};

export const sellPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId, teamId, soldPrice } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.sellPlayer(tournamentId, categoryId, teamId, soldPrice, userId);
    next(response);
};

export const placeBid = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId, teamId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.placeBid(tournamentId, categoryId, teamId, userId);
    next(response);
};

export const startTieBreaker = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.startTieBreaker(tournamentId, categoryId, userId);
    next(response);
};

export const triggerSpinWheel = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.triggerSpinWheel(tournamentId, categoryId, userId);
    next(response);
};

export const resolveHardLimit = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId, winnerTeamId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.resolveHardLimit(tournamentId, categoryId, winnerTeamId, userId);
    next(response);
};

export const nextPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.nextPlayer(tournamentId, categoryId, userId);
    next(response);
};

export const skipPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.skipPlayer(tournamentId, categoryId, userId);
    next(response);
};

export const undoLastAction = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.undoLast(tournamentId, categoryId, userId);
    next(response);
};

export const pauseAuction = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.pauseAuction(tournamentId, categoryId, userId);
    next(response);
};

export const endAuction = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.body;
    const userId = req.organizer._id;
    const response = await auctionService.endAuction(tournamentId, categoryId, userId);
    next(response);
};

export const getSoldLog = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.params;
    const response = await auctionService.getSoldLog(tournamentId, categoryId);
    next(response);
};
