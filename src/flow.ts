export function flow<A>(): (input: A) => A

export function flow<A, B>(funcA: (input: A) => B): (input: A) => B

export function flow<A, B, C>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
): (input: A) => C

export function flow<A, B, C, D>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
): (input: A) => D

export function flow<A, B, C, D, E>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
): (input: A) => E

export function flow<A, B, C, D, E, F>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
): (input: A) => F

export function flow<A, B, C, D, E, F, G>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
): (input: A) => G

export function flow<A, B, C, D, E, F, G, H>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
): (input: A) => H

export function flow<A, B, C, D, E, F, G, H, I>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
): (input: A) => I

export function flow<A, B, C, D, E, F, G, H, I, J>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
  funcI: (input: I) => J,
): (input: A) => J

export function flow<A, B, C, D, E, F, G, H, I, J, K>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
  funcI: (input: I) => J,
  funcJ: (input: J) => K,
): (input: A) => K

export function flow<A, B, C, D, E, F, G, H, I, J, K, L>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
  funcI: (input: I) => J,
  funcJ: (input: J) => K,
  funcK: (input: K) => L,
): (input: A) => L

export function flow<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
  funcI: (input: I) => J,
  funcJ: (input: J) => K,
  funcK: (input: K) => L,
  funcL: (input: L) => M,
): (input: A) => M

export function flow<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
  funcI: (input: I) => J,
  funcJ: (input: J) => K,
  funcK: (input: K) => L,
  funcL: (input: L) => M,
  funcM: (input: M) => N,
): (input: A) => N

export function flow<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
  funcI: (input: I) => J,
  funcJ: (input: J) => K,
  funcK: (input: K) => L,
  funcL: (input: L) => M,
  funcM: (input: M) => N,
  funcN: (input: N) => O,
): (input: A) => O

export function flow<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
  funcI: (input: I) => J,
  funcJ: (input: J) => K,
  funcK: (input: K) => L,
  funcL: (input: L) => M,
  funcM: (input: M) => N,
  funcN: (input: N) => O,
  funcO: (input: O) => P,
): (input: A) => P

/**
 * Performs left-to-right function composition without executing it,
 * producing a new function that represents a reusable transformation
 * pipeline. Each function is composed in sequence so that the output of
 * one becomes the input of the next, but execution is deferred until the
 * returned function is called.
 *
 * This allows building reusable pipelines that can be applied to different
 * inputs, rather than executing the transformation immediately.
 *
 * @example
 * ```ts
 * // Without flow()
 * (value) => c(b(a(value)))
 *
 * // With flow()
 * const transform = flow(a, b, c)
 *
 * transform(value)
 * ```
 */
export function flow(...functions: ReadonlyArray<(value: any) => any>) {
  return (input: unknown) => functions.reduce((value, fn) => fn(value), input)
}
