import { auctionRepository } from '../repository/auction.repository';
import { tournamentRegistrationRepository } from '../repository/tournamentRegistration.repository';
import { tournamentRepository } from '../repository/tournament.repository';
import { teamRepository } from '../repository/team.repository';
import { categoryRepository } from '../repository/category.repository';
import { IAuctionStatus, IAuctionLogType } from '../models/auction.model';
import { ITournamentRegistrationStatus } from '../models/tournamentRegistration.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { SuccessResponse } from '../utils/response.util';

class AuctionService {
    async startAuction(tournamentId: string, categoryId: string, userId: string) {
        // Auth check
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        console.log(isAuthorized);

        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        // Check if auction already exists for this category
        const existing = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (existing && existing.status !== IAuctionStatus.NOT_STARTED) {
            throw new BadRequestError('Auction already started for this category.');
        }

        // Get approved players for this category
        const players = await tournamentRegistrationRepository.getApprovedUnassigned(categoryId);
        if (players.length === 0) {
            throw new BadRequestError('No approved players available for auction.');
        }

        const playerQueue = players.map(p => p._id.toString());

        let auction;
        if (existing) {
            auction = await auctionRepository.update(existing._id, {
                playerQueue,
                currentPlayerIndex: 0,
                currentRegistrationId: playerQueue[0],
                status: IAuctionStatus.IN_PROGRESS,
                startedAt: new Date(),
            });
        } else {
            auction = await auctionRepository.create({
                tournamentId,
                categoryId,
                status: IAuctionStatus.IN_PROGRESS,
                auctionType: IAuctionLogType.MANUAL,
                playerQueue,
                currentPlayerIndex: 0,
                currentRegistrationId: playerQueue[0],
                startedAt: new Date(),
            });
        }

        // Get current player details
        const currentPlayer = await tournamentRegistrationRepository.getById(playerQueue[0]);

        return new SuccessResponse('Auction started.', {
            auction,
            currentPlayer,
            totalPlayers: playerQueue.length,
        });
    }

    async getStatus(tournamentId: string, categoryId: string) {
        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) {
            throw new NotFoundError('Auction not found.');
        }

        // Get current player details
        let currentPlayer = null;
        if (auction.currentRegistrationId) {
            currentPlayer = await tournamentRegistrationRepository.getById(auction.currentRegistrationId);
        }

        // Get teams with budgets
        const teams = await teamRepository.getByTournament(tournamentId);

        // Get category info
        const category = await categoryRepository.getById(categoryId);

        // Get tournament info
        const tournament = await tournamentRepository.getById(tournamentId);

