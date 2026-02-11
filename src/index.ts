export type Ok<A> = {
  readonly type: "ok"
  readonly value: A
}

export type Error<E> = {
  readonly type: "error"
  readonly error: E
}

export type Result<A, E> = Ok<A> | Error<E>

export type UnknownResult = Result<unknown, unknown>

export type ResultAsync<A, E> = Promise<Result<A, E>>

export type UnknownResultAsync = Promise<UnknownResult>

export type ResultMaybeAsync<A, E> = Result<A, E> | Promise<Result<A, E>>

export type UnknownResultMaybeAsync = UnknownResult | Promise<UnknownResult>

type HasPromise<T> = object extends T
  ? false
  : Promise<any> extends T
    ? true
    : false

/**
 * TODO: document
 */
export type ResultFor<R, A, E> =
  true extends HasPromise<R> ? ResultAsync<A, E> : Result<A, E>

/**
 * TODO: document
 */
export type Combinator<
  R extends ResultMaybeAsync<any, any>,
  A = InferSuccess<R>,
  E = InferError<R>,
> = (result: R) => ResultFor<R, A, E>

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

export interface Tagged<T extends string> {
  tag: T
}

type BivariantHandler<E, R> = {
  bivarianceHack(error: E): R
}["bivarianceHack"]

type InferErrorTags<T> = Extract<InferError<T>, Tagged<string>>["tag"]

type TagOf<E> = E extends { tag: infer T } ? T : never

type TagKey<E> = Extract<TagOf<E>, string>

type HandlerResultUnion<H> =
  Exclude<H[keyof H], undefined> extends (...args: unknown[]) => infer R
    ? R extends ResultMaybeAsync<unknown, unknown>
      ? R
      : never
    : never

type HandlerSuccessUnion<H> = InferSuccess<HandlerResultUnion<H>>

type HandlerErrorUnion<H> = InferError<HandlerResultUnion<H>>

type HandlerMap<E> = {
  [K in TagKey<E>]?: BivariantHandler<
    Extract<E, { tag: K }>,
    ResultMaybeAsync<unknown, unknown>
  >
}

type HandledTags<H> = Extract<keyof H, string>

export function ok<A>(value: Promise<A>): ResultAsync<A, never>

export function ok<A>(value: A): Result<A, never>

/**
 * TODO: document
 */
export function ok<A>(value: A): ResultMaybeAsync<A, never> {
  if (value instanceof Promise) {
    return value.then<Result<A, never>>(ok)
  }

  return {
    type: "ok",
    value,
  }
}

export function error<E>(error: Promise<E>): ResultAsync<never, E>

export function error<E>(error: E): Result<never, E>

/**
 * TODO: document
 */
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
export function isTagged(value: unknown): value is Tagged<string> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "tag" in value &&
      typeof value.tag === "string",
  )
}

/**
 * TODO: document
 */
export function isTaggedWith<T extends string>(
  value: unknown,
  tag: T,
): value is Tagged<T> {
  return isTagged(value) && value.tag === tag
}

/**
 * TODO: document
 */
