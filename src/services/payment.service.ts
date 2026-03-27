import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config';
import { paymentRepository } from '../repository/payment.repository';
import { categoryRepository } from '../repository/category.repository';
import { tournamentRepository } from '../repository/tournament.repository';
import { tournamentRegistrationRepository } from '../repository/tournamentRegistration.repository';
import { IPaymentStatus } from '../models/payment.model';
import { ITournamentStatus } from '../models/tournament.model';
import { ITournamentRegistrationStatus } from '../models/tournamentRegistration.model';
import { BadRequestError, NotFoundError } from '../errors';
import { SuccessResponse } from '../utils/response.util';

const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
});

class PaymentService {
    /**
     * Create a Razorpay order for category registration payment.
     * Called by player before registering for a paid category.
     */
    async createOrder(playerId: string, data: { tournamentId: string; categoryId: string }) {
        // Verify tournament exists and is open for registration
        const tournament = await tournamentRepository.getById(data.tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }
        if (tournament.status !== ITournamentStatus.REGISTRATION_OPEN) {
            throw new BadRequestError('Tournament is not open for registration.');
        }

        // Verify category exists and requires payment
        const category = await categoryRepository.getById(data.categoryId);
        if (!category || category.tournamentId !== data.tournamentId) {
            throw new NotFoundError('Category not found in this tournament.');
        }
        if (!category.isPaidRegistration || !category.registrationFee) {
            throw new BadRequestError('This category does not require payment.');
        }

        // Check if player already has a completed payment for this category
        const existingPayment = await paymentRepository.getByPlayerAndCategory(
            playerId, data.tournamentId, data.categoryId
        );
        if (existingPayment) {
            throw new BadRequestError('You have already paid for this category.');
        }

        // Check if player already registered
        const existingReg = await tournamentRegistrationRepository.exists(
            playerId, data.tournamentId, data.categoryId
        );
        if (existingReg) {
            throw new BadRequestError('You are already registered for this category.');
        }

        // Check max registrations limit
        if (category.maxRegistrations) {
            const currentCount = await tournamentRegistrationRepository.countByCategory(data.categoryId);
            if (currentCount >= category.maxRegistrations) {
                throw new BadRequestError('Registration limit reached for this category.');
            }
        }

        // Calculate fee breakdown
        const baseAmount = category.registrationFee;
        const razorpayFee = Math.round(baseAmount * 0.02 * 100) / 100; // 2%
        const platformFee = Math.round(baseAmount * 0.02 * 100) / 100; // 2%
        const gst = Math.round((razorpayFee + platformFee) * 0.18 * 100) / 100; // 18% on fees
        const totalAmount = Math.round((baseAmount + razorpayFee + platformFee + gst) * 100) / 100;
        const convenienceFee = Math.round((razorpayFee + platformFee + gst) * 100) / 100;

        // Amount in paise (Razorpay uses smallest currency unit)
        const amountInPaise = Math.round(totalAmount * 100);

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `reg_${data.tournamentId}_${data.categoryId}_${playerId}`.slice(0, 40),
        });

        // Save payment record
        const payment = await paymentRepository.create({
            playerId,
            tournamentId: data.tournamentId,
            categoryId: data.categoryId,
            razorpayOrderId: order.id,
            amount: totalAmount,
            baseAmount,
            feeBreakdown: { razorpayFee, platformFee, gst },
            currency: 'INR',
            status: IPaymentStatus.CREATED,
        });

        return new SuccessResponse('Payment order created successfully.', {
            orderId: order.id,
            amount: totalAmount,
            baseAmount,
            convenienceFee,
            feeBreakdown: { razorpayFee, platformFee, gst },
            currency: 'INR',
            keyId: config.RAZORPAY_KEY_ID,
            paymentId: payment._id,
        });
    }

    /**
     * Verify Razorpay payment signature and mark payment as paid.
     * After verification, automatically register the player for the category.
     */
    async verifyPayment(playerId: string, data: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
        profile: {
            firstName: string;
            lastName: string;
            age: number;
            gender: string;
            phone: string;
            skillLevel?: string;
        };
        basePrice?: number;
    }) {
        // Find the payment record
        const payment = await paymentRepository.getByOrderId(data.razorpayOrderId);
        if (!payment) {
            throw new NotFoundError('Payment record not found.');
        }
        if (payment.playerId !== playerId) {
            throw new BadRequestError('Payment does not belong to this player.');
        }
        if (payment.status === IPaymentStatus.PAID) {
            throw new BadRequestError('Payment has already been verified.');
        }

        // Verify Razorpay signature
        const expectedSignature = crypto
            .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
            .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
            .digest('hex');

        if (expectedSignature !== data.razorpaySignature) {
            // Mark payment as failed
            await paymentRepository.updateStatus(payment._id, IPaymentStatus.FAILED);
            throw new BadRequestError('Payment verification failed. Invalid signature.');
        }

        // Mark payment as paid
        await paymentRepository.updateStatus(payment._id, IPaymentStatus.PAID, {
            razorpayPaymentId: data.razorpayPaymentId,
            razorpaySignature: data.razorpaySignature,
        });

        // Auto-register the player for the category
        const registration = await tournamentRegistrationRepository.create({
            playerId,
            tournamentId: payment.tournamentId,
            categoryId: payment.categoryId,
            profile: data.profile,
            status: ITournamentRegistrationStatus.PENDING,
            auctionData: {
                basePrice: data.basePrice || 1000,
            },
        });

        // Link registration to payment
        await paymentRepository.updateStatus(payment._id, IPaymentStatus.PAID, {
            registrationId: registration._id,
        });

        return new SuccessResponse('Payment verified and registration submitted successfully.', {
            payment: {
                _id: payment._id,
                status: IPaymentStatus.PAID,
                amount: payment.amount,
            },
            registration,
        });
    }

    /**
     * Get payment status for a specific order.
     */
    async getPaymentStatus(playerId: string, orderId: string) {
        const payment = await paymentRepository.getByOrderId(orderId);
        if (!payment) {
            throw new NotFoundError('Payment not found.');
        }
        if (payment.playerId !== playerId) {
            throw new BadRequestError('Payment does not belong to this player.');
        }

        return new SuccessResponse('Payment status fetched successfully.', payment);
    }

    /**
     * Get all payments made by a player (invoices).
     */
    async getPlayerPayments(playerId: string) {
        const payments = await paymentRepository.getByPlayer(playerId);

        if (payments.length === 0) {
            return new SuccessResponse('Payments fetched.', []);
        }

        const tournamentIds = [...new Set(payments.map(p => p.tournamentId))];
        const categoryIds = [...new Set(payments.map(p => p.categoryId))];

        const [tournaments, categories] = await Promise.all([
            tournamentRepository.getByIds(tournamentIds),
            categoryRepository.getByIds(categoryIds),
        ]);

        const tournamentMap: Record<string, any> = {};
        (tournaments as any[]).forEach(t => { tournamentMap[t._id.toString()] = t; });

        const categoryMap: Record<string, any> = {};
        (categories as any[]).forEach(c => { categoryMap[c._id.toString()] = c; });

        const enriched = payments.map(p => ({
            ...p,
            tournament: tournamentMap[p.tournamentId] || null,
            category: categoryMap[p.categoryId] || null,
        }));

        return new SuccessResponse('Payments fetched.', enriched);
    }

    /**
     * Get payments for a tournament (organizer view).
     */
    async getByTournament(tournamentId: string, userId: string) {
        const tournament = await tournamentRepository.getById(tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) {
            throw new BadRequestError('You are not authorized to view payments.');
        }

        const payments = await paymentRepository.getByTournament(tournamentId);
        return new SuccessResponse('Payments fetched successfully.', payments);
    }
}

export const paymentService = new PaymentService();
