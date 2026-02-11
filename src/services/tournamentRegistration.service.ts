import { tournamentRegistrationRepository } from '../repository/tournamentRegistration.repository';
import { tournamentRepository } from '../repository/tournament.repository';
import { categoryRepository } from '../repository/category.repository';
import { teamRepository } from '../repository/team.repository';
import { playerRepository } from '../repository/player.repository';
import {
    ITournamentRegistration,
    ITournamentRegistrationStatus
} from '../models/tournamentRegistration.model';
import { ITournamentStatus } from '../models/tournament.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { SuccessResponse } from '../utils/response.util';

class TournamentRegistrationService {
    // ========================================================================
    // PLAYER ACTIONS
    // ========================================================================

    async register(playerId: string, data: {
        tournamentId: string;
        categoryId: string;
        profile: {
            name: string;
            age: number;
            gender: string;
            phone: string;
            photo?: string;
            skillLevel?: string;
        };
        basePrice?: number;
    }) {
        // Verify tournament exists and is open for registration
        const tournament = await tournamentRepository.getById(data.tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }
        if (tournament.status !== ITournamentStatus.REGISTRATION_OPEN) {
            throw new BadRequestError('Tournament is not open for registration.');
        }

        // Verify category exists
        const category = await categoryRepository.getById(data.categoryId);
        if (!category || category.tournamentId !== data.tournamentId) {
            throw new NotFoundError('Category not found in this tournament.');
        }

        // Check if player already registered for this category
        const exists = await tournamentRegistrationRepository.exists(
            playerId, data.tournamentId, data.categoryId
        );
        if (exists) {
            throw new BadRequestError('You are already registered for this category.');
        }

        const registration = await tournamentRegistrationRepository.create({
            playerId,
            tournamentId: data.tournamentId,
            categoryId: data.categoryId,
            profile: data.profile,
            status: ITournamentRegistrationStatus.PENDING,
            auctionData: {
                basePrice: data.basePrice || 1000,
            },
        });

        return new SuccessResponse('Registration submitted successfully.', registration);
    }

    async getMyRegistrations(playerId: string) {
        const registrations = await tournamentRegistrationRepository.getByPlayer(playerId);
        return new SuccessResponse('Registrations fetched successfully.', registrations);
    }

    async withdraw(registrationId: string, playerId: string) {
        const registration = await tournamentRegistrationRepository.getById(registrationId);
        if (!registration) {
            throw new NotFoundError('Registration not found.');
        }
        if (registration.playerId !== playerId) {
            throw new ForbiddenError('You can only withdraw your own registration.');
        }
        if (registration.status === ITournamentRegistrationStatus.AUCTIONED ||
            registration.status === ITournamentRegistrationStatus.ASSIGNED) {
            throw new BadRequestError('Cannot withdraw after being assigned to a team.');
        }

        const updated = await tournamentRegistrationRepository.updateStatus(
            registrationId, ITournamentRegistrationStatus.WITHDRAWN
        );
        return new SuccessResponse('Registration withdrawn successfully.', updated);
    }

    // ========================================================================
    // ORGANIZER/STAFF ACTIONS
    // ========================================================================

    async getByTournament(tournamentId: string, filters: {
        categoryId?: string;
        status?: string;
        teamId?: string;
    }, userId: string) {
        const tournament = await tournamentRepository.getById(tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to view registrations.');
        }

        const registrations = await tournamentRegistrationRepository.getByTournament(tournamentId, filters);
        return new SuccessResponse('Registrations fetched successfully.', registrations);
    }

    async getByCategory(categoryId: string) {
        const category = await categoryRepository.getById(categoryId);
        if (!category) {
            throw new NotFoundError('Category not found.');
        }

        const registrations = await tournamentRegistrationRepository.getByCategory(categoryId);
        return new SuccessResponse('Registrations fetched successfully.', registrations);
    }

    async approve(registrationId: string, userId: string) {
        const registration = await this.validateAndAuthorize(registrationId, userId);

        if (registration.status !== ITournamentRegistrationStatus.PENDING) {
            throw new BadRequestError('Only pending registrations can be approved.');
        }

        const updated = await tournamentRegistrationRepository.updateStatus(
            registrationId, ITournamentRegistrationStatus.APPROVED
        );
        return new SuccessResponse('Registration approved successfully.', updated);
    }

