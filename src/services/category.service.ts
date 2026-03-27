import { categoryRepository } from '../repository/category.repository';
import { tournamentRepository } from '../repository/tournament.repository';
import { ICategory, ICategoryStatus, IBracketType } from '../models/category.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { SuccessResponse } from '../utils/response.util';
import { matchService } from './match.service';
import { playerRepository } from '../repository/player.repository';
import { tournamentRegistrationRepository } from '../repository/tournamentRegistration.repository';
import { teamRepository } from '../repository/team.repository';

class CategoryService {
    async create(tournamentId: string, data: Partial<ICategory>, userId: string) {
        // Verify tournament exists
        const tournament = await tournamentRepository.getById(tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        // Check authorization
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to create categories for this tournament.');
        }

        // Check duplicate category name
        const nameExists = await categoryRepository.existsByName(tournamentId, data.name!);
        if (nameExists) {
            throw new BadRequestError('A category with this name already exists in the tournament.');
        }

        // Validate registration fee if paid registration is enabled
        if (data.isPaidRegistration && (!data.registrationFee || data.registrationFee <= 0)) {
            throw new BadRequestError('Registration fee must be greater than 0 for paid categories.');
        }

        // Validate hybrid config if bracket type is hybrid
        if (data.bracketType === IBracketType.HYBRID) {
            if (!data.hybridConfig?.leagueSize || !data.hybridConfig?.topN) {
                throw new BadRequestError('Hybrid config (leagueSize, topN) is required for hybrid bracket type.');
            }
            if (data.hybridConfig.topN >= data.hybridConfig.leagueSize) {
                throw new BadRequestError('topN must be less than leagueSize.');
            }
        }

        const category = await categoryRepository.create({
            ...data,
            tournamentId,
            status: ICategoryStatus.SETUP,
        });

        return new SuccessResponse('Category created successfully.', category);
    }

    async getById(id: string) {
        const category = await categoryRepository.getById(id);
        if (!category) {
            throw new NotFoundError('Category not found.');
        }
        return new SuccessResponse('Category fetched successfully.', category);
    }

    async getByTournament(tournamentId: string) {
        const tournament = await tournamentRepository.getById(tournamentId);
        if (!tournament) {
            throw new NotFoundError('Tournament not found.');
        }

        const categories = await categoryRepository.getByTournament(tournamentId);
        return new SuccessResponse('Categories fetched successfully.', categories);
    }

