/**
 * In-memory job queue for asynchronous background tasks.
 * Serves as a free, lightweight replacement for BullMQ + Redis for the MVP.
 */
const jobQueue: (() => Promise<void>)[] = [];

/**
 * Enqueues a job (an async function) to be run immediately.
 * 
 * @param fn The asynchronous function representing the job to execute.
 */
export async function enqueueJob(fn: () => Promise<void>): Promise<void> {
  jobQueue.push(fn);
  
  // Run immediately for the MVP
  fn().catch((error) => {
    console.error('Error executing job in in-memory queue:', error);
  });
}
