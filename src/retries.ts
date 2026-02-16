import type { Result, ResultMaybeAsync } from "./result"

export type RetryContext<E> = {
  readonly attempt: number
  readonly error: E
}

export type RetryTimes<E> = number | ((context: RetryContext<E>) => boolean)

export type RetryDelay<E> = number | ((context: RetryContext<E>) => number)

export type RetryOptions<E> = {
  readonly times?: RetryTimes<E>
  readonly delay?: RetryDelay<E>
}

export type EventuallyOptions<E> = {
  readonly delay?: RetryDelay<E>
}

function resolveTimes<E>(
  times: RetryTimes<E> | undefined,
  context: RetryContext<E>,
): boolean {
  if (times === undefined) return context.attempt < 3
  if (typeof times === "number") return context.attempt < times
  return times(context)
}

function resolveDelay<E>(
  delay: RetryDelay<E> | undefined,
  context: RetryContext<E>,
): number {
  if (delay === undefined) return 0
  if (typeof delay === "number") return delay
  return delay(context)
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry an effect until it succeeds or retries run out.
 *
 * **Details**
 *
 * Retries run when the effect returns `Error`. Use `times` to cap retries and
 * `delay` to wait between attempts.
 *
 * **Example**
 *
 * ```ts
 * let attempts = 0
 * const result = retry(
 *   () => {
 *     attempts += 1
 *     return attempts < 2 ? Result.error("no") : Result.ok("yes")
 *   },
 *   { times: 2 }
 * )
 * ```
 *
 * @category Retry
 */
export function retry<A, E>(
  effect: () => ResultMaybeAsync<A, E>,
  options?: RetryOptions<E>,
): ResultMaybeAsync<A, E> {
  const first = effect()
  if (first instanceof Promise) return retryAsync(effect, options)
  if (first.tag === "ok") return first
  let attempt = 0
  let current: Result<A, E> = first
  while (true) {
    if (current.tag === "ok") return current
    const context = { attempt, error: current.error }
    if (!resolveTimes(options?.times, context)) return current
    const delayMs = resolveDelay(options?.delay, context)
    if (delayMs > 0) return retryAsync(effect, options, current, delayMs)
    attempt += 1
    const next = effect()
    if (next instanceof Promise) return retryAsync(effect, options)
    current = next
  }
}

/**
 * Retry an effect until it succeeds.
 *
 * **Details**
 *
 * Equivalent to `retry` with infinite retries. Use `delay` to wait between
 * attempts.
 *
 * **Example**
 *
 * ```ts
 * let attempts = 0
 * const result = eventually(() => {
 *   attempts += 1
 *   return attempts < 3 ? Result.error("no") : Result.ok("yes")
 * })
 * ```
 *
 * @category Retry
 */
export function eventually<A, E>(
  effect: () => ResultMaybeAsync<A, E>,
  options?: EventuallyOptions<E>,
): ResultMaybeAsync<A, E> {
  return retry(effect, {
    times: Number.POSITIVE_INFINITY,
    delay: options?.delay,
  })
}

async function retryAsync<A, E>(
  effect: () => ResultMaybeAsync<A, E>,
  options?: RetryOptions<E>,
  firstResult?: Result<A, E>,
  firstDelay?: number,
): Promise<Result<A, E>> {
  let attempt = 0
  let current: Result<A, E>

  if (firstResult) {
    current = firstResult
  } else {
    const result = await effect()
    current = result
  }

  while (true) {
    if (current.tag === "ok") return current
    const context = { attempt, error: current.error }
    if (!resolveTimes(options?.times, context)) return current
    const delayMs =
      attempt === 0 && firstDelay !== undefined
        ? firstDelay
        : resolveDelay(options?.delay, context)
    await sleep(delayMs)
    attempt += 1
    current = await effect()
  }
}
