import { isMainThread, parentPort } from 'worker_threads';
import wait from '../utils/wait';
import Logger from '../utils/log';
import save, { type SaveOptions } from '../lib/save';
import status from '../lib/status';

if (isMainThread)
  throw new Error('It is not a worker, it is now at Main Thread.');

type Options = SaveOptions & {
  url: string;
};

async function worker(options: Options) {
  const log = Logger(options.debug, options.silent);
  let res = null;
  let retryCount = 0;

  while (true) {
    log.info('Job started:', options.url);
    res = await save(options.url, options);

    if (!res) {
      log.error('Failed to save URL:', options.url);

      if (++retryCount > 5) return;

      log.debug('Retrying...', `(${retryCount}/5)`);
      await wait(10000);
    } else {
      break;
    }
  }

  const jobId = res.job_id;
  log.debug('Job ID:', jobId);

  retryCount = 0;
  let checkCount = 0;
  // Wait for job to finish
  while (true) {
    // Check if job is finished
    const statusRes = await status(jobId, options);

    if (statusRes) {
      if (statusRes?.status === 'success') {
        log.debug('Job finished:', jobId);
        log.info('Job finished:', options.url, `(${statusRes.duration_sec}s)`);

        break;
      } else if (statusRes?.status === 'error') {
        log.error(
          'Job failed:',
          options.url,
          '(' + statusRes?.status_ext + ')'
        );

        if (++retryCount > 5) break;

        log.debug('Retrying...', `(${retryCount}/5)`);
        await wait(10000);
      }

      if (++checkCount > 20) {
        log.error('Job failed (timeout):', options.url);
        break;
      }

      log.debug('Wait for job to finish...', statusRes.status);
      await wait(5000);
    } else {
      log.error('Failed to get status of job:', jobId);

      if (++retryCount > 5) break;

      log.debug('Retrying...', `(${retryCount}/5)`);
      await wait(10000);
    }
  }
}

parentPort?.on('message', async (options: Options) => {
  await worker(options);
  await wait(2000);

  parentPort?.postMessage('Done.');
});
