const axios = require('axios');
const logger = require('./logging');

const baseUrl = 'https://api.the-odds-api.com';
const NFL_ODDS_API_KEY = process.env.NFL_ODDS_API_KEY;
const NFL_KEY = 'americanfootball_nfl';
const TESTING = true;

/**
 * Fetches all sports from the Odds API
 * https://the-odds-api.com/liveapi/guides/v4/#get-sports
 *
 * endpoint: /v4/sports/?apiKey={apiKey}
 */
const fetchAllSports = async () => {
  const url = `${baseUrl}/v4/sports/?apiKey=${NFL_ODDS_API_KEY}`;

  try {
    const response = await axios.get(url);
    const quotaInfo = getQuotaInfo(response);

    logger.success(`Fetched all sports`);
    logger.info(`Number of sports: ${response.data.length}`);

    return { data: response.data, quotaInfo };
  } catch (e) {
    logger.error(`Error fetching all sports`);
    TESTING && console.info(e);
  }

  return { data: [], quotaInfo: { quotaRemaining: -1, quotaUsed: -1 } };
};

/**
 * Returns a list of upcoming and live games with recent odds for a given sport, region and market
 * https://the-odds-api.com/liveapi/guides/v4/#get-odds
 *
 * endpoint: GET /v4/sports/{sport}/odds/?apiKey={apiKey}&regions={regions}&markets={markets}
 */
const fetchNFLGameOdds = async (startDate, endDate) => {
  const url = `${baseUrl}/v4/sports/${NFL_KEY}/odds/?${new URLSearchParams({
    apiKey: NFL_ODDS_API_KEY,
    regions: 'us',
    markets: 'h2h',
    ...(startDate ? { commenceTimeFrom: startDate } : {}),
    ...(endDate ? { commenceTimeTo: endDate } : {}),
  }).toString()}`;

  try {
    const response = await axios.get(url);
    const quotaInfo = getQuotaInfo(response);

    logger.success(`Fetched NFL Game Odds`);
    logger.info(`Number of games: ${response.data.length}`);

    return { data: response.data, quotaInfo };
  } catch (e) {
    logger.error(`Error fetching NFL Game Odds`);
    TESTING && console.info(e);
  }

  return { data: [], quotaInfo: { quotaRemaining: -1, quotaUsed: -1 } };
};

const getQuotaInfo = (response) => {
  const quotaRemaining = response.headers['x-requests-remaining'];
  const quotaUsed = response.headers['x-requests-used'];

  return { quotaRemaining, quotaUsed };
};

module.exports = {
  fetchAllSports,
  fetchNFLGameOdds,
};