    async reject(registrationId: string, userId: string) {
        const registration = await this.validateAndAuthorize(registrationId, userId);

        if (registration.status !== ITournamentRegistrationStatus.PENDING) {
            throw new BadRequestError('Only pending registrations can be rejected.');
        }

        const updated = await tournamentRegistrationRepository.updateStatus(
            registrationId, ITournamentRegistrationStatus.REJECTED
        );
        return new SuccessResponse('Registration rejected successfully.', updated);
    }

    async bulkApprove(registrationIds: string[], userId: string) {
        const results = await Promise.all(
            registrationIds.map(id => this.approve(id, userId).catch(e => ({ error: e.message, id })))
        );
        return new SuccessResponse('Bulk approval completed.', results);
    }

    // ========================================================================
    // TEAM ASSIGNMENT (For Auction & Manual)
    // ========================================================================

    async assignToTeam(registrationId: string, teamId: string, soldPrice: number, userId: string) {
        const registration = await this.validateAndAuthorize(registrationId, userId);

        if (registration.status !== ITournamentRegistrationStatus.APPROVED) {
            throw new BadRequestError('Only approved players can be assigned to teams.');
        }

        // Verify team exists and belongs to same tournament
        const team = await teamRepository.getById(teamId);
        if (!team || team.tournamentId !== registration.tournamentId) {
            throw new NotFoundError('Team not found in this tournament.');
        }

        // Check team budget
        if (team.budget < soldPrice) {
            throw new BadRequestError('Team does not have sufficient budget.');
        }

        // Deduct from team budget
        await teamRepository.deductBudget(teamId, soldPrice);

        const updated = await tournamentRegistrationRepository.assignToTeam(
            registrationId, teamId, soldPrice
        );
        return new SuccessResponse('Player assigned to team successfully.', updated);
    }

    async manualAssign(registrationId: string, teamId: string, userId: string) {
        const registration = await this.validateAndAuthorize(registrationId, userId);

        if (registration.status !== ITournamentRegistrationStatus.APPROVED &&
            registration.status !== ITournamentRegistrationStatus.AUCTIONED &&
            registration.status !== ITournamentRegistrationStatus.ASSIGNED) {
            throw new BadRequestError('Player cannot be assigned in current status.');
        }

        // Verify team exists and belongs to same tournament
        const team = await teamRepository.getById(teamId);
        if (!team || team.tournamentId !== registration.tournamentId) {
            throw new NotFoundError('Team not found in this tournament.');
        }

        // If reassigning from another team, restore their budget first
        if (registration.teamId && registration.auctionData?.soldPrice) {
            await teamRepository.restoreBudget(registration.teamId, registration.auctionData.soldPrice);
        }

        const updated = await tournamentRegistrationRepository.manualAssign(registrationId, teamId);
        return new SuccessResponse('Player manually assigned to team.', updated);
    }

    async unassign(registrationId: string, userId: string) {
        const registration = await this.validateAndAuthorize(registrationId, userId);

        if (!registration.teamId) {
            throw new BadRequestError('Player is not assigned to any team.');
        }

        // Restore team budget if was auctioned
        if (registration.auctionData?.soldPrice) {
            await teamRepository.restoreBudget(registration.teamId, registration.auctionData.soldPrice);
        }

        const updated = await tournamentRegistrationRepository.unassignFromTeam(registrationId);
        return new SuccessResponse('Player unassigned from team.', updated);
    }

    async getTeamRoster(teamId: string) {
        const team = await teamRepository.getById(teamId);
        if (!team) {
            throw new NotFoundError('Team not found.');
        }

        const players = await tournamentRegistrationRepository.getByTeam(teamId);
        return new SuccessResponse('Team roster fetched successfully.', {
            team,
            players,
            totalPlayers: players.length,
        });
    }

    async getAvailableForAuction(categoryId: string) {
        const category = await categoryRepository.getById(categoryId);
        if (!category) {
            throw new NotFoundError('Category not found.');
        }

        const players = await tournamentRegistrationRepository.getApprovedUnassigned(categoryId);
        return new SuccessResponse('Available players fetched successfully.', players);
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private async validateAndAuthorize(registrationId: string, userId: string): Promise<ITournamentRegistration> {
        const registration = await tournamentRegistrationRepository.getById(registrationId);
        if (!registration) {
            throw new NotFoundError('Registration not found.');
        }

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(registration.tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to perform this action.');
        }

        return registration;
    }
}

export const tournamentRegistrationService = new TournamentRegistrationService();
