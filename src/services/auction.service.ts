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

    // ========================================================================
    // START AUCTION (now accepts settings: bidIncrement, hardLimit)
    // ========================================================================

    async startAuction(tournamentId: string, categoryId: string, userId: string, opts?: {
        bidIncrement?: number;
        hardLimit?: number;
    }) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const existing = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (existing && existing.status !== IAuctionStatus.NOT_STARTED) {
            throw new BadRequestError('Auction already started for this category.');
        }

        const players = await tournamentRegistrationRepository.getApprovedUnassigned(categoryId);
        if (players.length === 0) {
            throw new BadRequestError('No approved players available for auction.');
        }

        const playerQueue = players.map(p => p._id.toString());
        const firstPlayer = await tournamentRegistrationRepository.getById(playerQueue[0]);
        const basePrice = firstPlayer?.auctionData?.basePrice || 0;

        const settings = {
            minBidIncrement: opts?.bidIncrement || 100,
            bidDurationSeconds: 30,
            hardLimit: opts?.hardLimit || 0,
        };

        const liveBid = {
            currentPrice: basePrice,
            highestBidderId: '',
            highestBidderName: '',
            bidHistory: [] as any[],
            tiedTeams: [] as string[],
        };

        let auction;
        if (existing) {
            auction = await auctionRepository.update(existing._id, {
                playerQueue,
                currentPlayerIndex: 0,
                currentRegistrationId: playerQueue[0],
                status: IAuctionStatus.IN_PROGRESS,
                startedAt: new Date(),
                settings: settings as any,
                liveBid: liveBid as any,
                unsoldQueue: [],
                rotationCount: 0,
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
                settings: settings as any,
                liveBid: liveBid as any,
                unsoldQueue: [],
                rotationCount: 0,
            });
        }

        const currentPlayer = await tournamentRegistrationRepository.getById(playerQueue[0]);

        return new SuccessResponse('Auction started.', {
            auction,
            currentPlayer,
            totalPlayers: playerQueue.length,
        });
    }

    // ========================================================================
    // GET STATUS (enhanced with liveBid info)
    // ========================================================================

    async getStatus(tournamentId: string, categoryId: string) {
        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) {
            throw new NotFoundError('Auction not found.');
        }

        let currentPlayer = null;
        if (auction.currentRegistrationId) {
            currentPlayer = await tournamentRegistrationRepository.getById(auction.currentRegistrationId);
        }

        const teams = await teamRepository.getByTournament(tournamentId);
        const category = await categoryRepository.getById(categoryId);
        const tournament = await tournamentRepository.getById(tournamentId);

        return new SuccessResponse('Auction status.', {
            auction: {
                _id: auction._id,
                status: auction.status,
                currentPlayerIndex: auction.currentPlayerIndex,
                totalPlayers: auction.playerQueue.length,
                lastSoldResult: auction.lastSoldResult,
                logsCount: auction.logs.length,
                liveBid: auction.liveBid || { currentPrice: 0, highestBidderId: '', highestBidderName: '', bidHistory: [], tiedTeams: [], tieBreakerActive: false, spinWinnerId: null, spinStartedAt: null },
                settings: auction.settings,
                unsoldCount: (auction.unsoldQueue || []).length,
                rotationCount: auction.rotationCount || 0,
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

    // ========================================================================
    // PLACE BID — team clicks, price increments
    // ========================================================================

    async placeBid(tournamentId: string, categoryId: string, teamId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');
        if (auction.status !== IAuctionStatus.IN_PROGRESS) {
            throw new BadRequestError('Auction is not in progress.');
        }
        if (!auction.currentRegistrationId) throw new BadRequestError('No current player.');

        const team = await teamRepository.getById(teamId);
        if (!team || team.tournamentId !== tournamentId) {
            throw new NotFoundError('Team not found in this tournament.');
        }

        const increment = auction.settings?.minBidIncrement || 100;
        const hardLimit = auction.settings?.hardLimit || 0;
        const currentPrice = auction.liveBid?.currentPrice || 0;

        // CASE 1: Price is already at the hard limit → team is "matching" at the cap
        if (hardLimit > 0 && currentPrice >= hardLimit) {
            if (team.budget < hardLimit) {
                throw new BadRequestError(`Team budget insufficient for hard limit price ₹${hardLimit}.`);
            }

            const tiedSet = new Set(auction.liveBid?.tiedTeams || []);
            if (tiedSet.has(teamId)) {
                throw new BadRequestError('Team has already matched at the hard limit.');
            }
            tiedSet.add(teamId);

            const bidEntry = {
                teamId: team._id.toString(),
                teamName: team.name,
                amount: hardLimit,
                timestamp: new Date(),
            };

            await auctionRepository.update(auction._id, {
                'liveBid.tiedTeams': Array.from(tiedSet),
                $push: { 'liveBid.bidHistory': bidEntry },
            } as any);

            return new SuccessResponse(`${team.name} matched at hard limit!`, {
                hardLimitReached: true,
                tiedTeams: Array.from(tiedSet),
                currentPrice: hardLimit,
            });
        }

        const newPrice = currentPrice + increment;

        // Budget check
        if (team.budget < newPrice) {
            throw new BadRequestError(`Team budget insufficient. Available: ₹${team.budget}, Bid would be: ₹${newPrice}`);
        }

        // CASE 2: This bid would exceed the hard limit → cap at hard limit
        if (hardLimit > 0 && newPrice > hardLimit) {
            throw new BadRequestError(`Bid would exceed hard limit of ₹${hardLimit}. Current price: ₹${currentPrice}`);
        }

        const bidEntry = {
            teamId: team._id.toString(),
            teamName: team.name,
            amount: newPrice,
            timestamp: new Date(),
        };

        // CASE 3: This bid reaches exactly the hard limit
        if (hardLimit > 0 && newPrice === hardLimit) {
            const tiedSet = new Set<string>();
            tiedSet.add(teamId);

            await auctionRepository.update(auction._id, {
                'liveBid.currentPrice': newPrice,
                'liveBid.highestBidderId': teamId,
                'liveBid.highestBidderName': team.name,
                'liveBid.tiedTeams': Array.from(tiedSet),
                'liveBid.tieBreakerActive': false,
                'liveBid.spinWinnerId': null,
                'liveBid.spinStartedAt': null,
                $push: { 'liveBid.bidHistory': bidEntry },
            } as any);

            return new SuccessResponse('Hard limit reached! Other teams can still match.', {
                hardLimitReached: true,
                tiedTeams: Array.from(tiedSet),
                currentPrice: newPrice,
            });
        }

        // CASE 4: Normal bid (below hard limit or no limit)
        await auctionRepository.update(auction._id, {
            'liveBid.currentPrice': newPrice,
            'liveBid.highestBidderId': teamId,
            'liveBid.highestBidderName': team.name,
            'liveBid.tiedTeams': [],
            'liveBid.tieBreakerActive': false,
            'liveBid.spinWinnerId': null,
            'liveBid.spinStartedAt': null,
            $push: { 'liveBid.bidHistory': bidEntry },
        } as any);

        return new SuccessResponse('Bid placed.', {
            hardLimitReached: false,
            currentPrice: newPrice,
            highestBidder: team.name,
            teamId,
        });
    }

    // ========================================================================
    // START TIE BREAKER — signals public dashboard to show wheel
    // ========================================================================

    async startTieBreaker(tournamentId: string, categoryId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        const tiedTeams = auction.liveBid?.tiedTeams || [];
        if (tiedTeams.length < 2) throw new BadRequestError('Not enough attached teams to tie break.');

        await auctionRepository.update(auction._id, {
            'liveBid.tieBreakerActive': true,
            'liveBid.spinWinnerId': null,
            'liveBid.spinStartedAt': null,
        } as any);

        return new SuccessResponse('Tie breaker started.', { tieBreakerActive: true });
    }

    // ========================================================================
    // TRIGGER SPIN WHEEL — selects winner and signals animation
    // ========================================================================

    async triggerSpinWheel(tournamentId: string, categoryId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        const tiedTeams = auction.liveBid?.tiedTeams || [];
        if (tiedTeams.length < 2) throw new BadRequestError('Not enough attached teams to tie break.');

        const winnerIdx = Math.floor(Math.random() * tiedTeams.length);
        const winnerId = tiedTeams[winnerIdx];

        await auctionRepository.update(auction._id, {
            'liveBid.spinWinnerId': winnerId,
            'liveBid.spinStartedAt': new Date()
        } as any);

        return new SuccessResponse('Spin triggered.', { winnerId });
    }

    // ========================================================================
    // RESOLVE HARD LIMIT — organizer picks winner from spin-the-wheel
    // ========================================================================

    async resolveHardLimit(tournamentId: string, categoryId: string, winnerTeamId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        const hardLimit = auction.settings?.hardLimit || 0;
        if (hardLimit === 0) throw new BadRequestError('No hard limit set.');

        const tiedTeams = auction.liveBid?.tiedTeams || [];
        if (!tiedTeams.includes(winnerTeamId)) {
            throw new BadRequestError('Winner team is not in the tie-breaker.');
        }

        // Use the hardLimit price as sold price and leverage the existing sell flow
        return this.sellPlayer(tournamentId, categoryId, winnerTeamId, hardLimit, userId);
    }

    // ========================================================================
    // SELL PLAYER (existing — now also resets liveBid)
    // ========================================================================

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

        const player = await tournamentRegistrationRepository.getById(registrationId);
        if (!player) throw new NotFoundError('Player registration not found.');

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

    // ========================================================================
    // NEXT PLAYER (initializes liveBid for new player, handles unsold rotation)
    // ========================================================================

    async nextPlayer(tournamentId: string, categoryId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        const nextIndex = auction.currentPlayerIndex + 1;
        let nextRegistrationId: string | null = null;

        if (nextIndex < auction.playerQueue.length) {
            // Still have players in the main queue
            nextRegistrationId = auction.playerQueue[nextIndex];

            const nextPlayer = await tournamentRegistrationRepository.getById(nextRegistrationId);
            const basePrice = nextPlayer?.auctionData?.basePrice || 0;

            await auctionRepository.update(auction._id, {
                currentPlayerIndex: nextIndex,
                currentRegistrationId: nextRegistrationId,
                status: IAuctionStatus.IN_PROGRESS,
                lastSoldResult: null,
                liveBid: {
                    currentPrice: basePrice,
                    highestBidderId: '',
                    highestBidderName: '',
                    bidHistory: [],
                    tiedTeams: [],
                    tieBreakerActive: false,
                    spinWinnerId: null,
                    spinStartedAt: null,
                },
            } as any);

            return new SuccessResponse('Next player.', {
                currentPlayer: nextPlayer,
                currentIndex: nextIndex,
                totalPlayers: auction.playerQueue.length,
                completed: false,
            });
        }

        // Main queue exhausted — check unsold queue
        const unsoldQueue = auction.unsoldQueue || [];
        if (unsoldQueue.length > 0) {
            // Start next rotation from unsold queue
            const newRotation = (auction.rotationCount || 0) + 1;
            nextRegistrationId = unsoldQueue[0];
            const remainingUnsold = unsoldQueue.slice(1);

            const nextPlayer = await tournamentRegistrationRepository.getById(nextRegistrationId);
            const basePrice = nextPlayer?.auctionData?.basePrice || 0;

            // Move unsold queue into a fresh player queue cycle
            await auctionRepository.update(auction._id, {
                currentPlayerIndex: 0,
                playerQueue: [nextRegistrationId, ...remainingUnsold],
                currentRegistrationId: nextRegistrationId,
                status: IAuctionStatus.IN_PROGRESS,
                lastSoldResult: null,
                unsoldQueue: [],
                rotationCount: newRotation,
                liveBid: {
                    currentPrice: basePrice,
                    highestBidderId: '',
                    highestBidderName: '',
                    bidHistory: [],
                    tiedTeams: [],
                    tieBreakerActive: false,
                    spinWinnerId: null,
                    spinStartedAt: null,
                },
            } as any);

            return new SuccessResponse(`Rotation ${newRotation}: Unsold players re-entering.`, {
                currentPlayer: nextPlayer,
                currentIndex: 0,
                totalPlayers: unsoldQueue.length,
                rotation: newRotation,
                completed: false,
            });
        }

        // Completely done
        await auctionRepository.updateStatus(auction._id, IAuctionStatus.COMPLETED, {
            completedAt: new Date(),
            currentRegistrationId: null,
        });
        return new SuccessResponse('Auction completed! All players processed.', { completed: true });
    }

    // ========================================================================
    // SKIP PLAYER (unsold → push to unsoldQueue for rotation)
    // ========================================================================

    async skipPlayer(tournamentId: string, categoryId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        const currentRegId = auction.currentRegistrationId;
        if (currentRegId) {
            // Push to unsold queue for rotation
            await auctionRepository.update(auction._id, {
                $push: { unsoldQueue: currentRegId },
            } as any);
        }

        // Move to next
        return this.nextPlayer(tournamentId, categoryId, userId);
    }

    // ========================================================================
    // UNDO LAST SALE
    // ========================================================================

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
        const player = await tournamentRegistrationRepository.getById(lastLog.registrationId);
        const basePrice = player?.auctionData?.basePrice || 0;

        await auctionRepository.update(auction._id, {
            currentPlayerIndex: auction.currentPlayerIndex > 0 ? auction.currentPlayerIndex - 1 : 0,
            currentRegistrationId: lastLog.registrationId,
            status: IAuctionStatus.IN_PROGRESS,
            liveBid: {
                currentPrice: basePrice,
                highestBidderId: '',
                highestBidderName: '',
                bidHistory: [],
                tiedTeams: [],
            },
        } as any);

        return new SuccessResponse('Last action undone.', {
            undone: {
                playerName: lastLog.playerName,
                teamName: lastLog.teamName,
                price: lastLog.finalPrice,
            },
        });
    }

    // ========================================================================
    // PAUSE / RESUME
    // ========================================================================

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

    // ========================================================================
    // END AUCTION (manual stop)
    // ========================================================================

    async endAuction(tournamentId: string, categoryId: string, userId: string) {
        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const auction = await auctionRepository.getByTournamentAndCategory(tournamentId, categoryId);
        if (!auction) throw new NotFoundError('Auction not found.');

        await auctionRepository.updateStatus(auction._id, IAuctionStatus.COMPLETED, {
            completedAt: new Date(),
            currentRegistrationId: null,
        });

        return new SuccessResponse('Auction ended.', { completed: true });
    }

    // ========================================================================
    // GET SOLD LOG
    // ========================================================================

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
