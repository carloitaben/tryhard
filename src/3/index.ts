// #region Errors

export function TaggedError<const T extends string>(tag: T) {
  return class TaggedError extends Error {
    public readonly tag = tag
    public readonly type = "error"
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

// #endregion

// #region Primitives

export type Ok<A> = {
  readonly type: "ok"
  readonly value: A
}

export type Error<E> = {
  readonly type: "error"
  readonly error: E
}

export type Result<A, E> = Ok<A> | Error<E>

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

export function ok<A>(value: Promise<A>): ResultAsync<A, never>

export function ok<A>(value: A): Result<A, never>

export function ok<A>(value: A): ResultMaybeAsync<A, never> {
  if (value instanceof Promise) {
    return value.then<Result<A, never>>(ok)
  }

  return {
    type: "ok",
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
    type: "error",
    error,
  }
}

// #endregion

// #region Assertions

export function isResult(value: unknown): value is Result<unknown, unknown> {
  if (value && typeof value === "object" && "type" in value) {
    if (value.type === "ok") return "value" in value
    if (value.type === "error") return "error" in value
  }
  return false
}

export function isOk(value: unknown): value is Ok<unknown> {
  return isResult(value) && value.type === "ok"
}

export function isError(value: unknown): value is Error<unknown> {
  return isResult(value) && value.type === "error"
}

// #endregion

// #region Connectors

export function wrap<
  T extends (...args: readonly any[]) => Promise<unknown>,
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
        return ok(value)
      }
      return value.then(ok).catch((error) => fail(onError(error)))
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
    if (isError(r)) return r
    return fn(r.value)
  }
  return (result: I) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

export function map<I extends ResultMaybeAsync<any, any>, const O>(
  fn: (a: InferSuccess<I>) => O,
): (result: I) => ResultFor<I | O, Awaited<O>, InferFailure<I>> {
  return flatMap((value) => ok(fn(value)))
}

export function
