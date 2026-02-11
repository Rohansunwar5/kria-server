import { teamRepository } from '../repository/team.repository';
import { tournamentRepository } from '../repository/tournament.repository';
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

        // Create team with default budget from tournament settings
        const initialBudget = data.initialBudget || tournament.settings.defaultBudget;
        const team = await teamRepository.create({
            ...data,
            tournamentId,
            initialBudget,
            budget: initialBudget,
        });

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
