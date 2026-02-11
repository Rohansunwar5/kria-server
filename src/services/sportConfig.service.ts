import { sportConfigRepository } from '../repository/sportConfig.repository';
import { ISportConfig, ISportType, IScoringType, IMatchDurationType } from '../models/sportConfig.model';
import { BadRequestError, NotFoundError } from '../errors';
import { SuccessResponse } from '../utils/response.util';

class SportConfigService {
    async getAll() {
        const configs = await sportConfigRepository.getAll();
        return new SuccessResponse('Sport configs fetched successfully.', configs);
    }

    async getBySport(sport: string) {
        const config = await sportConfigRepository.getBySport(sport);
        if (!config) {
            throw new NotFoundError(`Configuration for sport '${sport}' not found.`);
        }
        return new SuccessResponse('Sport config fetched successfully.', config);
    }

    async create(data: Partial<ISportConfig>) {
        const exists = await sportConfigRepository.exists(data.sport!);
        if (exists) {
            throw new BadRequestError(`Configuration for sport '${data.sport}' already exists.`);
        }

        const config = await sportConfigRepository.create(data);
        return new SuccessResponse('Sport config created successfully.', config);
    }

    async update(id: string, data: Partial<ISportConfig>) {
        const config = await sportConfigRepository.getById(id);
        if (!config) {
            throw new NotFoundError('Sport config not found.');
        }

        const updated = await sportConfigRepository.update(id, data);
        return new SuccessResponse('Sport config updated successfully.', updated);
    }

    async delete(id: string) {
        const config = await sportConfigRepository.getById(id);
        if (!config) {
            throw new NotFoundError('Sport config not found.');
        }

        await sportConfigRepository.delete(id);
        return new SuccessResponse('Sport config deleted successfully.');
    }

    // Seed default configurations
    async seedDefaults() {
        const defaults: Partial<ISportConfig>[] = [
            {
                sport: ISportType.BADMINTON,
                displayName: 'Badminton',
                scoringType: IScoringType.POINTS,
                matchDurationType: IMatchDurationType.POINTS_BASED,
                teamConfig: {
                    minPlayersPerTeam: 1,
                    maxPlayersPerTeam: 2,
                    playersOnField: 2,
                    allowSubstitutes: false,
                },
                matchFormats: [
                    { name: 'Singles', playersPerSide: 1, description: 'One player per side' },
                    { name: 'Doubles', playersPerSide: 2, description: 'Two players per side' },
                ],
                scoringConfig: {
                    pointsToWin: 21,
                    minPointsDifference: 2,
                    maxPoints: 30,
                    allowTieBreaker: true,
                    tieBreakerRules: 'First to 30 wins, or 2 point lead after 20',
                },
                bestOfOptions: [1, 3, 5],
                scoreLabels: {
                    primary: 'Points',
                    secondary: 'Games',
                },
                defaults: {
                    bestOf: 3,
                    pointsToWin: 21,
                    tieBreakerPoints: 30,
                },
                isActive: true,
            },
            {
                sport: ISportType.TABLE_TENNIS,
                displayName: 'Table Tennis',
                scoringType: IScoringType.POINTS,
                matchDurationType: IMatchDurationType.POINTS_BASED,
                teamConfig: {
                    minPlayersPerTeam: 1,
                    maxPlayersPerTeam: 2,
                    playersOnField: 2,
                    allowSubstitutes: false,
                },
                matchFormats: [
                    { name: 'Singles', playersPerSide: 1 },
                    { name: 'Doubles', playersPerSide: 2 },
                ],
                scoringConfig: {
                    pointsToWin: 11,
                    minPointsDifference: 2,
                    maxPoints: 15,
                    allowTieBreaker: true,
                },
                bestOfOptions: [1, 3, 5, 7],
                scoreLabels: {
                    primary: 'Points',
                    secondary: 'Games',
                },
                defaults: {
                    bestOf: 5,
                    pointsToWin: 11,
                },
                isActive: true,
            },
            {
                sport: ISportType.CRICKET,
                displayName: 'Cricket',
                scoringType: IScoringType.RUNS_WICKETS,
                matchDurationType: IMatchDurationType.OVERS_BASED,
                teamConfig: {
                    minPlayersPerTeam: 6,
                    maxPlayersPerTeam: 15,
                    playersOnField: 11,
                    allowSubstitutes: true,
                },
                matchFormats: [
                    { name: 'T20', playersPerSide: 11, description: '20 overs per side' },
                    { name: 'T10', playersPerSide: 11, description: '10 overs per side' },
                    { name: '6-a-side', playersPerSide: 6, description: '6 overs per side' },
                ],
                scoringConfig: {
                    defaultOvers: 20,
                    allowTieBreaker: true,
                    tieBreakerRules: 'Super Over',
                },
                bestOfOptions: [1],
                scoreLabels: {
                    primary: 'Runs',
                    secondary: 'Wickets',
                    tertiary: 'Overs',
                },
                defaults: {},
                isActive: false, // Coming soon
            },
            {
                sport: ISportType.FOOTBALL,
                displayName: 'Football',
                scoringType: IScoringType.GOALS,
                matchDurationType: IMatchDurationType.TIME_BASED,
                teamConfig: {
                    minPlayersPerTeam: 5,
                    maxPlayersPerTeam: 18,
                    playersOnField: 11,
                    allowSubstitutes: true,
                },
                matchFormats: [
                    { name: '11-a-side', playersPerSide: 11 },
                    { name: '7-a-side', playersPerSide: 7 },
                    { name: '5-a-side', playersPerSide: 5 },
                ],
                scoringConfig: {
                    periodDurationMinutes: 45,
                    numberOfPeriods: 2,
                    allowTieBreaker: true,
                    tieBreakerRules: 'Extra time + Penalties',
                },
                bestOfOptions: [1],
                scoreLabels: {
                    primary: 'Goals',
                },
                defaults: {},
                isActive: false, // Coming soon
            },
            {
                sport: ISportType.KABADDI,
                displayName: 'Kabaddi',
                scoringType: IScoringType.RAID_POINTS,
                matchDurationType: IMatchDurationType.TIME_BASED,
                teamConfig: {
                    minPlayersPerTeam: 7,
                    maxPlayersPerTeam: 12,
                    playersOnField: 7,
                    allowSubstitutes: true,
                },
                matchFormats: [
                    { name: 'Standard', playersPerSide: 7 },
                ],
                scoringConfig: {
                    periodDurationMinutes: 20,
                    numberOfPeriods: 2,
                    allowTieBreaker: true,
                },
                bestOfOptions: [1],
                scoreLabels: {
                    primary: 'Points',
                },
                defaults: {},
                isActive: false, // Coming soon
            },
        ];

        const results = [];
        for (const config of defaults) {
            const existing = await sportConfigRepository.getBySport(config.sport!);
            if (!existing) {
                const created = await sportConfigRepository.create(config);
                results.push({ sport: config.sport, status: 'created' });
            } else {
                results.push({ sport: config.sport, status: 'exists' });
            }
        }

        return new SuccessResponse('Sport configs seeded successfully.', results);
    }
}

export const sportConfigService = new SportConfigService();
