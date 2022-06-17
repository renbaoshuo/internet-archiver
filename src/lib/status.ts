import fetch from 'node-fetch';
import Logger from '../utils/log';

interface StatusOptions {
  accessKey: string;
  accessSecret: string;

  // Logger
  debug?: boolean;
  silent?: boolean;
}

interface StatusResponse {
  job_id: string;
  status: 'success' | 'pending' | 'error';
  status_ext: string;
  message?: string;
  exception?: string;
  original_url: string;
  screenshot?: string;
  timestamp?: string;
  duration_sec?: number;
  resources: string[];
  outlinks?: string[];
}

export default async function status(
  job_id: string,
  options: StatusOptions
): Promise<StatusResponse | null> {
  if (!job_id) throw new Error('Job ID is required!');

  const log = Logger(options.debug, options.silent);

  log.debug('Checking status of job:', job_id);
  const url = `https://web.archive.org/save/status/${job_id}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `LOW ${options.accessKey}:${options.accessSecret}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok || res.url === 'https://web.archive.org/429.html') {
      log.error(res.statusText);
      log.error(res);
      return null;
    }

    return (await res.json()) as StatusResponse;
  } catch (e) {
    log.error(e);

    return null;
  }
}
