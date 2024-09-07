const fs = require('fs');
const path = require('path');

const moment = require('moment');
const logger = require('../helpers/logging');

const saveFile = async (fileName, json) => {
  const currentTimestamp = moment().format('YYYY-MM-DD_HH-mm-ss');

  const jsonString = JSON.stringify(json, null, 2);
  const filePath = path.join(__dirname, `../files/${fileName}_${currentTimestamp}.json`);
  fs.writeFileSync(filePath, jsonString);

  logger.success(`File saved: ${filePath} with ${json.length} records`);
};

const getH2HGameOdds = () => {
  const filePath = path.join(__dirname, '../files/h2hOdds_2024-09-07_11-21-49.json');

  const file = fs.readFileSync(filePath);
  return JSON.parse(file);
};

module.exports = {
  saveFile,
  getH2HGameOdds,
};