        return new SuccessResponse('Auction status.', {
            auction: {
                _id: auction._id,
                status: auction.status,
                currentPlayerIndex: auction.currentPlayerIndex,
                totalPlayers: auction.playerQueue.length,
                lastSoldResult: auction.lastSoldResult,
                logsCount: auction.logs.length,
            },
            currentPlayer,
            teams: teams.map(t => ({
                _id: t._id,
                name: t.name,
                primaryColor: t.primaryColor,
                secondaryColor: t.secondaryColor,
                budget: t.budget,
                initialBudget: t.initialBudget,
                playersCount: auction.logs.filter(l => l.teamId === t._id.toString()).length,
                totalSpent: auction.logs.filter(l => l.teamId === t._id.toString()).reduce((sum, l) => sum + l.finalPrice, 0),
            })),
            category: category ? { _id: category._id, name: category.name } : null,
            tournament: tournament ? { _id: tournament._id, name: tournament.name } : null,
        });
    }

    async sellPlayer(
        tournamentId: string,
        categoryId: string,
        teamId: string,
        soldPrice: number,
        userId: string
    ) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');
        if (auction.status !== IAuctionStatus.IN_PROGRESS) {
            throw new BadRequestError('Auction is not in progress.');
        }

        const registrationId = auction.currentRegistrationId;
        if (!registrationId) throw new BadRequestError('No current player to sell.');

        // Get player
        const player = await tournamentRegistrationRepository.getById(registrationId);
        if (!player) throw new NotFoundError('Player registration not found.');

        // Get team
        const team = await teamRepository.getById(teamId);
        if (!team || team.tournamentId !== tournamentId) {
            throw new NotFoundError('Team not found in this tournament.');
        }

        if (team.budget < soldPrice) {
            throw new BadRequestError(`Team budget insufficient. Available: ${team.budget}, Required: ${soldPrice}`);
        }

        // Assign player to team
        await tournamentRegistrationRepository.assignToTeam(registrationId, teamId, soldPrice);

        // Deduct budget
        await teamRepository.deductBudget(teamId, soldPrice);

        // Log the sale
        const soldResult = {
            registrationId,
            playerName: `${player.profile.firstName} ${player.profile.lastName}`,
            teamId,
            teamName: team.name,
            teamColor: team.primaryColor || '#ffffff',
            soldPrice,
        };

        await auctionRepository.markSold(auction._id, soldResult, {
            registrationId,
            playerName: `${player.profile.firstName} ${player.profile.lastName}`,
            teamId,
            teamName: team.name,
            finalPrice: soldPrice,
            auctionType: IAuctionLogType.MANUAL,
            recordedBy: userId,
            timestamp: new Date(),
        });

        return new SuccessResponse('Player sold!', soldResult);
    }

    async nextPlayer(tournamentId: string, categoryId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        const nextIndex = auction.currentPlayerIndex + 1;

        // Check if auction is done
        if (nextIndex >= auction.playerQueue.length) {
            await auctionRepository.updateStatus(auction._id, IAuctionStatus.COMPLETED, {
                completedAt: new Date(),
                currentRegistrationId: null,
            });
            return new SuccessResponse('Auction completed! All players processed.', { completed: true });
        }

        const nextRegistrationId = auction.playerQueue[nextIndex];
        await auctionRepository.setCurrentPlayer(auction._id, nextIndex, nextRegistrationId);

        const nextPlayer = await tournamentRegistrationRepository.getById(nextRegistrationId);

        return new SuccessResponse('Next player.', {
            currentPlayer: nextPlayer,
            currentIndex: nextIndex,
            totalPlayers: auction.playerQueue.length,
        });
    }

    async skipPlayer(tournamentId: string, categoryId: string, userId: string) {
        // Skip just advances to the next player without selling
        return this.nextPlayer(tournamentId, categoryId, userId);
    }

    async undoLast(tournamentId: string, categoryId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');
        if (auction.logs.length === 0) {
            throw new BadRequestError('No actions to undo.');
        }

        const lastLog = auction.logs[auction.logs.length - 1];

        // Unassign player from team
        await tournamentRegistrationRepository.unassignFromTeam(lastLog.registrationId);

        // Restore team budget
        await teamRepository.restoreBudget(lastLog.teamId, lastLog.finalPrice);

        // Remove last log
        await auctionRepository.removeLastLog(auction._id);

        // Go back to the sold player
        await auctionRepository.setCurrentPlayer(
            auction._id,
            auction.currentPlayerIndex > 0 ? auction.currentPlayerIndex - 1 : 0,
            lastLog.registrationId
        );

        return new SuccessResponse('Last action undone.', {
            undone: {
                playerName: lastLog.playerName,
                teamName: lastLog.teamName,
                price: lastLog.finalPrice,
            },
        });
    }

    async pauseAuction(tournamentId: string, categoryId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        const newStatus = auction.status === IAuctionStatus.PAUSED
            ? IAuctionStatus.IN_PROGRESS
            : IAuctionStatus.PAUSED;

        const updated = await auctionRepository.updateStatus(auction._id, newStatus);
        return new SuccessResponse(
            newStatus === IAuctionStatus.PAUSED ? 'Auction paused.' : 'Auction resumed.',
            updated
        );
    }

    async getSoldLog(tournamentId: string, categoryId: string) {
        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        return new SuccessResponse('Sold log.', {
            logs: auction.logs,
            totalSold: auction.logs.length,
            totalRevenue: auction.logs.reduce((sum, l) => sum + l.finalPrice, 0),
        });
    }
}

export const auctionService = new AuctionService();
