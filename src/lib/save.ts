import fetch from 'node-fetch';
import Logger from '../utils/log';

export interface SaveOptions {
  // Get your account's keys at https://archive.org/account/s3.php
  accessKey: string;
  accessSecret: string;

  /**
   * Capture a web page with errors (HTTP status=4xx or 5xx).
   * By default SPN2 captures only status=200 URLs.
   */
  all?: boolean;

  /**
   * Capture web page outlinks automatically.
   * This also applies to PDF, JSON, RSS and MRSS feeds.
   */
  outlinks?: boolean;

  /**
   * Capture full page screenshot in PNG format.
   * This is also stored in the Wayback Machine as a different capture.
   */
  screenshot?: boolean;

  /**
   * The capture becomes available in the Wayback Machine after ~12 hours instead of immediately.
   * This option helps reduce the load on our systems.
   * All API responses remain exactly the same when using this option.
   */
  delayWbAvailability?: boolean;

  /**
   * Force the use of a simple HTTP GET request to capture the target URL.
   * By default SPN2 does a HTTP HEAD on the target URL to decide whether to use a headless browser or a simple HTTP GET request.
   * force_get overrides this behavior.
   */
  forceGet?: boolean;

  /**
   * Skip checking if a capture is a first if you don’t need this information.
   * This will make captures run faster.
   */
  skipFirstArchive?: boolean;

  // Logger
  debug?: boolean;
  silent?: boolean;
}

interface SaveResponse {
  url: string;
  job_id: string;
}

export default async function save(
  url: string,
  options: SaveOptions
): Promise<SaveResponse | null> {
  if (!url) throw new Error('URL is required!');

  const log = Logger(options.debug, options.silent);

  const params = new URLSearchParams();
  params.append('url', url);
  params.append('capture_all', options.all ? '1' : '0');
  params.append('capture_outlinks', options.outlinks ? '1' : '0');
  params.append('capture_screenshot', options.screenshot ? '1' : '0');
  params.append(
    'delay_wb_availability',
    options.delayWbAvailability ? '1' : '0'
  );
  params.append('force_get', options.forceGet ? '1' : '0');
  params.append('skip_first_archive', options.skipFirstArchive ? '1' : '0');

  try {
    const res = await fetch('https://web.archive.org/save', {
      method: 'POST',
      headers: {
        Authorization: `LOW ${options.accessKey}:${options.accessSecret}`,
        Accept: 'application/json',
      },
      body: params,
    });

    if (!res.ok || res.url === 'https://web.archive.org/429.html') {
      log.e(res.statusText);
      return null;
    }

    return (await res.json()) as SaveResponse;
  } catch (e) {
    log.error(e);

    return null;
  }
}
