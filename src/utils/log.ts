import logger from 'hexo-log';

const Logger = (debug = false, silent = false) =>
  logger({
    debug: Boolean(debug),
    silent: Boolean(silent),
  });

export default Logger;
