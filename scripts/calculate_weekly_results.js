require('../helpers/script_helpers');

const logger = require('../helpers/logging');
const _ = require('lodash');
const moment = require('moment');

const oddsHelpers = require('../helpers/odds_api_helpers');
const fileHelpers = require('../helpers/file_helpers');

const TESTING = false;

const main = async () => {
  validateApiKey();
  const weekDates = await promptForDate();

  logger.section('Fetching NFL game odds...');
  const gameOdds = TESTING
    ? { data: fileHelpers.getH2HGameOdds(), quotaInfo: 'Testing' }
    : await oddsHelpers.fetchNFLGameOdds(weekDates.startDate, weekDates.endDate);
  if (!gameOdds?.data?.length) {
    logger.error(`No game odds could be found for the NFL between ${weekDates.startDateFormatted} and ${weekDates.endDateFormatted}`);
    process.exit();
  }

  logger.section('Calculating weekly results...');
  const gameData = gameOdds.data.map(calculateGamePercentages);
  const rankedGameData = _.orderBy(gameData, ['difference'], ['desc']);

  logger.section('Ranked Games');
  for (const game of rankedGameData) {
    const { home_team, away_team, difference, raw_data } = game;
    const { commence_time } = raw_data;
    const { home_team_percentage, away_team_percentage } = game;

    const teamFavored = home_team_percentage > away_team_percentage ? home_team : away_team;

    let message;
    if (game.difference > 10)
      message = `The ${teamFavored} are favored to win by ${difference}% (${home_team_percentage}% vs ${away_team_percentage}%)`;
    else message = 'This game does not have a significant enough difference to make a prediction';

    logger.info(`${home_team} (Home) vs ${away_team} (Away) - ${moment(commence_time).format('dddd, MMMM Do')} || ${message}`);
    game.message = message;
  }

  // make a recording of the results in a file
  fileHelpers.saveFile('weekly_results', rankedGameData);

  logger.section('Quota Info');
  console.table(gameOdds.quotaInfo);
  process.exit();
};

const promptForDate = async () => {
  const prompt = 'What is a date of one of the games the during the week you want stats for? (leave blank for this week): ';
  const date = await logger.askQuestion(prompt);
  const validationDate = date ? date : moment().format('YYYY-MM-DD');

  if (!moment(validationDate).isValid()) {
    logger.error('You suck at dates. Try again.');
    process.exit();
  }

  const weekDates = getFormattedWeekDates(validationDate);
  console.table(weekDates);
  await logger.requestConfirmation();

  return weekDates;
};

const calculateGamePercentages = (game) => {
  const { home_team, away_team, bookmakers } = game;

  let [homeTeamPercentages, awayTeamPercentages] = [[], []];
  for (const bookmaker of bookmakers) {
    const { title, markets } = bookmaker;
    const market = markets[0];

    const [odds1, odds2] = market.outcomes;
    const homeTeamPercentage = odds1.name === home_team ? calculateIndividualPercentage(odds1.price) : calculateIndividualPercentage(odds2.price);
    const awayTeamPercentage = odds1.name === away_team ? calculateIndividualPercentage(odds1.price) : calculateIndividualPercentage(odds2.price);

    homeTeamPercentages.push(homeTeamPercentage);
    awayTeamPercentages.push(awayTeamPercentage);
    logger.info(`${title} - ${home_team}: ${homeTeamPercentage.toFixed(2)}% - ${away_team}: ${awayTeamPercentage.toFixed(2)}%`);
  }

  const averageHomeTeamPercentage = _.mean(homeTeamPercentages).toFixed(2);
  const averageAwayTeamPercentage = _.mean(awayTeamPercentages).toFixed(2);

  return {
    home_team,
    away_team,
    home_team_percentage: averageHomeTeamPercentage,
    away_team_percentage: averageAwayTeamPercentage,
    difference: Math.abs(Math.floor(averageHomeTeamPercentage - averageAwayTeamPercentage)),
    raw_data: game,
  };
};

/**
 * The way H2H odds are calculated is by taking 1 / (decimal odds) for each team.
 * This gives us a percentage change of each team winning.
 */
const calculateIndividualPercentage = (decimalOdds) => (1 / decimalOdds) * 100;

/**
 * The NFL every week has games scheduled from Thursday to Monday. Therefore
 * we need to calculate the dates of the week to ensire we are only looking at
 * the games for that week.
 */
const getFormattedWeekDates = (date) => {
  const dateProvided = date ? moment(date) : moment();
  const randomThursday = dateProvided.startOf('isoWeek').add(3, 'days').startOf('day');
  const wednesdayAfterRandomThursday = randomThursday.clone().add(6, 'days').endOf('day');

  // ISO 8601 format
  const startDate = `${randomThursday.format('YYYY-MM-DD')}T00:00:00Z`;
  const endDate = `${wednesdayAfterRandomThursday.format('YYYY-MM-DD')}T00:00:00Z`;

  // Human Readable format
  const startDateFormatted = randomThursday.format('dddd, MMMM Do');
  const endDateFormatted = wednesdayAfterRandomThursday.format('dddd, MMMM Do');

  return { startDate, endDate, startDateFormatted, endDateFormatted };
};

const validateApiKey = () => {
  if (!process.env.NFL_ODDS_API_KEY) {
    logger.error('No NFL_ODDS_API_KEY found in your environment variables');
    logger.info('Please add the API key to your environment or get a new one from https://the-odds-api.com');
    process.exit();
  }
};

module.exports = main();
