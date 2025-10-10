/**
 * Offline Queue Service
 * Manages offline operations queue for score submission
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

/**
 * Get the current queue from storage
 * @returns {Promise<Array>} Current queue
 */
async function getQueue() {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueJson) {
      return [];
    }
    return JSON.parse(queueJson);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get queue:', error);
    return [];
  }
}

/**
 * Save the queue to storage
 * @param {Array} queue - Queue to save
 * @returns {Promise<void>}
 */
async function saveQueue(queue) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save queue:', error);
    throw error;
  }
}

/**
 * Add an operation to the queue
 * @param {Object} operation - Operation to add {type, data}
 * @returns {Promise<void>}
 */
export async function addToQueue(operation) {
  const queue = await getQueue();

  const queueItem = {
    id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: operation.type,
    data: operation.data,
    timestamp: Date.now(),
    retries: 0,
  };

  queue.push(queueItem);
  await saveQueue(queue);
}

/**
 * Process the queue with a provided handler function
 * @param {Function} handler - Handler function to process each operation
 * @returns {Promise<Object>} Result with processed and failed counts
 */
export async function processQueue(handler) {
  const queue = await getQueue();

  if (queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;
  const remainingQueue = [];

  // Process operations sequentially to maintain order
  // eslint-disable-next-line no-restricted-syntax
  for (const operation of queue) {
    try {
      if (handler) {
        // eslint-disable-next-line no-await-in-loop
        await handler(operation);
      }
      processed += 1;
      // Successfully processed, don't add back to queue
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to process operation:', error);
      failed += 1;

      // Increment retry count
      const updatedOperation = {
        ...operation,
        retries: operation.retries + 1,
      };

      // Only keep in queue if under max retries
      if (updatedOperation.retries < MAX_RETRIES) {
        remainingQueue.push(updatedOperation);
      }
    }
  }

  await saveQueue(remainingQueue);

  return { processed, failed };
}

/**
 * Clear all operations from the queue
 * @returns {Promise<void>}
 */
export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

/**
 * Get the current queue size
 * @returns {Promise<number>} Number of operations in queue
 */
export async function getQueueSize() {
  const queue = await getQueue();
  return queue.length;
}