    async getCategoryAnalytics(id: string, userId: string) {
        const category = await categoryRepository.getById(id);
        if (!category) throw new NotFoundError('Category not found.');

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(category.tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const analytics = await tournamentRegistrationRepository.getAnalyticsByCategory(id);

        const teams = await teamRepository.getByTournament(category.tournamentId);
        const teamMap = teams.reduce((acc: any, t: any) => ({ ...acc, [t._id.toString()]: t }), {});

        const data = analytics.map(a => ({
            ...a,
            team: a.teamId ? teamMap[a.teamId.toString()] : null
        }));

        return new SuccessResponse('Analytics fetched successfully.', data);
    }

    async update(id: string, data: Partial<ICategory>, userId: string) {
        const category = await categoryRepository.getById(id);
        if (!category) {
            throw new NotFoundError('Category not found.');
        }

        // Check authorization
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(category.tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to update this category.');
        }

        // If updating name, check for duplicates
        if (data.name && data.name !== category.name) {
            const nameExists = await categoryRepository.existsByName(category.tournamentId, data.name);
            if (nameExists) {
                throw new BadRequestError('A category with this name already exists in the tournament.');
            }
        }

        // Validate registration fee if enabling paid registration
        const isPaid = data.isPaidRegistration ?? category.isPaidRegistration;
        const fee = data.registrationFee ?? category.registrationFee;
        if (isPaid && (!fee || fee <= 0)) {
            throw new BadRequestError('Registration fee must be greater than 0 for paid categories.');
        }

        // Validate hybrid config if changing to hybrid
        if (data.bracketType === IBracketType.HYBRID) {
            const hybridConfig = data.hybridConfig || category.hybridConfig;
            if (!hybridConfig?.leagueSize || !hybridConfig?.topN) {
                throw new BadRequestError('Hybrid config (leagueSize, topN) is required for hybrid bracket type.');
            }
        }

        const updated = await categoryRepository.update(id, data);
        return new SuccessResponse('Category updated successfully.', updated);
    }

    async delete(id: string, userId: string) {
        const category = await categoryRepository.getById(id);
        if (!category) {
            throw new NotFoundError('Category not found.');
        }

        // Check authorization - only organizer can delete
        const isOrganizer = await tournamentRepository.isOrganizer(category.tournamentId, userId);
        if (!isOrganizer) {
            throw new ForbiddenError('Only the tournament organizer can delete categories.');
        }

        await categoryRepository.delete(id);
        return new SuccessResponse('Category deleted successfully.');
    }

    // Status transitions
    async openRegistration(id: string, userId: string) {
        return this.updateStatus(id, userId, ICategoryStatus.REGISTRATION,
            [ICategoryStatus.SETUP], 'Category must be in setup status.');
    }

    async startAuction(id: string, userId: string) {
        return this.updateStatus(id, userId, ICategoryStatus.AUCTION,
            [ICategoryStatus.REGISTRATION], 'Category must be in registration status.');
    }

    async configureBracket(id: string, userId: string) {
        // First generate the bracket (will validate auth + teams)
        const bracketResult = await matchService.generateBracket(id, userId);

        // Then transition the status
        await this.updateStatus(id, userId, ICategoryStatus.BRACKET_CONFIGURED,
            [ICategoryStatus.AUCTION], 'Category must be in auction status.');

        return bracketResult;
    }

    async startCategory(id: string, userId: string) {
        return this.updateStatus(id, userId, ICategoryStatus.ONGOING,
            [ICategoryStatus.BRACKET_CONFIGURED], 'Category bracket must be configured first.');
    }

    async completeCategory(id: string, userId: string) {
        try {
            const matchesRes = await matchService.getMatchesByCategory(id);
            const matchesList = (matchesRes as any).data?.matches || [];
            
            if (matchesList.length > 0) {
                const finalMatch = matchesList.find((m: any) => m.bracketRound === 'Final' || !m.nextMatchId);
                
                if (finalMatch && finalMatch.winnerId) {
                    const category = await categoryRepository.getById(id);
                    const tournament = await tournamentRepository.getById(category?.tournamentId || '');
                    
                    if (category && tournament) {
                        const titleString = `Winner of ${category.name} at ${tournament.name}`;
                        const competitorType = finalMatch.competitorType || 'team';
                        
                        if (competitorType === 'player') {
                            const winnerRegId = finalMatch.winnerId.toString();
                            const winnerReg = await tournamentRegistrationRepository.getById(winnerRegId);
                            if (winnerReg && winnerReg.playerId) {
                                await playerRepository.addTitle(winnerReg.playerId, titleString);
                            }
                        } else if (competitorType === 'team') {
                            const winnerTeamId = finalMatch.winnerId.toString();
                            const players = await tournamentRegistrationRepository.getByTeam(winnerTeamId);
                            for (const p of players) {
                                await playerRepository.addTitle(p.playerId, titleString);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error assigning title upon category completion:', e);
        }

        return this.updateStatus(id, userId, ICategoryStatus.COMPLETED,
            [ICategoryStatus.ONGOING], 'Category must be ongoing.');
    }

    private async updateStatus(
        id: string,
        userId: string,
        newStatus: ICategoryStatus,
        allowedStatuses: ICategoryStatus[],
        errorMessage: string
    ) {
        const category = await categoryRepository.getById(id);
        if (!category) {
            throw new NotFoundError('Category not found.');
        }

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(category.tournamentId, userId);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to update this category.');
        }

        if (!allowedStatuses.includes(category.status as ICategoryStatus)) {
            throw new BadRequestError(errorMessage);
        }

        const updated = await categoryRepository.updateStatus(id, newStatus);
        return new SuccessResponse(`Category status updated to ${newStatus}.`, updated);
    }
}

export const categoryService = new CategoryService();
