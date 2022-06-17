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

  log.info('Job started:', options.url);
  const res = await save(options.url, options);

  if (!res) {
    log.error('Failed to save URL:', options.url);

    return;
  }

  const jobId = res.job_id;
  log.debug('Job ID:', jobId);

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

        break;
      }

      log.debug('Wait for job to finish...', statusRes.status);
      await wait(5000);
    } else {
      log.error('Failed to get status of job:', jobId);

      break;
    }
  }
}

parentPort?.on('message', async (options: Options) => {
  await worker(options);

  parentPort?.postMessage('Done.');
});
