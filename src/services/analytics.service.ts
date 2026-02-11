import { ImpressionsRepository } from '../repository/impressions.repository';
import { gameImpressionCacheManager } from './cache/entities';


class AnalyticsService {
  constructor(private readonly _impressionRepository: ImpressionsRepository,) { }

  async recordImpression(params: { gameId: string, country: string, ip: string }) {
    const { country, gameId, ip } = params;

    const cached = await gameImpressionCacheManager.get({ country, gameId, ip });
    if (!cached) {
      await this._impressionRepository.create(gameId, country);
      gameImpressionCacheManager.set({ country, gameId, ip }, true);
    }

    return true;
  }

  // async gameImpressions(gameId: string, fromDate: string, toDate: string) {
  //   const impressions = await this._impressionRepository.get(gameId, fromDate, toDate);

  //   return impressions;
  // }
  async quizGameImpressionsAndSubmissions(gameId: string, fromDate: string, toDate: string) {
    const impressions = await this._impressionRepository.getQuizGameImpressionsAndSubmissions(gameId, fromDate, toDate);

    return impressions;
  }

  async spinTheWheelGameImpressionsAndSubmissions(gameId: string, fromDate: string, toDate: string) {
    const impressions = await this._impressionRepository.getSpinTheWheelGameImpressionsAndSubmissions(gameId, fromDate, toDate);

    return impressions;
  }

  async getTotalImpressionsAndSubmissions(gameId: string) {
    const impressions = await this._impressionRepository.getTotalImpressions(gameId);
    const spinthewheelSubmissionsCount = await this._impressionRepository.getSpinTheWheelTotalSubmissions(gameId);
    const quizSubmissionsCount = await this._impressionRepository.getQuizTotalSubmissions(gameId);

    return { impressions, submissions: spinthewheelSubmissionsCount + quizSubmissionsCount };
  }

  async getCountryBasedImpressionsCounts(gameId: string) {
    const impressions = await this._impressionRepository.getCountryBasedImpressionsCounts(gameId);

    return impressions;
  }

}


export default new AnalyticsService(new ImpressionsRepository());