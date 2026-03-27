import { teamRepository } from '../repository/team.repository';
import { tournamentRepository } from '../repository/tournament.repository';
import { tournamentRegistrationRepository } from '../repository/tournamentRegistration.repository';
import { playerRepository } from '../repository/player.repository';
import { ITeam } from '../models/team.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { SuccessResponse } from '../utils/response.util';

class TeamService {
    async create(tournamentId: string, data: Partial<ITeam>, userId: string) {
        // Verify tournament exists
        const tournament = await tournamentRepository.getById(tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        // Check authorization
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to create teams for this tournament.');
        }

        // Check max teams limit
        const teamCount = await teamRepository.countByTournament(tournamentId);
        if (teamCount >= tournament.settings.maxTeams) {
            throw new BadRequestError(`Maximum team limit (${tournament.settings.maxTeams}) reached.`);
        }

        // Check duplicate team name
        const nameExists = await teamRepository.existsByName(tournamentId, data.name!);
        if (nameExists) {
            throw new BadRequestError('A team with this name already exists in the tournament.');
        }

        // Validate captain if provided
        if (data.captainId) {
            const captain = await playerRepository.getById(data.captainId);
            if (!captain) {
                throw new BadRequestError('Captain player not found.');
            }
        }

        // Create team with default budget from tournament settings
        const initialBudget = data.initialBudget || tournament.settings.defaultBudget;
        const team = await teamRepository.create({
            ...data,
            tournamentId,
            initialBudget,
            budget: initialBudget,
        });

        // If captain is set, assign all their tournament registrations to this team
        if (data.captainId) {
            const registrations = await tournamentRegistrationRepository.getByTournament(tournamentId, {});
            const captainRegistrations = registrations.filter(
                r => r.playerId === data.captainId && (r.status === 'approved' || r.status === 'pending')
            );
            for (const reg of captainRegistrations) {
                await tournamentRegistrationRepository.manualAssign(reg._id, team._id);
            }
        }

        return new SuccessResponse('Team created successfully.', team);
    }

    async getById(id: string) {
        const team = await teamRepository.getById(id);
        if (!team) {
            throw new NotFoundError('Team not found.');
        }
        return new SuccessResponse('Team fetched successfully.', team);
    }

    async getByTournament(tournamentId: string) {
        const tournament = await tournamentRepository.getById(tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        const teams = await teamRepository.getByTournament(tournamentId);
        return new SuccessResponse('Teams fetched successfully.', teams);
    }

    async update(id: string, data: Partial<ITeam>, userId: string) {
        const team = await teamRepository.getById(id);
        if (!team) {
            throw new NotFoundError('Team not found.');
        }

        // Check authorization
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(team.tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to update this team.');
        }

        // If updating name, check for duplicates
        if (data.name && data.name !== team.name) {
            const nameExists = await teamRepository.existsByName(team.tournamentId, data.name);
            if (nameExists) {
                throw new BadRequestError('A team with this name already exists in the tournament.');
            }
        }

        // If captain is being changed, handle registration assignments
        if (data.captainId !== undefined && data.captainId !== team.captainId) {
            // Unassign old captain's registrations if they were the captain
            if (team.captainId) {
                const oldRegs = await tournamentRegistrationRepository.getByTournament(team.tournamentId, {});
                const oldCaptainRegs = oldRegs.filter(
                    r => r.playerId === team.captainId && r.teamId === team._id && r.status === 'assigned'
                );
                for (const reg of oldCaptainRegs) {
                    await tournamentRegistrationRepository.unassignFromTeam(reg._id);
                }
            }

            // Assign new captain's registrations
            if (data.captainId) {
                const captain = await playerRepository.getById(data.captainId);
                if (!captain) {
                    throw new BadRequestError('Captain player not found.');
                }
                const registrations = await tournamentRegistrationRepository.getByTournament(team.tournamentId, {});
                const captainRegistrations = registrations.filter(
                    r => r.playerId === data.captainId && (r.status === 'approved' || r.status === 'pending')
                );
                for (const reg of captainRegistrations) {
                    await tournamentRegistrationRepository.manualAssign(reg._id, team._id);
                }
            }
        }

        const updated = await teamRepository.update(id, data);
        return new SuccessResponse('Team updated successfully.', updated);
    }

    async delete(id: string, userId: string) {
        const team = await teamRepository.getById(id);
        if (!team) {
            throw new NotFoundError('Team not found.');
        }

        // Check authorization - only organizer can delete
        const isOrganizer = await tournamentRepository.isOrganizer(team.tournamentId, userId);
        if (!isOrganizer) {
            throw new ForbiddenError('Only the tournament organizer can delete teams.');
        }

        await teamRepository.delete(id);
        return new SuccessResponse('Team deleted successfully.');
    }

    async updateBudget(id: string, newBudget: number, userId: string) {
        const team = await teamRepository.getById(id);
        if (!team) {
            throw new NotFoundError('Team not found.');
        }

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(team.tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to update this team.');
        }

        if (newBudget < 0) {
            throw new BadRequestError('Budget cannot be negative.');
        }

        const updated = await teamRepository.update(id, { budget: newBudget });
        return new SuccessResponse('Team budget updated successfully.', updated);
    }

    async searchPlayerByEmail(email: string) {
        const player = await playerRepository.getByEmail(email);
        if (!player) {
            throw new NotFoundError('No player found with this email.');
        }
        return new SuccessResponse('Player found.', {
            _id: player._id,
            firstName: player.firstName,
            lastName: player.lastName,
            email: player.email,
            phone: player.phone,
            profileImage: player.profileImage,
        });
    }

    async resetBudget(id: string, userId: string) {
        const team = await teamRepository.getById(id);
        if (!team) {
            throw new NotFoundError('Team not found.');
        }

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(team.tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to update this team.');
        }

        const updated = await teamRepository.resetBudget(id);
        return new SuccessResponse('Team budget reset successfully.', updated);
    }
}

export const teamService = new TeamService();
