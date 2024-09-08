require('dotenv').config({ path: '../.env' });
const { program } = require('commander');
const logger = require('./logging');

const globalEnvSetup = (args, extraConsoles = []) => {
  /*
    Initialize Environment variables to allow scripts to run on all three environments.
    Returns a commander program that makes it simpler to parse incoming arguments.

    For example:
      const { globalEnvSetup } = require('./helpers')
      const program = globalEnvSetup([
        ['-d --debug', 'boolean to specify whether we are debugging'],
            node script.js -d debug -> debug = true

        ['-u --user-type <type>', 'variable for the type of user'],
            node script.js -u type insider -> type = insider

        ['-ud --user-type-with-default <id>', 'variable for the type of user', parseFloat],
            node script -ud '10' fn => parseFloat(x) => type = 10

        ['-u --user-type-with-required-variable <id>', 'user must have an id set', null, true],
            node script -ud '10' fn => parseFloat(x) => type = 10

      ])
  */

  process.env.RUNNING_SCRIPT = true;

  args &&
    args.forEach((arg) => {
      const blankFn = (a) => a;
      if (arg[3]) {
        program.requiredOption(arg[0], arg[1], arg[2] || blankFn);
      } else {
        program.option(arg[0], arg[1], arg[2] || blankFn);
      }
    });

  if (extraConsoles.length) {
    program.on('--help', () => {
      console.info('');
      console.info('');
      extraConsoles.forEach((msg) => console.info(msg));
      console.info('');
      console.info('');
    });
  }

  program.name();
  program.parse(process.argv);
  return program;
};

/**
 * function that just delays the program a set amount of time. This is most commonly
 * used for rate limiting api requests to other sites.
 *
 * if no time is supplied, it will default to wait 1 second
 *
 * @param {number=} duration - time in milliseconds to wait before resolving
 * @param {boolean=} [print=false] - enable logging
 * @returns promise that resolves after the time supplied
 */
const wait = async (duration = 1000, print = false) => {
  print && logger.info(`Waiting ${duration}ms`);
  return new Promise((r) => setTimeout(r, duration));
};

/**
 * Rejects after the specified amount of time (the inverse of {@linkcode wait})
 *
 * e.g. `Promise.race([ longRunningPromise(), rejectAfter(2000) ])`
 *
 * @param {number=} [duration=1000] - time in milliseconds before rejecting (default = 1000)
 * @param {boolean=} [print=false] - enable logging
 * @returns promise that rejects after the time supplied
 */
const rejectAfter = async (duration = 1000, print = false) => {
  print && logger.info(`Setting timeout for ${duration}ms`);
  await wait(duration);
  return Promise.reject();
};

/**
 * Promise that is guaranteed to settle in the specified amount of time
 *
 * e.g. `timeout(longRunningPromise(), 2000))`
 *
 * @param {function | Array<function>} fn - function(s) to evaluate
 * @param {number=} duration - time in milliseconds before rejecting, if not is specified it will settle with the provided argument
 * @param {boolean=} [print=false] - enable logging
 * @returns A {@linkcode Promise} that settles with the provided argument or rejects after `delay`
 */
const timeout = (fn, duration, print = false) => {
  const arrayOfFunctions = Array.isArray(fn) ? fn : [fn];
  if (duration) {
    arrayOfFunctions.push(rejectAfter(duration, print));
  }
  return Promise.race(arrayOfFunctions);
};

/**
 * function that will wait a random amount of time given a base
 * amount of time to wait.
 * @param {number} [timeout=1000] amount of base time that will be waited
 * @param {boolean} [print=false] - print the amount of time that it is waiting for transparency in the console
 * @default 1000ms
 */
const wait_random_time = async (timeout = 1000, print = false) => {
  const time = Math.random() * timeout + timeout;
  print && logger.info('Waiting ' + time / 1000 + 's before continuing');
  return new Promise((r) => setTimeout(r, time));
};

module.exports = {
  globalEnvSetup,
  wait,
  wait_random_time,
  rejectAfter,
  timeout,
};
