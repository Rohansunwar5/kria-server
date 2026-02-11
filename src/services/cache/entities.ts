import CacheManager from './manager';

interface IEncodedJWTCacheResponse {
  iv: string;
  encryptedData: string;
}

interface IEncodedJWTCacheManagerParams {
  userId: string;
}

interface IProfileCacheManagerParams {
  userId: string;
}

interface IOTPCacheManagerParams {
  userId: string;
}

interface IGameImpressionCacheManagerParams {
  ip: string;
  country: string;
  gameId: string;
}

interface IGameCacheParams {
  gameId: string;
}

const encodedJWTCacheManager = CacheManager<IEncodedJWTCacheManagerParams, IEncodedJWTCacheResponse>('encoded-JWT', 86400);
const playerJWTCacheManager = CacheManager<IEncodedJWTCacheManagerParams, IEncodedJWTCacheResponse>('player-JWT', 86400 * 7); // 7 days
const organizerJWTCacheManager = CacheManager<IEncodedJWTCacheManagerParams, IEncodedJWTCacheResponse>('organizer-JWT', 86400 * 7); // 7 days
const profileCacheManager = CacheManager<IProfileCacheManagerParams>('profile', 360);
const otpDeleteAccountCacheManager = CacheManager<IOTPCacheManagerParams, { code: string }>('otp-Delete-Account', 600);
const gameImpressionCacheManager = CacheManager<IGameImpressionCacheManagerParams>('game-impression', 120);
const gameCacheManager = CacheManager<IGameCacheParams>('game', 360);

export {
  encodedJWTCacheManager,
  playerJWTCacheManager,
  organizerJWTCacheManager,
  profileCacheManager,
  otpDeleteAccountCacheManager,
  gameImpressionCacheManager,
  gameCacheManager
};
