import path from 'path';
import fs from 'fs/promises';
import WorkerPool from './lib/workerPool';
import argv from './utils/argv';
import Logger from './utils/log';

const log = Logger(argv.debug, argv.silent);

async function main() {
  const { 'access-key': accessKey, 'access-secret': accessSecret, file } = argv;

  if (!accessKey || !accessSecret) {
    log.error('Access key and secret are required.');
    process.exit(1);
  }

  if (!file) {
    log.error('File is required.');
    process.exit(1);
  }

  const pool = new WorkerPool(path.join(__dirname, 'worker.js'), 6);
  const urls = await fs
    .readFile(file, 'utf8')
    .then((data) => data.split('\n'))
    .then((lines) => lines.filter((line) => line && !line.startsWith('#')));

  Promise.all(
    urls.map(async (url) => {
      await pool.run({
        url,
        accessKey,
        accessSecret,
        debug: argv.debug,
        silent: argv.silent,
      });
    })
  ).then(() => pool.destroy());
}

main();
