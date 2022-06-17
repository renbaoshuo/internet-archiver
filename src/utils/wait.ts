/**
 * Wait for a given amount of time.
 * @param time wait time in milliseconds
 */
export default async function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
