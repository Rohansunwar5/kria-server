import { matchRepository } from '../repository/match.repository';
import { categoryRepository } from '../repository/category.repository';
import { teamRepository } from '../repository/team.repository';
import { tournamentRepository } from '../repository/tournament.repository';
import { tournamentRegistrationRepository } from '../repository/tournamentRegistration.repository';
import { IMatch, IMatchStatus } from '../models/match.model';
import { IBracketType, IMatchType } from '../models/category.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { SuccessResponse } from '../utils/response.util';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PlayerCompetitor {
    registrationId: string;
    name: string;
    teamId: string;
    teamName: string;
}

interface TeamCompetitor {
    _id: string;
    name: string;
}

// A placeholder match slot used during tree construction
interface MatchSlot {
    roundNumber: number;
    positionInRound: number;
    bracketRound: string;
    matchNumber: number;
    // For player mode
    player1?: PlayerCompetitor | null;
    player2?: PlayerCompetitor | null;
    // For team mode
    team1?: TeamCompetitor | null;
    team2?: TeamCompetitor | null;
    // Auto-set after DB insert
    _id?: string;
    status: IMatchStatus;
    winnerId?: string;
    winReason?: string;
}

class MatchService {

    // ═══════════════════════════════════════════════════════════════════════════
    // BRACKET GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    async generateBracket(categoryId: string, userId: string) {
        const category = await categoryRepository.getById(categoryId);
        if (!category) throw new NotFoundError('Category not found.');

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(category.tournamentId, userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const tournament = await tournamentRepository.getById(category.tournamentId);
        if (!tournament) throw new NotFoundError('Tournament not found.');

        // Clear existing matches
        await matchRepository.deleteByCategory(categoryId);

        const sportType = tournament.sport || 'badminton';
        const matchConfig = {
            bestOf: category.matchFormat?.bestOf || 3,
            pointsToWin: category.matchFormat?.pointsPerGame || 21,
        };

        const isTeamMode = category.matchType === IMatchType.TEAM;
        const competitorType: 'player' | 'team' = isTeamMode ? 'team' : 'player';

        let created: IMatch[];

        if (isTeamMode) {
            const allTeams = await teamRepository.getByTournament(category.tournamentId);
            if (allTeams.length < 2) throw new BadRequestError('Need at least 2 teams.');
            const competitors: TeamCompetitor[] = allTeams.map(t => ({ _id: t._id, name: t.name }));

            if (category.bracketType === IBracketType.KNOCKOUT) {
                created = await this._generateKnockoutTeam(competitors, categoryId, category.tournamentId, sportType, matchConfig);
            } else {
                created = await this._generateLeagueTeam(competitors, categoryId, category.tournamentId, sportType, matchConfig, competitorType);
            }
        } else {
            const registrations = await tournamentRegistrationRepository.getByCategory(categoryId);
            const assignedRegs = registrations.filter(r =>
                r.teamId && ['auctioned', 'assigned'].includes(r.status)
            );
            if (assignedRegs.length < 2) throw new BadRequestError('Need at least 2 assigned players.');

            const allTeams = await teamRepository.getByTournament(category.tournamentId);
            const teamMap: Record<string, string> = {};
            for (const t of allTeams) teamMap[t._id] = t.name;

            const competitors: PlayerCompetitor[] = assignedRegs.map(reg => ({
                registrationId: reg._id.toString(),
                name: `${(reg as any).profile?.firstName || ''} ${(reg as any).profile?.lastName || ''}`.trim() || 'Unknown',
                teamId: reg.teamId!.toString(),
                teamName: teamMap[reg.teamId!.toString()] || 'Unknown Team',
            }));

            if (category.bracketType === IBracketType.KNOCKOUT) {
                created = await this._generateKnockoutPlayer(competitors, categoryId, category.tournamentId, sportType, matchConfig);
            } else {
                created = await this._generateLeaguePlayer(competitors, categoryId, category.tournamentId, sportType, matchConfig, competitorType);
            }
        }

        return new SuccessResponse('Bracket generated.', {
            matches: created,
            totalMatches: created.length,
            bracketType: category.bracketType,
            competitorType,
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // KNOCKOUT — PLAYER MODE (the big fix)
    // ═══════════════════════════════════════════════════════════════════════════

    private async _generateKnockoutPlayer(
        players: PlayerCompetitor[],
        categoryId: string,
        tournamentId: string,
        sportType: string,
        matchConfig: { bestOf: number; pointsToWin: number }
    ): Promise<IMatch[]> {
        const n = players.length;
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
        const totalRounds = Math.ceil(Math.log2(bracketSize));
        const numByes = bracketSize - n;
        const matchSlotsInR1 = bracketSize / 2;

        // Shuffle players
        const shuffled = [...players].sort(() => Math.random() - 0.5);

        // Build round names
        const roundNames = this._getRoundNames(totalRounds);

        // ── STEP 1: Distribute byes evenly across the bracket ──────────────
        // Each bye = 1 player vs null (auto-advances).
        // Spread byes: one per QF group first (every other R1 position),
        // so each QF match gets at most 1 bye player vs 1 match winner.
        const byePositions = new Set<number>();
        let byesLeft = numByes;
        // First pass: place byes at even positions (0, 2, 4, ...) — one per QF group
        for (let i = 0; i < matchSlotsInR1 && byesLeft > 0; i += 2) {
            byePositions.add(i);
            byesLeft--;
        }
        // Second pass: if more byes needed, fill odd positions
        for (let i = 1; i < matchSlotsInR1 && byesLeft > 0; i += 2) {
            byePositions.add(i);
            byesLeft--;
        }

        // ── Build Round 1 match slots with proper bye distribution ─────────
        const allSlots: MatchSlot[][] = [];
        let globalMatchNumber = 1;
        let playerIdx = 0;

        const r1Slots: MatchSlot[] = [];
        for (let pos = 0; pos < matchSlotsInR1; pos++) {
            if (byePositions.has(pos)) {
                // BYE: one player, auto-advance
                const p = shuffled[playerIdx++];
                r1Slots.push({
                    roundNumber: 1,
                    positionInRound: pos,
                    bracketRound: roundNames[0],
                    matchNumber: globalMatchNumber++,
                    player1: p,
                    player2: null,
                    status: IMatchStatus.WALKOVER,
                    winnerId: p.registrationId,
                    winReason: 'bye',
                });
            } else {
                // REAL MATCH: two players
                const p1 = shuffled[playerIdx++];
                const p2 = shuffled[playerIdx++];
                r1Slots.push({
                    roundNumber: 1,
                    positionInRound: pos,
                    bracketRound: roundNames[0],
                    matchNumber: globalMatchNumber++,
                    player1: p1,
                    player2: p2,
                    status: IMatchStatus.SCHEDULED,
                });
            }
        }
        allSlots.push(r1Slots);

        // ── Build later rounds (all TBD placeholders) ──────────────────────
        for (let round = 1; round < totalRounds; round++) {
            const matchesInRound = bracketSize / Math.pow(2, round + 1);
            const roundSlots: MatchSlot[] = [];
            for (let pos = 0; pos < matchesInRound; pos++) {
                roundSlots.push({
                    roundNumber: round + 1,
                    positionInRound: pos,
                    bracketRound: roundNames[round],
                    matchNumber: globalMatchNumber++,
                    player1: null,
                    player2: null,
                    status: IMatchStatus.SCHEDULED,
                });
            }
            allSlots.push(roundSlots);
        }

        // ── STEP 2: Insert all matches into DB ────────────────────────────

        const matchDocs: Partial<IMatch>[] = [];
        for (const roundSlots of allSlots) {
            for (const slot of roundSlots) {
                const doc: Partial<IMatch> = {
                    tournamentId: tournamentId as any,
                    categoryId: categoryId as any,
                    sportType,
                    competitorType: 'player',
                    bracketRound: slot.bracketRound,
                    matchNumber: slot.matchNumber,
                    roundNumber: slot.roundNumber,
                    positionInRound: slot.positionInRound,
                    matchConfig,
                    status: slot.status,
                };

                if (slot.player1) {
                    doc.player1 = { registrationId: slot.player1.registrationId, name: slot.player1.name, teamId: slot.player1.teamId, teamName: slot.player1.teamName };
                } else {
                    doc.player1 = { registrationId: 'TBD', name: 'TBD', teamId: '', teamName: '' };
                }
                if (slot.player2) {
                    doc.player2 = { registrationId: slot.player2.registrationId, name: slot.player2.name, teamId: slot.player2.teamId, teamName: slot.player2.teamName };
                } else {
                    doc.player2 = { registrationId: 'TBD', name: 'TBD', teamId: '', teamName: '' };
                }

                if (slot.winnerId) doc.winnerId = slot.winnerId as any;
                if (slot.winReason) doc.winReason = slot.winReason;

                matchDocs.push(doc);
            }
        }

        const created = await matchRepository.bulkCreate(matchDocs);

        // ── STEP 3: Link matches with nextMatchId/nextMatchSlot ───────────

        // Build a lookup: [roundNumber][positionInRound] → created match
        const matchGrid: IMatch[][] = [];
        for (let r = 0; r < totalRounds; r++) {
            matchGrid.push([]);
        }
        for (const m of created) {
            const rn = (m as any).roundNumber as number;
            const pos = (m as any).positionInRound as number;
            if (rn && pos !== undefined) {
                if (!matchGrid[rn - 1]) matchGrid[rn - 1] = [];
                matchGrid[rn - 1][pos] = m;
            }
        }

        // Collect sourceMatchIds properly (avoid stale in-memory reads)
        const sourceMap: Record<string, string[]> = {};

        // Link each match to the next round
        for (let r = 0; r < totalRounds - 1; r++) {
            const currentRound = matchGrid[r];
            const nextRound = matchGrid[r + 1];
            if (!currentRound || !nextRound) continue;

            for (let pos = 0; pos < currentRound.length; pos++) {
                const match = currentRound[pos];
                if (!match) continue;

                const nextPos = Math.floor(pos / 2);
                const nextMatch = nextRound[nextPos];
                if (!nextMatch) continue;

                const slot: 'player1' | 'player2' = (pos % 2 === 0) ? 'player1' : 'player2';

                await matchRepository.update(match._id.toString(), {
                    nextMatchId: nextMatch._id as any,
                    nextMatchSlot: slot,
                } as any);

                // Accumulate sourceMatchIds
                const nextId = nextMatch._id.toString();
                if (!sourceMap[nextId]) sourceMap[nextId] = [];
                sourceMap[nextId].push(match._id.toString());
            }
        }

        // Apply sourceMatchIds in one update per target match
        for (const [targetId, sources] of Object.entries(sourceMap)) {
            await matchRepository.update(targetId, {
                sourceMatchIds: sources as any,
            } as any);
        }

        // ── STEP 4: Auto-advance byes ─────────────────────────────────────

        const round1Matches = matchGrid[0] || [];
        for (const match of round1Matches) {
            if (!match) continue;
            if (match.status === IMatchStatus.WALKOVER && match.winnerId) {
                await this._autoAdvanceWinner(match._id.toString());
            }
        }

        // Re-fetch all matches with links populated
        return matchRepository.getByCategory(categoryId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // KNOCKOUT — TEAM MODE
    // ═══════════════════════════════════════════════════════════════════════════

    private async _generateKnockoutTeam(
        teams: TeamCompetitor[],
        categoryId: string,
        tournamentId: string,
        sportType: string,
        matchConfig: { bestOf: number; pointsToWin: number }
    ): Promise<IMatch[]> {
        const n = teams.length;
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
        const totalRounds = Math.ceil(Math.log2(bracketSize));
        const numByes = bracketSize - n;
        const matchSlotsInR1 = bracketSize / 2;

        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        const roundNames = this._getRoundNames(totalRounds);
        const TBD_ID = '000000000000000000000000';

        // Distribute byes evenly
        const byePositions = new Set<number>();
        let byesLeft = numByes;
        for (let i = 0; i < matchSlotsInR1 && byesLeft > 0; i += 2) {
            byePositions.add(i);
            byesLeft--;
        }
        for (let i = 1; i < matchSlotsInR1 && byesLeft > 0; i += 2) {
            byePositions.add(i);
            byesLeft--;
        }

        const matchDocs: Partial<IMatch>[] = [];
        let globalMatchNumber = 1;
        let teamIdx = 0;

        // Round 1
        for (let pos = 0; pos < matchSlotsInR1; pos++) {
            const doc: Partial<IMatch> = {
                tournamentId: tournamentId as any,
                categoryId: categoryId as any,
                sportType,
                competitorType: 'team',
                bracketRound: roundNames[0],
                matchNumber: globalMatchNumber++,
                roundNumber: 1,
                positionInRound: pos,
                matchConfig,
                status: IMatchStatus.SCHEDULED,
            };

            if (byePositions.has(pos)) {
                const t = shuffled[teamIdx++];
                doc.teams = {
                    team1Id: t._id as any,
                    team2Id: TBD_ID as any,
                    team1Name: t.name,
                    team2Name: 'BYE',
                };
                doc.status = IMatchStatus.WALKOVER;
                doc.winnerId = t._id as any;
                doc.winReason = 'bye';
            } else {
                const t1 = shuffled[teamIdx++];
                const t2 = shuffled[teamIdx++];
                doc.teams = {
                    team1Id: t1._id as any,
                    team2Id: t2._id as any,
                    team1Name: t1.name,
                    team2Name: t2.name,
                };
            }

            matchDocs.push(doc);
        }

        // Later rounds — TBD placeholders
        for (let round = 1; round < totalRounds; round++) {
            const matchesInRound = bracketSize / Math.pow(2, round + 1);
            for (let pos = 0; pos < matchesInRound; pos++) {
                matchDocs.push({
                    tournamentId: tournamentId as any,
                    categoryId: categoryId as any,
                    sportType,
                    competitorType: 'team',
                    bracketRound: roundNames[round],
                    matchNumber: globalMatchNumber++,
                    roundNumber: round + 1,
                    positionInRound: pos,
                    matchConfig,
                    status: IMatchStatus.SCHEDULED,
                    teams: {
                        team1Id: TBD_ID as any,
                        team2Id: TBD_ID as any,
                        team1Name: 'TBD',
                        team2Name: 'TBD',
                    },
                });
            }
        }

        const created = await matchRepository.bulkCreate(matchDocs);

        // Link matches
        const matchGrid: IMatch[][] = [];
        for (let r = 0; r < totalRounds; r++) matchGrid.push([]);
        for (const m of created) {
            const rn = (m as any).roundNumber as number;
            const pos = (m as any).positionInRound as number;
            if (rn && pos !== undefined) {
                if (!matchGrid[rn - 1]) matchGrid[rn - 1] = [];
                matchGrid[rn - 1][pos] = m;
            }
        }

        const sourceMap: Record<string, string[]> = {};

        for (let r = 0; r < totalRounds - 1; r++) {
            const currentRound = matchGrid[r];
            const nextRound = matchGrid[r + 1];
            if (!currentRound || !nextRound) continue;

            for (let pos = 0; pos < currentRound.length; pos++) {
                const match = currentRound[pos];
                if (!match) continue;

                const nextPos = Math.floor(pos / 2);
                const nextMatch = nextRound[nextPos];
                if (!nextMatch) continue;

                const slot: 'team1' | 'team2' = (pos % 2 === 0) ? 'team1' : 'team2';

                await matchRepository.update(match._id.toString(), {
                    nextMatchId: nextMatch._id as any,
                    nextMatchSlot: slot,
                } as any);

                const nextId = nextMatch._id.toString();
                if (!sourceMap[nextId]) sourceMap[nextId] = [];
                sourceMap[nextId].push(match._id.toString());
            }
        }

        for (const [targetId, sources] of Object.entries(sourceMap)) {
            await matchRepository.update(targetId, {
                sourceMatchIds: sources as any,
            } as any);
        }

        // Auto-advance byes
        const round1 = matchGrid[0] || [];
        for (const match of round1) {
            if (match && match.status === IMatchStatus.WALKOVER && match.winnerId) {
                await this._autoAdvanceWinner(match._id.toString());
            }
        }

        return matchRepository.getByCategory(categoryId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LEAGUE GENERATION (unchanged — round-robin, no tree needed)
    // ═══════════════════════════════════════════════════════════════════════════

    private async _generateLeaguePlayer(
        players: PlayerCompetitor[],
        categoryId: string,
        tournamentId: string,
        sportType: string,
        matchConfig: { bestOf: number; pointsToWin: number },
        competitorType: 'player' | 'team'
    ): Promise<IMatch[]> {
        const matches: Partial<IMatch>[] = [];
        let mc = 1;
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                matches.push({
                    tournamentId: tournamentId as any,
                    categoryId: categoryId as any,
                    sportType,
                    competitorType,
                    bracketRound: 'League',
                    matchNumber: mc++,
                    roundNumber: 1,
                    positionInRound: mc - 2,
                    player1: { registrationId: players[i].registrationId, name: players[i].name, teamId: players[i].teamId, teamName: players[i].teamName },
                    player2: { registrationId: players[j].registrationId, name: players[j].name, teamId: players[j].teamId, teamName: players[j].teamName },
                    matchConfig,
                    status: IMatchStatus.SCHEDULED,
                });
            }
        }
        return matchRepository.bulkCreate(matches);
    }

    private async _generateLeagueTeam(
        teams: TeamCompetitor[],
        categoryId: string,
        tournamentId: string,
        sportType: string,
        matchConfig: { bestOf: number; pointsToWin: number },
        competitorType: 'player' | 'team'
    ): Promise<IMatch[]> {
        const matches: Partial<IMatch>[] = [];
        let mc = 1;
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                matches.push({
                    tournamentId: tournamentId as any,
                    categoryId: categoryId as any,
                    sportType,
                    competitorType,
                    bracketRound: 'League',
                    matchNumber: mc++,
                    roundNumber: 1,
                    positionInRound: mc - 2,
                    teams: {
                        team1Id: teams[i]._id as any,
                        team2Id: teams[j]._id as any,
                        team1Name: teams[i].name,
                        team2Name: teams[j].name,
                    },
                    matchConfig,
                    status: IMatchStatus.SCHEDULED,
                });
            }
        }
        return matchRepository.bulkCreate(matches);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ROUND NAMES
    // ═══════════════════════════════════════════════════════════════════════════

    private _getRoundNames(totalRounds: number): string[] {
        const names: string[] = [];
        for (let i = 0; i < totalRounds; i++) {
            const remaining = totalRounds - i;
            if (remaining === 1) names.push('Final');
            else if (remaining === 2) names.push('Semi-Final');
            else if (remaining === 3) names.push('Quarter-Final');
            else {
                const matchesInRound = Math.pow(2, totalRounds - i);
                names.push(`Round of ${matchesInRound}`);
            }
        }
        return names;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MATCH QUERIES
    // ═══════════════════════════════════════════════════════════════════════════

    async getMatchesByCategory(categoryId: string) {
        const matches = await matchRepository.getByCategory(categoryId);

        // Sort matches by roundNumber then positionInRound
        matches.sort((a: any, b: any) => {
            if ((a.roundNumber || 0) !== (b.roundNumber || 0)) return (a.roundNumber || 0) - (b.roundNumber || 0);
            return (a.positionInRound || 0) - (b.positionInRound || 0);
        });

        // Group by bracketRound, preserving sort order
        const grouped: Record<string, IMatch[]> = {};
        for (const m of matches) {
            if (!grouped[m.bracketRound]) grouped[m.bracketRound] = [];
            grouped[m.bracketRound].push(m);
        }

        const competitorType = matches.length > 0 ? (matches[0] as any).competitorType || 'team' : 'team';

        return new SuccessResponse('Matches fetched.', {
            matches,
            rounds: grouped,
            totalMatches: matches.length,
            competitorType,
        });
    }

    async getMatchById(matchId: string) {
        const match = await matchRepository.getById(matchId);
        if (!match) throw new NotFoundError('Match not found.');
        return new SuccessResponse('Match fetched.', match);
    }

    async getMatchesByTournament(tournamentId: string) {
        const matches = await matchRepository.getByTournament(tournamentId);
        return new SuccessResponse('Matches fetched.', matches);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECORD RESULT + AUTO-ADVANCE
    // ═══════════════════════════════════════════════════════════════════════════

    async recordResult(matchId: string, data: {
        winnerId: string;
        gameScores?: any[];
        setScores?: any[];
        periodScores?: any[];
        inningsScores?: any[];
        result?: {
            team1Summary?: string;
            team2Summary?: string;
            team1Total?: number;
            team2Total?: number;
            marginOfVictory?: string;
        };
        winReason?: string;
    }, userId: string) {
        const match = await matchRepository.getById(matchId);
        if (!match) throw new NotFoundError('Match not found.');

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(match.tournamentId.toString(), userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        if (match.status === IMatchStatus.COMPLETED) {
            throw new BadRequestError('Match result already recorded.');
        }

        const competitorType = (match as any).competitorType || 'team';

        // Validate winnerId
        if (competitorType === 'player') {
            const p1Id = match.player1?.registrationId;
            const p2Id = match.player2?.registrationId;
            if (data.winnerId !== p1Id && data.winnerId !== p2Id) {
                throw new BadRequestError('Winner must be one of the two players.');
            }
        } else {
            const t1 = match.teams?.team1Id?.toString();
            const t2 = match.teams?.team2Id?.toString();
            if (data.winnerId !== t1 && data.winnerId !== t2) {
                throw new BadRequestError('Winner must be one of the two teams.');
            }
        }

        const updateData: Partial<IMatch> = {
            winnerId: data.winnerId as any,
            winReason: data.winReason || 'by_score',
            status: IMatchStatus.COMPLETED,
            recordedBy: userId as any,
            lockedAt: new Date(),
        };

        if (data.gameScores) updateData.gameScores = data.gameScores;
        if (data.setScores) updateData.setScores = data.setScores;
        if (data.periodScores) updateData.periodScores = data.periodScores;
        if (data.inningsScores) updateData.inningsScores = data.inningsScores;
        if (data.result) updateData.result = data.result;

        await matchRepository.update(matchId, updateData);

        // Auto-advance winner using nextMatchId/nextMatchSlot
        await this._autoAdvanceWinner(matchId);

        const updated = await matchRepository.getById(matchId);

        // Update player stats
        try {
            if (updated) {
                if (competitorType === 'player') {
                    const p1Id = updated.player1?.registrationId;
                    const p2Id = updated.player2?.registrationId;
                    
                    if (p1Id && p1Id !== 'TBD') {
                        await tournamentRegistrationRepository.updateStats(p1Id, {
                            matchesPlayed: 1,
                            matchesWon: data.winnerId === p1Id ? 1 : 0,
                            pointsContributed: data.winnerId === p1Id ? 10 : 0
                        });
                    }
                    if (p2Id && p2Id !== 'TBD') {
                        await tournamentRegistrationRepository.updateStats(p2Id, {
                            matchesPlayed: 1,
                            matchesWon: data.winnerId === p2Id ? 1 : 0,
                            pointsContributed: data.winnerId === p2Id ? 10 : 0
                        });
                    }
                } else if (competitorType === 'team') {
                    const t1Id = updated.teams?.team1Id?.toString();
                    const t2Id = updated.teams?.team2Id?.toString();
                    
                    if (t1Id && t1Id !== '000000000000000000000000') {
                        const t1Players = await tournamentRegistrationRepository.getByTeam(t1Id);
                        for (const p of t1Players) {
                            await tournamentRegistrationRepository.updateStats(p._id.toString(), {
                                matchesPlayed: 1,
                                matchesWon: data.winnerId === t1Id ? 1 : 0,
                                pointsContributed: data.winnerId === t1Id ? 10 : 0
                            });
                        }
                    }
                    if (t2Id && t2Id !== '000000000000000000000000') {
                        const t2Players = await tournamentRegistrationRepository.getByTeam(t2Id);
                        for (const p of t2Players) {
                            await tournamentRegistrationRepository.updateStats(p._id.toString(), {
                                matchesPlayed: 1,
                                matchesWon: data.winnerId === t2Id ? 1 : 0,
                                pointsContributed: data.winnerId === t2Id ? 10 : 0
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error updating player stats for match:', err);
        }

        // Auto-complete category if this was the Final match
        try {
            if (updated && (updated.bracketRound === 'Final' || !updated.nextMatchId)) {
                const { categoryService } = require('./category.service');
                await categoryService.completeCategory(match.categoryId.toString(), userId);
            }
        } catch (err) {
            console.error('Error auto-completing category:', err);
        }

        return new SuccessResponse('Match result recorded.', updated);
    }

    // ─── Auto-advance via nextMatchId/nextMatchSlot ─────────────────────────

    private async _autoAdvanceWinner(matchId: string) {
        const match = await matchRepository.getById(matchId);
        if (!match || !match.winnerId) return;

        const nextMatchId = (match as any).nextMatchId;
        const nextMatchSlot = (match as any).nextMatchSlot;
        if (!nextMatchId || !nextMatchSlot) return; // Final match — no next

        const competitorType = (match as any).competitorType || 'team';
        const winnerId = match.winnerId.toString();

        if (competitorType === 'player') {
            // Find winner's player data
            const winnerData = match.player1?.registrationId === winnerId
                ? match.player1
                : match.player2?.registrationId === winnerId
                    ? match.player2
                    : null;

            if (!winnerData) return;

            const update: any = {};
            if (nextMatchSlot === 'player1') {
                update.player1 = {
                    registrationId: winnerData.registrationId,
                    name: winnerData.name,
                    teamId: winnerData.teamId,
                    teamName: winnerData.teamName,
                };
            } else if (nextMatchSlot === 'player2') {
                update.player2 = {
                    registrationId: winnerData.registrationId,
                    name: winnerData.name,
                    teamId: winnerData.teamId,
                    teamName: winnerData.teamName,
                };
            }

            await matchRepository.update(nextMatchId.toString(), update);
        } else {
            // Team mode
            const nextMatch = await matchRepository.getById(nextMatchId.toString());
            if (!nextMatch) return;

            const winnerTeam = await teamRepository.getById(winnerId);
            if (!winnerTeam) return;

            const teams = { ...nextMatch.teams };
            if (nextMatchSlot === 'team1') {
                teams.team1Id = winnerId as any;
                teams.team1Name = winnerTeam.name;
            } else if (nextMatchSlot === 'team2') {
                teams.team2Id = winnerId as any;
                teams.team2Name = winnerTeam.name;
            }

            await matchRepository.update(nextMatchId.toString(), { teams } as any);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCHEDULE UPDATE
    // ═══════════════════════════════════════════════════════════════════════════

    async updateSchedule(matchId: string, schedule: {
        date?: string;
        time?: string;
        court?: string;
        venue?: string;
    }, userId: string) {
        const match = await matchRepository.getById(matchId);
        if (!match) throw new NotFoundError('Match not found.');

        const isAuthorized = await tournamentRepository.isOrganizerOrStaff(match.tournamentId.toString(), userId);
        if (!isAuthorized) throw new ForbiddenError('Not authorized.');

        const updated = await matchRepository.update(matchId, {
            schedule: {
                date: schedule.date ? new Date(schedule.date) : undefined,
                time: schedule.time,
                court: schedule.court,
                venue: schedule.venue,
            },
        });

        return new SuccessResponse('Match schedule updated.', updated);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SWAP COMPETITORS
    // ═══════════════════════════════════════════════════════════════════════════

    async swapCompetitors(
        matchId1: string, slot1: 'player1' | 'player2',
        matchId2: string, slot2: 'player1' | 'player2',
        userId: string
    ) {
        const match1 = await matchRepository.getById(matchId1);
        const match2 = await matchRepository.getById(matchId2);
        if (!match1 || !match2) throw new NotFoundError('One or both matches not found.');

        // Authorization
        const isAuth = await tournamentRepository.isOrganizerOrStaff(match1.tournamentId.toString(), userId);
        if (!isAuth) throw new ForbiddenError('Not authorized.');

        // Must be same category
        if (match1.categoryId.toString() !== match2.categoryId.toString()) {
            throw new BadRequestError('Cannot swap between different categories.');
        }

        // Only Round 1 matches can be swapped
        if ((match1 as any).roundNumber !== 1 || (match2 as any).roundNumber !== 1) {
            throw new BadRequestError('Can only swap competitors in Round 1.');
        }

        // Neither match can have results
        if (match1.status === IMatchStatus.COMPLETED || match2.status === IMatchStatus.COMPLETED) {
            throw new BadRequestError('Cannot swap — one or both matches have results.');
        }

        const competitorType = (match1 as any).competitorType || 'team';

        if (competitorType === 'player') {
            // Swap player data
            const data1 = match1[slot1] as any;
            const data2 = match2[slot2] as any;

            await matchRepository.update(matchId1, { [slot1]: data2 } as any);
            await matchRepository.update(matchId2, { [slot2]: data1 } as any);

            // If either match is a bye (walkover), recalculate status
            await this._recalcByeStatus(matchId1);
            await this._recalcByeStatus(matchId2);
        } else {
            // Team mode swap
            const field1Id = slot1 === 'player1' ? 'teams.team1Id' : 'teams.team2Id';
            const field1Name = slot1 === 'player1' ? 'teams.team1Name' : 'teams.team2Name';
            const field2Id = slot2 === 'player1' ? 'teams.team1Id' : 'teams.team2Id';
            const field2Name = slot2 === 'player1' ? 'teams.team1Name' : 'teams.team2Name';

            const t1Id = slot1 === 'player1' ? match1.teams?.team1Id : match1.teams?.team2Id;
            const t1Name = slot1 === 'player1' ? match1.teams?.team1Name : match1.teams?.team2Name;
            const t2Id = slot2 === 'player1' ? match2.teams?.team1Id : match2.teams?.team2Id;
            const t2Name = slot2 === 'player1' ? match2.teams?.team1Name : match2.teams?.team2Name;

            await matchRepository.update(matchId1, { [field1Id]: t2Id, [field1Name]: t2Name } as any);
            await matchRepository.update(matchId2, { [field2Id]: t1Id, [field2Name]: t1Name } as any);

            await this._recalcByeStatus(matchId1);
            await this._recalcByeStatus(matchId2);
        }

        return new SuccessResponse('Competitors swapped.');
    }

    // After a swap, recalculate if a match is now a bye or no longer a bye
    private async _recalcByeStatus(matchId: string) {
        const m = await matchRepository.getById(matchId);
        if (!m || (m as any).roundNumber !== 1) return;

        const cType = (m as any).competitorType || 'team';
        const TBD = 'TBD';

        if (cType === 'player') {
            const p1Real = m.player1 && m.player1.registrationId !== TBD;
            const p2Real = m.player2 && m.player2.registrationId !== TBD;

            if (p1Real && p2Real) {
                // Both real players — normal match
                if (m.status === IMatchStatus.WALKOVER) {
                    await matchRepository.update(matchId, {
                        status: IMatchStatus.SCHEDULED,
                        winnerId: undefined as any,
                        winReason: undefined as any,
                    });
                    // Clear the bye-advanced winner from next match
                    await this._clearAdvancedWinner(matchId);
                }
            } else if (p1Real && !p2Real) {
                // Bye for player1
                await matchRepository.update(matchId, {
                    status: IMatchStatus.WALKOVER,
                    winnerId: m.player1!.registrationId as any,
                    winReason: 'bye',
                });
                await this._autoAdvanceWinner(matchId);
            } else if (!p1Real && p2Real) {
                // Bye for player2
                await matchRepository.update(matchId, {
                    status: IMatchStatus.WALKOVER,
                    winnerId: m.player2!.registrationId as any,
                    winReason: 'bye',
                });
                await this._autoAdvanceWinner(matchId);
            }
        }
    }

    // Clear a previously auto-advanced winner from the next match
    private async _clearAdvancedWinner(matchId: string) {
        const m = await matchRepository.getById(matchId);
        if (!m) return;

        const nextId = (m as any).nextMatchId?.toString();
        const nextSlot = (m as any).nextMatchSlot as string;
        if (!nextId || !nextSlot) return;

        const cType = (m as any).competitorType || 'team';
        if (cType === 'player') {
            await matchRepository.update(nextId, {
                [nextSlot]: { registrationId: 'TBD', name: 'TBD', teamId: '', teamName: '' },
            } as any);
        } else {
            const TBD_ID = '000000000000000000000000';
            const idField = nextSlot === 'player1' ? 'teams.team1Id' : 'teams.team2Id';
            const nameField = nextSlot === 'player1' ? 'teams.team1Name' : 'teams.team2Name';
            await matchRepository.update(nextId, {
                [idField]: TBD_ID,
                [nameField]: 'TBD',
            } as any);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESHUFFLE BRACKET
    // ═══════════════════════════════════════════════════════════════════════════

    async reshuffleBracket(categoryId: string, userId: string) {
        const category = await categoryRepository.getById(categoryId);
        if (!category) throw new NotFoundError('Category not found.');

        const isAuth = await tournamentRepository.isOrganizerOrStaff(category.tournamentId.toString(), userId);
        if (!isAuth) throw new ForbiddenError('Not authorized.');

        // Fetch all matches for this category
        const allMatches = await matchRepository.getByCategory(categoryId);
        if (allMatches.length === 0) throw new BadRequestError('No bracket to reshuffle.');

        // Check no completed matches exist
        const hasResults = allMatches.some(m => m.status === IMatchStatus.COMPLETED);
        if (hasResults) throw new BadRequestError('Cannot reshuffle after results have been recorded.');

        const competitorType = (allMatches[0] as any).competitorType || 'team';

        // Get Round 1 matches, separate byes from real matches
        const r1Matches = allMatches
            .filter(m => (m as any).roundNumber === 1)
            .sort((a, b) => ((a as any).positionInRound || 0) - ((b as any).positionInRound || 0));

        if (competitorType === 'player') {
            // Collect all real players from Round 1
            const players: any[] = [];
            for (const m of r1Matches) {
                if (m.player1 && m.player1.registrationId !== 'TBD') players.push({ ...m.player1 });
                if (m.player2 && m.player2.registrationId !== 'TBD') players.push({ ...m.player2 });
            }

            // Shuffle
            for (let i = players.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [players[i], players[j]] = [players[j], players[i]];
            }

            // Figure out which positions are byes (same pattern as generation)
            const matchSlotsInR1 = r1Matches.length;
            const numByes = matchSlotsInR1 * 2 - players.length;
            const byePositions = new Set<number>();
            let byesLeft = numByes;
            for (let i = 0; i < matchSlotsInR1 && byesLeft > 0; i += 2) {
                byePositions.add(i);
                byesLeft--;
            }
            for (let i = 1; i < matchSlotsInR1 && byesLeft > 0; i += 2) {
                byePositions.add(i);
                byesLeft--;
            }

            // Reassign players
            let pi = 0;
            for (let pos = 0; pos < matchSlotsInR1; pos++) {
                const match = r1Matches[pos];
                if (!match) continue;

                if (byePositions.has(pos)) {
                    const p = players[pi++];
                    await matchRepository.update(match._id.toString(), {
                        player1: { registrationId: p.registrationId, name: p.name, teamId: p.teamId, teamName: p.teamName },
                        player2: { registrationId: 'TBD', name: 'TBD', teamId: '', teamName: '' },
                        status: IMatchStatus.WALKOVER,
                        winnerId: p.registrationId as any,
                        winReason: 'bye',
                    } as any);
                } else {
                    const p1 = players[pi++];
                    const p2 = players[pi++];
                    await matchRepository.update(match._id.toString(), {
                        player1: { registrationId: p1.registrationId, name: p1.name, teamId: p1.teamId, teamName: p1.teamName },
                        player2: { registrationId: p2.registrationId, name: p2.name, teamId: p2.teamId, teamName: p2.teamName },
                        status: IMatchStatus.SCHEDULED,
                        winnerId: undefined as any,
                        winReason: undefined as any,
                    } as any);
                }
            }

            // Reset all later-round matches to TBD
            const laterMatches = allMatches.filter(m => (m as any).roundNumber > 1);
            for (const m of laterMatches) {
                await matchRepository.update(m._id.toString(), {
                    player1: { registrationId: 'TBD', name: 'TBD', teamId: '', teamName: '' },
                    player2: { registrationId: 'TBD', name: 'TBD', teamId: '', teamName: '' },
                    status: IMatchStatus.SCHEDULED,
                    winnerId: undefined as any,
                    winReason: undefined as any,
                } as any);
            }

            // Re-auto-advance byes
            for (const m of r1Matches) {
                const refreshed = await matchRepository.getById(m._id.toString());
                if (refreshed && refreshed.status === IMatchStatus.WALKOVER && refreshed.winnerId) {
                    await this._autoAdvanceWinner(m._id.toString());
                }
            }
        }

        return new SuccessResponse('Bracket reshuffled.');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LEADERBOARD
    // ═══════════════════════════════════════════════════════════════════════════

    async getLeaderboard(categoryId: string) {
        const category = await categoryRepository.getById(categoryId);
        if (!category) throw new NotFoundError('Category not found.');

        const tournament = await tournamentRepository.getById((category as any).tournamentId.toString());
        if (!tournament) throw new NotFoundError('Tournament not found.');

        const sportType = (tournament as any).sport || 'badminton';
        const leaderboard = await matchRepository.getLeaderboardByCategory(categoryId, sportType);

        return new SuccessResponse('Leaderboard fetched.', {
            leaderboard,
            sportType,
            categoryId,
            categoryName: (category as any).name,
        });
    }
}

export const matchService = new MatchService();
