export type Ok<A> = {
  readonly type: "ok"
  readonly value: A
}

export type Error<E> = {
  readonly type: "error"
  readonly error: E
}

export type Result<A, E> = Ok<A> | Error<E>

type UnknownResult = Result<unknown, unknown>

export type ResultAsync<A, E> = Promise<Result<A, E>>

type UnknownResultAsync = Promise<UnknownResult>

export type ResultMaybeAsync<A, E> = Result<A, E> | Promise<Result<A, E>>

type UnknownResultMaybeAsync = UnknownResult | Promise<UnknownResult>

type HasPromise<T> = object extends T
  ? false
  : Promise<any> extends T
    ? true
    : false

type ResultFor<R, T, E> =
  true extends HasPromise<R> ? ResultAsync<T, E> : Result<T, E>

/**
 * TODO: document
 */
export type InferSuccess<T> = [T] extends [
  (...args: unknown[]) => ResultMaybeAsync<infer A, unknown>,
]
  ? A
  : [T] extends [ResultMaybeAsync<infer A, unknown>]
    ? A
    : never

/**
 * TODO: document
 */
export type InferError<T> = [T] extends [
  (...args: unknown[]) => ResultMaybeAsync<unknown, infer E>,
]
  ? E
  : [T] extends [ResultMaybeAsync<unknown, infer E>]
    ? E
    : never

/**
 * TODO: document
 */
export function ok<A>(value: Promise<A>): ResultAsync<A, never>

/**
 * TODO: document
 */
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

/**
 * TODO: document
 */
export function error<E>(error: Promise<E>): ResultAsync<never, E>

/**
 * TODO: document
 */
export function error<E>(error: E): Result<never, E>

export function error<E>(err: E): ResultMaybeAsync<never, E> {
  if (err instanceof Promise) {
    return err.then<Result<never, E>>(error)
  }

  return {
    type: "error",
    error: err,
  }
}

/**
 * TODO: document
 */
export function isResult(value: unknown): value is Result<unknown, unknown> {
  if (value && typeof value === "object" && "type" in value) {
    if (value.type === "ok") return "value" in value
    if (value.type === "error") return "error" in value
  }
  return false
}

/**
 * TODO: document
 */
export function isOk(value: unknown): value is Ok<unknown> {
  return isResult(value) && value.type === "ok"
}

/**
 * TODO: document
 */
export function isError(value: unknown): value is Error<unknown> {
  return isResult(value) && value.type === "error"
}

/**
 * TODO: document
 */
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

/**
 * TODO: document
 */
function trySync<Args extends unknown[], A>(
  callback: (...args: Args) => A,
): (...args: Args) => Result<A, UnknownException>

/**
 * TODO: document
 */
function trySync<Args extends unknown[], A, E>(
  callback: (...args: Args) => A,
  onError: (error: unknown) => E,
): (...args: Args) => Result<A, E>

function trySync(
  callback: (...args: unknown[]) => unknown,
  onError?: (error: unknown) => unknown,
) {
  return function (...args: unknown[]): UnknownResult {
    try {
      const value = callback(...args)
      return ok(value)
    } catch (cause) {
      return error(onError ? onError(cause) : new UnknownException({ cause }))
    }
  }
}

export { trySync as try }

/**
 * TODO: document
 */
export function tryPromise<Args extends unknown[], A>(
  callback: (...args: Args) => Promise<A>,
): (...args: Args) => ResultAsync<A, UnknownException>

/**
 * TODO: document
 */
export function tryPromise<Args extends unknown[], A, E>(
  callback: (...args: Args) => Promise<A>,
  onError: (error: unknown) => E | Promise<E>,
): (...args: Args) => ResultAsync<A, E>

