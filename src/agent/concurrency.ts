export type Task<T> = () => Promise<T>;

export const runConcurrent = async <T>(
  tasks: Task<T>[],
  concurrency = tasks.length,
): Promise<T[]> => {
  if (tasks.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, tasks.length));
  const results: T[] = new Array(tasks.length);
  let index = 0;

  const worker = async () => {
    while (index < tasks.length) {
      const current = index;
      index += 1;
      results[current] = await tasks[current]();
    }
  };

  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
  return results;
};
