export function pipe<A>(value: A): A

export function pipe<A, B>(value: A, funcA: (input: A) => B): B

export function pipe<A, B, C>(
  value: A,
  funcA: (input: A) => B,
  funcB: (input: B) => C,
): C

export function pipe<A, B, C, D>(
  value: A,
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
): D

export function pipe<A, B, C, D, E>(
  value: A,
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
): E

export function pipe<A, B, C, D, E, F>(
  value: A,
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
): F

export function pipe<A, B, C, D, E, F, G>(
  value: A,
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
): G

export function pipe<A, B, C, D, E, F, G, H>(
  value: A,
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
): H

export function pipe<A, B, C, D, E, F, G, H, I>(
  value: A,
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
): I

export function pipe<A, B, C, D, E, F, G, H, I, J>(
  value: A,
  funcA: (input: A) => B,
  funcB: (input: B) => C,
  funcC: (input: C) => D,
  funcD: (input: D) => E,
  funcE: (input: E) => F,
  funcF: (input: F) => G,
  funcG: (input: G) => H,
  funcH: (input: H) => I,
  funcI: (input: I) => J,
): J

export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  value: A,
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
): K

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
  value: A,
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
): L

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  value: A,
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
): M

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  value: A,
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
): N

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  value: A,
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
): O

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  value: A,
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
): P

export function pipe(value: unknown, ...fns: Function[]): unknown {
  return fns.reduce((acc, fn) => fn(acc), value)
}

// #region Errors

export function TaggedError<const T extends string>(tag: T) {
  return class TaggedError extends Error {
    public readonly tag = tag
    public readonly type = "failure"
    public readonly value = this
    constructor(message: string, options?: ErrorOptions) {
      super(message, options)
      this.name = tag
    }
  }
}

export class UnknownException extends TaggedError("UnknownException") {
  constructor(options?: ErrorOptions) {
    super("Unknown exception", options)
  }
}

export class AssertionError extends TaggedError("AssertionError") {
  constructor(value: unknown) {
    super("Assertion failed", { cause: value })
  }
}

// #endregion

// #region Primitives

export type Success<A> = {
  readonly type: "success"
  readonly value: A
}

export type Failure<E> = {
  readonly type: "failure"
  readonly error: E
}

export type Result<A, E> = Success<A> | Failure<E>

export type ResultAsync<A, E> = Promise<Result<A, E>>

export type ResultMaybeAsync<A, E> = Result<A, E> | Promise<Result<A, E>>

export type HasPromise<T> = object extends T
  ? false
  : Promise<any> extends T
    ? true
    : false

export type ResultFor<R, T, E> =
  true extends HasPromise<R> ? ResultAsync<T, E> : Result<T, E>

export type InferSuccess<T> = [T] extends [
  (...args: unknown[]) => ResultMaybeAsync<infer A, unknown>,
]
  ? A
  : [T] extends [ResultMaybeAsync<infer A, unknown>]
    ? A
    : never

export type InferFailure<T> = [T] extends [
  (...args: unknown[]) => ResultMaybeAsync<unknown, infer E>,
]
  ? E
  : [T] extends [ResultMaybeAsync<unknown, infer E>]
    ? E
    : never

export function success<A>(value: Promise<A>): ResultAsync<A, never>

export function success<A>(value: A): Result<A, never>

export function success<A>(value: A): ResultMaybeAsync<A, never> {
  if (value instanceof Promise) {
    return value.then<Result<A, never>>(success)
  }

  return {
    type: "success",
    value,
  }
}

export function fail<E>(error: Promise<E>): ResultAsync<never, E>

export function fail<E>(error: E): Result<never, E>

export function fail<E>(error: E): ResultMaybeAsync<never, E> {
  if (error instanceof Promise) {
    return error.catch(fail)
  }

  return {
    type: "failure",
    error,
  }
}

// #endregion

// #region Assertions

export function isResult(value: unknown): value is Result<unknown, unknown> {
  if (value && typeof value === "object" && "type" in value) {
    if (value.type === "success") return "value" in value
    if (value.type === "failure") return "error" in value
  }
  return false
}

export function assertResult(
  value: unknown,
): asserts value is Result<unknown, unknown> {
  if (!isResult(value)) throw new AssertionError(value)
}

export function isSuccess(value: unknown): value is Success<unknown> {
  return isResult(value) && value.type === "success"
}

export function assertSuccess(
  value: unknown,
): asserts value is Success<unknown> {
  if (!isSuccess(value)) throw new AssertionError(value)
}

export function isFailure(value: unknown): value is Failure<unknown> {
  return isResult(value) && value.type === "failure"
}

export function assertFailure(
  value: unknown,
): asserts value is Failure<unknown> {
  if (!isFailure(value)) throw new AssertionError(value)
}

// #endregion

// #region Connectors

export function wrap<
  T extends (...args: readonly unknown[]) => Promise<unknown>,
  E = UnknownException,
>(
  callback: T,
  onError?: (error: unknown) => E,
): (...args: Parameters<T>) => Promise<Result<Awaited<ReturnType<T>>, E>>
export function wrap<
  T extends (...args: readonly unknown[]) => unknown,
  E = UnknownException,
>(
  callback: T,
  onError?: (error: unknown) => E,
): (...args: Parameters<T>) => Result<ReturnType<T>, E>
export function wrap(
  callback: any,
  onError: any = (error: unknown) => new UnknownException({ cause: error }),
) {
  return function safe(...args: unknown[]) {
    try {
      const value = callback(...args)
      if (!(value instanceof Promise)) {
        return success(value)
      }
      return value.then(success).catch((error) => fail(onError(error)))
    } catch (error) {
      return fail(onError(error))
    }
  }
}

// #endregion

// #region Combinators

export function flatMap<
  I extends ResultMaybeAsync<any, any>,
  O extends ResultMaybeAsync<any, any>,
>(
  fn: (a: InferSuccess<I>) => O,
): (
  result: I,
) => ResultFor<I | O, InferSuccess<O>, InferFailure<I> | InferFailure<O>> {
  function apply(r: Result<InferSuccess<I>, InferFailure<I>>) {
    if (isFailure(r)) return r
    return fn(r.value)
  }
  return (result: I) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

export function map<I extends ResultMaybeAsync<any, any>, const O>(
  fn: (a: InferSuccess<I>) => O,
): (result: I) => ResultFor<I, Awaited<O>, InferFailure<I>> {
  return flatMap((value) => success(fn(value)))
}