export function TaggedError<const T extends string>(tag: T) {
  return class TaggedError extends Error implements Tagged<T> {
    public readonly tag = tag
    public readonly type = "error"
    public readonly error = this
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

function trySync<Args extends unknown[], A>(
  callback: (...args: Args) => A,
): (...args: Args) => Result<A, UnknownException>

function trySync<Args extends unknown[], A, E>(
  callback: (...args: Args) => A,
  onError: (error: unknown) => E,
): (...args: Args) => Result<A, E>

/**
 * TODO: document
 */
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

export function tryPromise<Args extends unknown[], A>(
  callback: (...args: Args) => Promise<A>,
): (...args: Args) => ResultAsync<A, UnknownException>

export function tryPromise<Args extends unknown[], A, E>(
  callback: (...args: Args) => Promise<A>,
  onError: (error: unknown) => E | Promise<E>,
): (...args: Args) => ResultAsync<A, E>

/**
 * TODO: document
 */
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
): Combinator<I | O, InferSuccess<O>, InferError<I> | InferError<O>>

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
export function map<I extends ResultMaybeAsync<any, any>, O>(
  callback: (value: InferSuccess<I>) => O,
): Combinator<I, O, InferError<I>>

export function map(callback: (value: unknown) => unknown) {
  const combinator = flatMap((value: unknown) => ok(callback(value)))
  return (result: UnknownResultMaybeAsync): UnknownResultMaybeAsync =>
    combinator(result)
}

/**
 * TODO: document
 */
export function mapError<I extends ResultMaybeAsync<any, any>, O>(
  callback: (error: InferError<I>) => O,
): Combinator<I, InferSuccess<I>, O>

export function mapError(callback: (value: unknown) => unknown) {
  return orElseFail(callback)
}

/**
 * TODO: document
 */
export function tap<I extends ResultMaybeAsync<any, any>>(
  callback: (value: InferSuccess<I>) => void | Promise<void>,
): Combinator<I, InferSuccess<I>, InferError<I>>

export function tap(callback: (value: unknown) => void | Promise<void>) {
  const combinator = flatMap((value: unknown) => {
    const next = callback(value)
    if (!(next instanceof Promise)) return ok(value)
    return next.then<UnknownResult>(() => ok(value))
  })
  return (result: UnknownResultMaybeAsync): UnknownResultMaybeAsync =>
    combinator(result)
}

/**
 * TODO: document
 */
export function tapError<I extends ResultMaybeAsync<any, any>>(
  callback: (error: InferError<I>) => void | Promise<void>,
): Combinator<I, InferSuccess<I>, InferError<I>>

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
export function tapErrorTag<
  I extends ResultMaybeAsync<any, any>,
  T extends InferErrorTags<I>,
>(
  tag: T,
  callback: (error: Tagged<T>) => void | Promise<void>,
): Combinator<I, InferSuccess<I>, InferError<I>>

export function tapErrorTag(
  tag: string,
  callback: (error: Tagged<string>) => void | Promise<void>,
) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    if (!isTaggedWith(result.error, tag)) return result
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
export function filterOrElse<I extends ResultMaybeAsync<any, any>, O>(
  predicate: (value: InferSuccess<I>) => boolean,
  orElse: () => O,
): Combinator<I, InferSuccess<I> | O, InferError<I>>

export function filterOrElse(
  predicate: (value: unknown) => unknown,
  orElse: () => unknown,
) {
  const combinator = flatMap((value: unknown) =>
    predicate(value) ? ok(value) : ok(orElse()),
  )
  return (result: UnknownResultMaybeAsync): UnknownResultMaybeAsync =>
    combinator(result)
}

/**
 * TODO: document
 */
export function filterOrFail<I extends ResultMaybeAsync<any, any>, O>(
  predicate: (value: InferSuccess<I>) => boolean,
  orFailWith: (value: InferSuccess<I>) => O,
): Combinator<I, InferSuccess<I>, InferError<I> | O>

export function filterOrFail(
  predicate: (value: unknown) => unknown,
  orFailWith: (value: unknown) => unknown,
) {
  const combinator = flatMap((value: unknown) =>
    predicate(value) ? ok(value) : error(orFailWith(value)),
  )
  return (result: UnknownResultMaybeAsync): UnknownResultMaybeAsync =>
    combinator(result)
}

/**
 * TODO: document
 */
export function filterOrDie<I extends ResultMaybeAsync<any, any>>(
  predicate: (value: InferSuccess<I>) => boolean,
  orDie: () => never,
): Combinator<I, InferSuccess<I>, InferError<I>>

export function filterOrDie(
  predicate: (value: unknown) => unknown,
  orDie: () => never,
) {
  const combinator = flatMap((value: unknown) =>
    predicate(value) ? ok(value) : orDie(),
  )
  return (result: UnknownResultMaybeAsync): UnknownResultMaybeAsync =>
    combinator(result)
}

/**
 * TODO: document
 */
export function catchAll<
  I extends ResultMaybeAsync<any, any>,
  O extends ResultMaybeAsync<any, never>,
>(
  handle: (error: InferError<I>) => O,
): Combinator<I | O, InferSuccess<I> | InferSuccess<O>, never>

export function catchAll(handle: (error: unknown) => UnknownResultMaybeAsync) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    return handle(result.error)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function catchIf<
  I extends ResultMaybeAsync<any, any>,
  E extends InferError<I>,
  O extends ResultMaybeAsync<any, any>,
>(
  predicate: (error: InferError<I>) => error is E,
  handle: (error: E) => O,
): Combinator<
  I | O,
  InferSuccess<I> | InferSuccess<O>,
  Exclude<InferError<I>, E> | InferError<O>
>

export function catchIf(
  predicate: (error: unknown) => boolean,
  handle: (error: unknown) => UnknownResultMaybeAsync,
) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    if (!predicate(result.error)) return result
    return handle(result.error)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function catchSome<
  I extends ResultMaybeAsync<any, any>,
  O extends ResultMaybeAsync<any, any>,
>(
  handle: (error: InferError<I>) => O | undefined,
): Combinator<
  I | O,
  InferSuccess<I> | InferSuccess<O>,
  InferError<I> | InferError<O>
>

export function catchSome(
  handle: (error: unknown) => UnknownResultMaybeAsync | undefined,
) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    const next = handle(result.error)
    if (isResult(next)) return next
    return result
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function catchTag<
  I extends ResultMaybeAsync<any, any>,
  O extends ResultMaybeAsync<any, any>,
  T extends InferErrorTags<I>,
>(
  tag: T,
  handle: BivariantHandler<Tagged<T>, O>,
): Combinator<
  I | O,
  InferSuccess<I> | InferSuccess<O>,
  Exclude<InferError<I>, Tagged<T>>
>

export function catchTag<
  I extends ResultMaybeAsync<any, any>,
  O extends ResultMaybeAsync<any, any>,
  T extends InferErrorTags<I>,
>(tag: T, handle: BivariantHandler<Tagged<T>, O>) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    if (!isTaggedWith(result.error, tag)) return result
    return handle(result.error)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function catchTags<
  I extends ResultMaybeAsync<any, Tagged<string>>,
  H extends HandlerMap<InferError<I>>,
>(
  handlers: H,
): Combinator<
  I | HandlerResultUnion<H>,
  InferSuccess<I> | HandlerSuccessUnion<H>,
  Exclude<InferError<I>, { tag: HandledTags<H> }> | HandlerErrorUnion<H>
>

export function catchTags(
  handlers: Record<
    string,
    BivariantHandler<Tagged<string>, UnknownResultMaybeAsync>
  >,
) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    if (!isTagged(result.error)) return result
    const handler = handlers[result.error.tag]
    if (!handler) return result
    return handler(result.error)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function orElse<
  I extends ResultMaybeAsync<any, any>,
  O extends ResultMaybeAsync<any, any>,
>(
  handle: (error: InferError<I>) => O,
): Combinator<I | O, InferSuccess<I> | InferSuccess<O>, InferError<O>>

export function orElse(handle: (error: unknown) => UnknownResultMaybeAsync) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    return handle(result.error)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function orElseFail<I extends ResultMaybeAsync<any, any>, O>(
  mapError: (error: InferError<I>) => O,
): Combinator<I, InferSuccess<I>, O>

export function orElseFail(mapError: (value: unknown) => unknown) {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    return error(mapError(result.error))
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function orElseSucceed<I extends ResultMaybeAsync<any, any>, O>(
  value: (error: InferError<I>) => O,
): Combinator<I, InferSuccess<I> | O, never>

export function orElseSucceed(value: (error: unknown) => unknown) {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    return ok(value(result.error))
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function orDie<I extends ResultMaybeAsync<any, any>>(): Combinator<
  I,
  InferSuccess<I>,
  never
>

export function orDie() {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    throw result.error
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * TODO: document
 */
export function orDieWith<I extends ResultMaybeAsync<any, any>, O>(
  mapError: (error: InferError<I>) => O,
): Combinator<I, InferSuccess<I>, never>

export function orDieWith(mapError: (error: unknown) => unknown) {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    throw mapError(result.error)
  }
  return (result: UnknownResultMaybeAsync) =>
    result instanceof Promise ? result.then(apply) : apply(result)
}
