import { tournamentRepository } from '../repository/tournament.repository';
import { ITournament, ITournamentStatus } from '../models/tournament.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { SuccessResponse } from '../utils/response.util';

class TournamentService {
    // ========================================================================
    // CRUD OPERATIONS
    // ========================================================================

    async create(data: Partial<ITournament>, organizerId: string) {
        // Validate dates
        if (new Date(data.startDate!) < new Date()) {
            throw new BadRequestError('Start date must be in the future.');
        }
        if (new Date(data.endDate!) < new Date(data.startDate!)) {
            throw new BadRequestError('End date must be after start date.');
        }
        if (new Date(data.registrationDeadline!) > new Date(data.startDate!)) {
            throw new BadRequestError('Registration deadline must be before start date.');
        }

        const tournament = await tournamentRepository.create({
            ...data,
            createdBy: organizerId,
            status: ITournamentStatus.DRAFT,
        });

        return new SuccessResponse('Tournament created successfully.', tournament);
    }

    async getById(id: string) {
        const tournament = await tournamentRepository.getById(id);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }
        return new SuccessResponse('Tournament fetched successfully.', tournament);
    }

    async getAll(filters: {
        status?: string;
        sport?: string;
        city?: string;
        page?: number;
        limit?: number;
    }) {
        const result = await tournamentRepository.getAll(filters);
        return new SuccessResponse('Tournaments fetched successfully.', {
            tournaments: result.tournaments,
            pagination: {
                total: result.total,
                page: filters.page || 1,
                limit: filters.limit || 20,
                totalPages: Math.ceil(result.total / (filters.limit || 20)),
            },
        });
    }

    async getMyTournaments(organizerId: string) {
        const tournaments = await tournamentRepository.getByOrganizer(organizerId);
        return new SuccessResponse('My tournaments fetched successfully.', tournaments);
    }

    async update(id: string, data: Partial<ITournament>, userId: string) {
        const tournament = await tournamentRepository.getById(id);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        // Check authorization
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(id, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to update this tournament.');
        }

        // Validate dates if provided
        if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
            throw new BadRequestError('End date must be after start date.');
        }

        const updated = await tournamentRepository.update(id, data);
        return new SuccessResponse('Tournament updated successfully.', updated);
    }

    async delete(id: string, userId: string) {
        const tournament = await tournamentRepository.getById(id);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        // Only organizer can delete
        const isOrganizer = await tournamentRepository.isOrganizer(id, userId);
        if (!isOrganizer) {
            throw new ForbiddenError('Only the tournament organizer can delete this tournament.');
        }

        await tournamentRepository.delete(id);
        return new SuccessResponse('Tournament deleted successfully.');
    }

    // ========================================================================
    // STATUS MANAGEMENT
    // ========================================================================

    async openRegistration(id: string, userId: string) {
        const tournament = await this.validateStatusTransition(
            id,
            userId,
            [ITournamentStatus.DRAFT],
            'Only draft tournaments can open registration.'
        );

        const updated = await tournamentRepository.updateStatus(id, ITournamentStatus.REGISTRATION_OPEN);
        return new SuccessResponse('Registration opened successfully.', updated);
    }

    async closeRegistration(id: string, userId: string) {
        const tournament = await this.validateStatusTransition(
            id,
            userId,
            [ITournamentStatus.REGISTRATION_OPEN],
            'Only tournaments with open registration can be closed.'
        );

        const updated = await tournamentRepository.updateStatus(id, ITournamentStatus.REGISTRATION_CLOSED);
        return new SuccessResponse('Registration closed successfully.', updated);
    }

    async startAuction(id: string, userId: string) {
        const tournament = await this.validateStatusTransition(
            id,
            userId,
            [ITournamentStatus.REGISTRATION_CLOSED],
            'Registration must be closed before starting auction.'
        );

        const updated = await tournamentRepository.updateStatus(id, ITournamentStatus.AUCTION_IN_PROGRESS);
        return new SuccessResponse('Auction started successfully.', updated);
    }

    async startTournament(id: string, userId: string) {
        const tournament = await this.validateStatusTransition(
            id,
            userId,
            [ITournamentStatus.AUCTION_IN_PROGRESS, ITournamentStatus.REGISTRATION_CLOSED],
            'Tournament cannot be started in current status.'
        );

        const updated = await tournamentRepository.updateStatus(id, ITournamentStatus.ONGOING);
        return new SuccessResponse('Tournament started successfully.', updated);
    }

    async completeTournament(id: string, userId: string) {
        const tournament = await this.validateStatusTransition(
            id,
            userId,
            [ITournamentStatus.ONGOING],
            'Only ongoing tournaments can be completed.'
        );

        const updated = await tournamentRepository.updateStatus(id, ITournamentStatus.COMPLETED);
        return new SuccessResponse('Tournament completed successfully.', updated);
    }

    async cancelTournament(id: string, userId: string) {
        const tournament = await tournamentRepository.getById(id);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        const isOrganizer = await tournamentRepository.isOrganizer(id, userId);
        if (!isOrganizer) {
            throw new ForbiddenError('Only the tournament organizer can cancel.');
        }

        if (tournament.status === ITournamentStatus.COMPLETED) {
            throw new BadRequestError('Completed tournaments cannot be cancelled.');
        }

        const updated = await tournamentRepository.updateStatus(id, ITournamentStatus.CANCELLED);
        return new SuccessResponse('Tournament cancelled successfully.', updated);
    }

    // ========================================================================
    // STAFF MANAGEMENT
    // ========================================================================

    async addStaff(tournamentId: string, staffId: string, userId: string) {
        const tournament = await tournamentRepository.getById(tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        const isOrganizer = await tournamentRepository.isOrganizer(tournamentId, userId);
        if (!isOrganizer) {
            throw new ForbiddenError('Only the tournament organizer can add staff.');
        }

        if (tournament.staffIds.includes(staffId)) {
            throw new BadRequestError('User is already staff for this tournament.');
        }

        if (staffId === tournament.createdBy) {
            throw new BadRequestError('Tournament organizer cannot be added as staff.');
        }

        const updated = await tournamentRepository.addStaff(tournamentId, staffId);
        return new SuccessResponse('Staff added successfully.', updated);
    }

    async removeStaff(tournamentId: string, staffId: string, userId: string) {
        const tournament = await tournamentRepository.getById(tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        const isOrganizer = await tournamentRepository.isOrganizer(tournamentId, userId);
        if (!isOrganizer) {
            throw new ForbiddenError('Only the tournament organizer can remove staff.');
        }

        if (!tournament.staffIds.includes(staffId)) {
            throw new BadRequestError('User is not staff for this tournament.');
        }

        const updated = await tournamentRepository.removeStaff(tournamentId, staffId);
        return new SuccessResponse('Staff removed successfully.', updated);
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private async validateStatusTransition(
        id: string,
        userId: string,
        allowedStatuses: ITournamentStatus[],
        errorMessage: string
    ): Promise<ITournament> {
        const tournament = await tournamentRepository.getById(id);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(id, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to perform this action.');
        }

        if (!allowedStatuses.includes(tournament.status as ITournamentStatus)) {
            throw new BadRequestError(errorMessage);
        }

        return tournament;
    }
}

export const tournamentService = new TournamentService();
