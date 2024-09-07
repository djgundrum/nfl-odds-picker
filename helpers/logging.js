const readline = require('readline');
const chalk = require('chalk');

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
};

const askMultilineQuestionRequiringTypingEnd = (query) => {
  /*
    Sometimes we want to allow the user to input a full column of data. For example, if they are quickly copying
    from a query result in PopSQL. This input works as follows:

    const resp = await logger.askMultilineQuestionRequiringTypingEnd('Insert Column: ')

    // User Types:
      1
      2
      3
      ...
      end

    // typing "end" triggers the previous values to return as a block of text
  */
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  info(query); // This will print the initial query for the user

  const lines = [];
  return new Promise((resolve) => {
    rl.on('line', (input) => {
      if (input.toLowerCase() === 'end') {
        rl.close();
      } else {
        lines.push(input);
      }
    }).on('close', () => {
      resolve(lines.join('\n'));
    });
  });
};

const section = (msg, extra) => console.info(chalk.yellowBright(`\n\n\n${msg}`), extra || '');

const insignificant = (msg, extra) => {
  console.info(chalk.hex('#aaa')('-- ' + msg), extra || '');
  return true; // To allow stringing together comments
};

const info = (msg, extra) => {
  console.info(chalk.hex('#4a4a4a')(msg), extra || '');
  return true; // To allow stringing together comments
};

const success = (msg, extra) => {
  console.info(chalk.green('Success: ') + msg, extra || '');
  return true; // To allow stringing together comments
};

const error = (msg, extra) => {
  console.info(chalk.red(`Error: ${msg}`), extra || '');
  return true; // To allow stringing together comments
};

const warn = (msg, extra) => {
  console.info(chalk.yellow(`Warning: ${msg}`), extra || '');
  return true; // To allow stringing together comments
};

let logTimestamp;
const startTimer = () => (logTimestamp = Date.now());
const logTime = (msg) => {
  insignificant(`Took ${Date.now() - logTimestamp}ms - ${msg}`);
  startTimer();
};

const requestConfirmation = async (msg) => {
  const ans = await askQuestion(msg || 'Does this information look correct? Answer y/n: ');
  ans !== 'y' && process.exit();
};

module.exports = {
  askQuestion,
  askMultilineQuestionRequiringTypingEnd,
  section,
  insignificant,
  info,
  success,
  error,
  warn,
  startTimer,
  logTime,
  requestConfirmation,
};
