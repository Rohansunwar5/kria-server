import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';

export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.player._id;
    const response = await paymentService.createOrder(playerId, req.body);
    next(response);
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.player._id;
    const response = await paymentService.verifyPayment(playerId, req.body);
    next(response);
};

export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.player._id;
    const { orderId } = req.params;
    const response = await paymentService.getPaymentStatus(playerId, orderId);
    next(response);
};

export const getPlayerPayments = async (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.player._id;
    const response = await paymentService.getPlayerPayments(playerId);
    next(response);
};

export const getPaymentsByTournament = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId } = req.params;
    const userId = req.organizer._id;
    const response = await paymentService.getByTournament(tournamentId, userId);
    next(response);
};