export function tryPromise(
  callback: (...args: unknown[]) => Promise<unknown>,
  onError?: (error: unknown) => unknown | Promise<unknown>,
) {
  return async function (...args: unknown[]): UnknownResultAsync {
    try {
      return await callback(...args).then(ok)
    } catch (cause) {
      if (!onError) return error(new UnknownException({ cause }))
      const handled = await onError(cause)
      return error(handled)
    }
  }
}

/**
 * TODO: document
 */
export function flatMap<
  I extends ResultMaybeAsync<any, any>,
  O extends ResultMaybeAsync<any, any>,
>(
  callback: (value: InferSuccess<I>) => O,
): (
  result: I,
) => ResultFor<I | O, InferSuccess<O>, InferError<I> | InferError<O>>

export function flatMap(callback: (value: unknown) => UnknownResult) {
  function apply(result: UnknownResult): UnknownResult {
    if (isError(result)) return result
    return callback(result.value)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function tap<I extends ResultMaybeAsync<any, any>>(
  callback: (value: InferSuccess<I>) => void | Promise<void>,
): (result: I) => ResultFor<I, InferSuccess<I>, InferError<I>>

export function tap(callback: (value: unknown) => void | Promise<void>) {
  function apply(result: UnknownResult) {
    if (isError(result)) return result
    const next = callback(result.value)
    if (!(next instanceof Promise)) return result
    return next.then<UnknownResult>(() => result)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function tapError<I extends ResultMaybeAsync<any, any>>(
  callback: (error: InferError<I>) => void | Promise<void>,
): (result: I) => ResultFor<I, InferSuccess<I>, InferError<I>>

export function tapError(callback: (value: unknown) => void | Promise<void>) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    const next = callback(result.error)
    if (!(next instanceof Promise)) return result
    return next.then<UnknownResult>(() => result)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function map<I extends ResultMaybeAsync<any, any>, O>(
  callback: (value: InferSuccess<I>) => O,
): (result: I) => ResultFor<I, O, InferError<I>>

export function map(callback: (value: unknown) => unknown) {
  function apply(result: UnknownResult): UnknownResult {
    if (isError(result)) return result
    return ok(callback(result.value))
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function mapError<I extends ResultMaybeAsync<any, any>, O>(
  callback: (error: InferError<I>) => O,
): (result: I) => ResultFor<I, InferSuccess<I>, O>

export function mapError(callback: (value: unknown) => unknown) {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    return error(callback(result.error))
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function filterOrElse<I extends ResultMaybeAsync<any, any>, O>(
  predicate: (value: InferSuccess<I>) => boolean,
  orElse: () => O,
): (result: I) => ResultFor<I, InferSuccess<I> | O, InferError<I>>

export function filterOrElse(
  predicate: (value: unknown) => unknown,
  orElse: () => unknown,
) {
  function apply(result: UnknownResult): UnknownResult {
    if (isError(result)) return result
    if (predicate(result.value)) return result
    return ok(orElse())
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function filterOrFail<I extends ResultMaybeAsync<any, any>, O>(
  predicate: (value: InferSuccess<I>) => boolean,
  orFailWith: (value: InferSuccess<I>) => O,
): (result: I) => ResultFor<I, InferSuccess<I>, InferError<I> | O>

export function filterOrFail(
  predicate: (value: unknown) => unknown,
  orFailWith: (value: unknown) => unknown,
) {
  function apply(result: UnknownResult): UnknownResult {
    if (isError(result)) return result
    if (predicate(result.value)) return result
    return error(orFailWith(result.value))
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function filterOrDie<I extends ResultMaybeAsync<any, any>>(
  predicate: (value: InferSuccess<I>) => boolean,
  orDie: () => never,
): (result: I) => ResultFor<I, InferSuccess<I>, InferError<I>>

export function filterOrDie(
  predicate: (value: unknown) => unknown,
  orDie: () => never,
) {
  function apply(result: UnknownResult): UnknownResult {
    if (isError(result)) return result
    if (predicate(result.value)) return result
    return orDie()
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}
