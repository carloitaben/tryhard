export interface Tagged<T extends string> {
  readonly tag: T
}

export interface Ok<A> extends Tagged<"ok"> {
  readonly value: A
}

export interface Error<E> extends Tagged<"error"> {
  readonly error: E
}

export type Result<A, E> = Ok<A> | Error<E>

export type UnknownResult = Result<unknown, unknown>

export type ResultAsync<A, E> = Promise<Result<A, E>>

export type UnknownResultAsync = ResultAsync<unknown, unknown>

export type ResultMaybeAsync<A, E> = Result<A, E> | Promise<Result<A, E>>

export type UnknownResultMaybeAsync = ResultMaybeAsync<unknown, unknown>

type HasPromise<T> = object extends T
  ? false
  : Promise<any> extends T
    ? true
    : false

/**
 * Choose the right `Result` shape based on the input type.
 *
 * **Details**
 *
 * `ResultFor` keeps combinators honest about sync vs async. If the input type
 * includes a `Promise`, the output is `ResultAsync`. Otherwise it stays a
 * synchronous `Result`.
 *
 * Use this in combinator typings to preserve the execution model without making
 * callers think about it.
 *
 * @category Models
 */
export type ResultFor<R, A, E> =
  true extends HasPromise<R> ? ResultAsync<A, E> : Result<A, E>

/**
 * Combinator signature that preserves the input's sync/async shape.
 *
 * **Details**
 *
 * A `Combinator` takes a `Result` (or `ResultAsync`) and returns a new result
 * that matches the same sync/async shape. This keeps pipelines uniform when you
 * mix sync and async combinators.
 *
 * @category Models
 */
export type Combinator<
  R extends UnknownResultMaybeAsync,
  A = InferSuccess<R>,
  E = InferError<R>,
> = (result: R) => ResultFor<R, A, E>

/**
 * Infer the success type from a `Result` or `Result`-returning function.
 *
 * **Details**
 *
 * Useful for typing combinators that accept either a `Result` or a function
 * returning a `Result` while still inferring the correct success channel.
 *
 * @category Models
 */
export type InferSuccess<T> = [T] extends [
  (...args: unknown[]) => ResultMaybeAsync<infer A, unknown>,
]
  ? A
  : [T] extends [ResultMaybeAsync<infer A, unknown>]
    ? A
    : never

/**
 * Infer the error type from a `Result` or `Result`-returning function.
 *
 * **Details**
 *
 * Mirrors `InferSuccess` for the error channel so combinators can keep error
 * unions precise without extra annotations.
 *
 * @category Models
 */
export type InferError<T> = [T] extends [
  (...args: unknown[]) => ResultMaybeAsync<unknown, infer E>,
]
  ? E
  : [T] extends [ResultMaybeAsync<unknown, infer E>]
    ? E
    : never

type BivariantHandler<E, R> = {
  bivarianceHack(error: E): R
}["bivarianceHack"]

type InferErrorTags<T> = Extract<InferError<T>, Tagged<string>>["tag"]

export type InferTag<E> = E extends { tag: infer T } ? T : never

type TagKey<E> = Extract<InferTag<E>, string>

type HandlerResultUnion<H> =
  Exclude<H[keyof H], undefined> extends (...args: unknown[]) => infer R
    ? R extends UnknownResultMaybeAsync
      ? R
      : never
    : never

type HandlerSuccessUnion<H> = InferSuccess<HandlerResultUnion<H>>

type HandlerErrorUnion<H> = InferError<HandlerResultUnion<H>>

type HandlerMap<E> = {
  [K in TagKey<E>]?: BivariantHandler<
    Extract<E, { tag: K }>,
    UnknownResultMaybeAsync
  >
}

type HandledTags<H> = Extract<keyof H, string>

export function ok(): Result<void, never>

export function ok<A>(value: Promise<A>): ResultAsync<A, never>

export function ok<A>(value: A): Result<A, never>

/**
 * Construct a successful `Result` from a value or promise.
 *
 * **Details**
 *
 * If the input is a `Promise`, this returns a `ResultAsync` that resolves to
 * `Ok`. Otherwise it returns `Ok` immediately.
 *
 * **Example**
 *
 * ```ts
 * const r1 = Result.ok()
 * const r2 = Result.ok(123)
 * const r3 = Result.ok(Promise.resolve("done"))
 * ```
 *
 * @category Constructors
 */
export function ok(value?: unknown): UnknownResultMaybeAsync {
  if (value instanceof Promise) {
    return value.then<UnknownResult>(ok)
  }

  return {
    tag: "ok",
    value,
  }
}

export function error<E>(error: Promise<E>): ResultAsync<never, E>

export function error<E>(error: E): Result<never, E>

/**
 * Construct a failed `Result` from a value or promise.
 *
 * **Details**
 *
 * If the input is a `Promise`, this returns a `ResultAsync` that resolves to
 * `Error`. Otherwise it returns `Error` immediately.
 *
 * **Example**
 *
 * ```ts
 * const r1 = Result.error("boom")
 * const r2 = Result.error(Promise.resolve(new Error("boom")))
 * ```
 *
 * @category Constructors
 */
export function error<E>(err: E): ResultMaybeAsync<never, E> {
  if (err instanceof Promise) {
    return err.then<Result<never, E>>(error)
  }

  return {
    tag: "error",
    error: err,
  }
}

export class AssertionError extends Error {
  constructor(type: string, value: unknown) {
    super(`Assertion failed. Expected value of type ${type}`, { cause: value })
  }
}

/**
 * Check if a value has any string `tag` property.
 *
 * @category Guards
 */
export function isTagged(value: unknown): value is Tagged<string>

/**
 * Check if a value has a specific string `tag` property.
 *
 * @category Guards
 */
export function isTagged<T extends string>(
  value: unknown,
  tag: T,
): value is Tagged<T>

export function isTagged(
  value: unknown,
  tag?: string,
): value is Tagged<string> {
  if (
    value &&
    typeof value === "object" &&
    "tag" in value &&
    typeof value.tag === "string"
  ) {
    return typeof tag === "string" ? tag === value.tag : true
  }
  return false
}

/**
 * Asserts that a value has any string `tag` property.
 *
 * **Details**
 *
 * Used to discriminate tagged error unions for `catchTag`, `catchTags`, and
 * `tapErrorTag`.
 *
 * @category Guards
 */
export function assertTagged(value: unknown): asserts value is Tagged<string>

/**
 * Asserts that a value has a specific string `tag` property.
 *
 * @category Guards
 */
export function assertTagged<T extends string>(
  value: unknown,
  tag: T,
): asserts value is Tagged<T>

export function assertTagged(
  value: unknown,
  tag?: string,
): asserts value is Tagged<string> {
  if (typeof tag === "string") {
    if (!isTagged(value, tag)) {
      throw new AssertionError(`Result.Tagged<${tag}>`, value)
    }
  } else if (!isTagged(value)) {
    throw new AssertionError("Result.Tagged", value)
  }
}

/**
 * Check if a value is `Ok`.
 *
 * **Details**
 *
 * A value is `Ok` if it has a `tag` discriminator of `ok` and the
 * corresponding `value` payload.
 *
 * @category Guards
 */
export function isOk(value: unknown): value is Ok<unknown> {
  return isTagged(value, "ok") && "value" in value
}

/**
 * Asserts that a value is `Ok`.
 *
 * **Details**
 *
 * A value is `Ok` if it has a `tag` discriminator of `ok` and the
 * corresponding `value` payload.
 *
 * @category Guards
 */
export function assertOk(value: unknown): asserts value is Ok<unknown> {
  if (!isOk(value)) throw new AssertionError("Result.Ok", value)
}

/**
 * Check if a value is `Error`.
 *
 * **Details**
 *
 * A value is `Error` if it has a `tag` discriminator of `error` and the
 * corresponding `error` payload.
 *
 * @category Guards
 */
export function isError(value: unknown): value is Error<unknown> {
  return isTagged(value, "error") && "error" in value
}

/**
 * Asserts that a value is `Error`.
 *
 * **Details**
 *
 * A value is `Error` if it has a `tag` discriminator of `error` and the
 * corresponding `error` payload.
 *
 * @category Guards
 */
export function assertError(value: unknown): asserts value is Error<unknown> {
  if (!isError(value)) throw new AssertionError("Result.Error", value)
}

/**
 * Check if a value is a `Result`.
 *
 * @category Guards
 */
export function isResult(value: unknown): value is Result<unknown, unknown> {
  return isOk(value) || isError(value)
}

/**
 * Asserts that a value is a `Result`.
 *
 * @category Guards
 */
export function assertResult(
  value: unknown,
): asserts value is Result<unknown, unknown> {
  if (!isResult(value)) throw new AssertionError("Result.Result", value)
}

function applyMaybeAsync(
  result: UnknownResultMaybeAsync,
  apply: (result: UnknownResult) => UnknownResultMaybeAsync,
): UnknownResultMaybeAsync {
  return result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * Create a tagged error class.
 *
 * **Example**
 *
 * ```ts
 * const NotFound = Result.TaggedError("NotFound")
 * const err = new NotFound("missing")
 * ```
 *
 * @category Errors
 */
export function TaggedError<const T extends string>(tag: T) {
  return class TaggedError extends Error implements Tagged<T> {
    public readonly tag = tag
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

type GenReturnSuccess<R> = R extends Result<infer A, unknown> ? A : R

type GenReturnError<R> = R extends Result<unknown, infer E> ? E : never

type GenIteratorYield = UnknownResultMaybeAsync

type GenIteratorReturn = unknown

type GenIteratorNext = unknown

type GenIterator =
  | Iterator<GenIteratorYield, GenIteratorReturn, GenIteratorNext>
  | AsyncIterator<GenIteratorYield, GenIteratorReturn, GenIteratorNext>

type GenYieldable<R extends UnknownResult> = {
  readonly [Symbol.iterator]: () => Generator<
    R,
    InferSuccess<R>,
    InferSuccess<R>
  >
}

type GenYieldableAsync<R extends UnknownResultMaybeAsync> = {
  readonly [Symbol.asyncIterator]: () => AsyncGenerator<
    Awaited<R>,
    InferSuccess<Awaited<R>>,
    InferSuccess<Awaited<R>>
  >
}

function trySync<Args extends unknown[], A>(
  callback: (...args: Args) => A,
): (...args: Args) => Result<A, UnknownException>

function trySync<Args extends unknown[], A, E>(
  callback: (...args: Args) => A,
  onError: (error: unknown) => E,
): (...args: Args) => Result<A, E>

/**
 * Wrap a sync function, capturing thrown errors as `Result`.
 *
 * **Details**
 *
 * The returned function never throws. It returns `Ok` when the callback succeeds
 * and `Error` when it throws. If `onError` is not provided, thrown values become
 * `UnknownException`.
 *
 * **Example**
 *
 * ```ts
 * const parse = Result.try((s: string) => JSON.parse(s))
 * const r1 = parse("{\"ok\":true}")
 * const r2 = parse("bad json")
 * ```
 *
 * @category Conversions
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
 * Wrap an async function, capturing rejections as `Result`.
 *
 * **Details**
 *
 * The returned function never rejects. It resolves to `Ok` when the callback
 * succeeds and `Error` when it throws or rejects. If `onError` is not provided,
 * rejections become `UnknownException`.
 *
 * **Example**
 *
 * ```ts
 * const fetchJson = Result.tryPromise(async () => {
 *   const res = await fetch("/data")
 *   return res.json()
 * })
 * const r = await fetchJson()
 * ```
 *
 * @category Conversions
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

function genFailure(cause: unknown): Result<never, UnknownException> {
  return error(new UnknownException({ cause }))
}

function isAsyncIterator<
  Y extends GenIteratorYield,
  R extends GenIteratorReturn,
  N extends GenIteratorNext,
>(
  iterator: Iterator<Y, R, N> | AsyncIterator<Y, R, N>,
): iterator is AsyncIterator<Y, R, N> {
  return Symbol.asyncIterator in iterator
}

function normalizeReturnValue(value: unknown): UnknownResult {
  if (isResult(value)) return value
  return ok(value)
}

function closeIterator(
  iterator: Iterator<GenIteratorYield, GenIteratorReturn, GenIteratorNext>,
  result: UnknownResult,
): void {
  if (!iterator.return) return
  iterator.return(result)
}

async function closeAsyncIterator(
  iterator: AsyncIterator<GenIteratorYield, GenIteratorReturn, GenIteratorNext>,
  result: UnknownResult,
): Promise<void> {
  if (!iterator.return) return
  const closed = iterator.return(result)
  if (closed instanceof Promise) {
    await closed
  }
}

function runSyncGen(
  iterator: Iterator<GenIteratorYield, GenIteratorReturn, GenIteratorNext>,
  first: IteratorResult<GenIteratorYield, GenIteratorReturn>,
): UnknownResult {
  try {
    let current = first
    while (true) {
      if (current.done) return normalizeReturnValue(current.value)
      const yielded = current.value
      if (!isResult(yielded)) return genFailure(yielded)
      if (isError(yielded)) {
        closeIterator(iterator, yielded)
        return yielded
      }
      current = iterator.next(yielded.value)
    }
  } catch (cause) {
    return genFailure(cause)
  }
}

async function runAsyncGen(
  iterator: AsyncIterator<GenIteratorYield, GenIteratorReturn, GenIteratorNext>,
  first: Promise<IteratorResult<GenIteratorYield, GenIteratorReturn>>,
): Promise<UnknownResult> {
  try {
    let current = await first
    while (true) {
      if (current.done) return normalizeReturnValue(current.value)
      const yielded = current.value
      const resolved = yielded instanceof Promise ? await yielded : yielded
      if (!isResult(resolved)) return genFailure(resolved)
      if (isError(resolved)) {
        await closeAsyncIterator(iterator, resolved)
        return resolved
      }
      current = await iterator.next(resolved.value)
    }
  } catch (cause) {
    return genFailure(cause)
  }
}

/**
 * Yield a synchronous `Result` from a generator using `yield*`.
 *
 * **Details**
 *
 * `Result.gen` expects yielded values to be `Result`s. This helper makes a
 * `Result` iterable so you can use `yield*` and get back the `Ok` value.
 *
 * **Example**
 *
 * ```ts
 * const out = Result.gen(function* () {
 *   const n = yield* Result.yieldResult(Result.ok(1))
 *   return n + 1
 * })
 * ```
 *
 * @category Generators
 */
export function yieldResult<R extends UnknownResult>(
  result: R,
): GenYieldable<R> {
  return {
    *[Symbol.iterator]() {
      return yield result
    },
  }
}

/**
 * Yield a possibly async `Result` from an async generator using `yield*`.
 *
 * **Details**
 *
 * Use this with `Result.gen` when the generator is `async function*` and the
 * yielded value is a `ResultAsync`.
 *
 * **Example**
 *
 * ```ts
 * const out = await Result.gen(async function* () {
 *   const n = yield* Result.yieldAsync(Result.ok(1))
 *   return n + 1
 * })
 * ```
 *
 * @category Generators
 */
export function yieldAsync<R extends UnknownResultMaybeAsync>(
  result: R,
): GenYieldableAsync<R> {
  return {
    async *[Symbol.asyncIterator](): AsyncGenerator<
      Awaited<R>,
      InferSuccess<Awaited<R>>,
      InferSuccess<Awaited<R>>
    > {
      const nextValue = yield result
      return await nextValue
    },
  }
}

/**
 * Run a generator that yields `Result` values, short-circuiting on errors.
 *
 * **Details**
 *
 * Each `yield` must return a `Result` (or `ResultAsync` for async generators).
 * `Ok` values are fed back into the generator, while `Error` stops execution
 * and becomes the final result.
 *
 * **Example**
 *
 * ```ts
 * const out = Result.gen(function* () {
 *   const n = yield* Result.yieldResult(Result.ok(1))
 *   return n + 1
 * })
 * ```
 *
 * @category Generators
 */
export function gen<Y extends UnknownResult, R>(
  generator: () => Generator<Y, R, InferSuccess<Y>>,
): Result<GenReturnSuccess<R>, InferError<Y> | GenReturnError<R>>

export function gen<Y extends UnknownResultMaybeAsync, R>(
  generator: () => AsyncGenerator<Y, R, InferSuccess<Y>>,
): ResultAsync<GenReturnSuccess<R>, InferError<Y> | GenReturnError<R>>

export function gen(generator: () => GenIterator) {
  try {
    const iterator = generator()
    const first = iterator.next()
    if (first instanceof Promise) {
      if (!isAsyncIterator(iterator)) return genFailure(first)
      return runAsyncGen(iterator, first)
    }
    if (isAsyncIterator(iterator)) return genFailure(first)
    return runSyncGen(iterator, first)
  } catch (cause) {
    return genFailure(cause)
  }
}

/**
 * Sequence results by mapping the success value to another `Result`.
 *
 * **Details**
 *
 * `flatMap` lets you chain computations that can fail. It takes the `Ok` value
 * and returns a new `Result`, while `Error` passes through unchanged. Use it to
 * avoid nesting `Result` inside `Result`.
 *
 * **When to Use**
 *
 * Use `flatMap` when the next step can also fail and already returns a
 * `Result`.
 *
 * **Example**
 *
 * ```ts
 * const applyDiscount = (n: number) =>
 *   n > 0 ? Result.ok(n - 1) : Result.error("bad")
 *
 * const out = pipe(
 *   Result.ok(3),
 *   Result.flatMap(applyDiscount)
 * )
 * ```
 *
 * @category Combinators
 */
export function flatMap<
  I extends UnknownResultMaybeAsync,
  O extends UnknownResultMaybeAsync,
>(
  callback: (value: InferSuccess<I>) => O,
): Combinator<I | O, InferSuccess<O>, InferError<I> | InferError<O>>

export function flatMap(callback: (value: unknown) => UnknownResult) {
  function apply(result: UnknownResult): UnknownResult {
    if (isError(result)) return result
    return callback(result.value)
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Transform the success value, leaving errors untouched.
 *
 * **Details**
 *
 * `map` applies a pure transformation to the `Ok` value. If the result is
 * already an `Error`, it is returned as-is.
 *
 * **When to Use**
 *
 * Use `map` when you want to change the success value without introducing new
 * failure modes.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(1),
 *   Result.map((n) => n + 1)
 * )
 * ```
 *
 * @category Combinators
 */
export function map<I extends UnknownResultMaybeAsync, O>(
  callback: (value: InferSuccess<I>) => O,
): Combinator<I, O, InferError<I>>

export function map(callback: (value: unknown) => unknown) {
  return flatMap((value: unknown) => ok(callback(value)))
}

/**
 * Transform the error value, leaving success untouched.
 *
 * **Details**
 *
 * `mapError` only changes the error channel. This is useful for enriching
 * errors or converting to a common error type while preserving success values.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.error("boom"),
 *   Result.mapError((e) => new Error(e))
 * )
 * ```
 *
 * @category Combinators
 */
export function mapError<I extends UnknownResultMaybeAsync, O>(
  callback: (error: InferError<I>) => O,
): Combinator<I, InferSuccess<I>, O>

export function mapError(callback: (value: unknown) => unknown) {
  return orElseFail(callback)
}

/**
 * Run a side effect on success without changing the value.
 *
 * **Details**
 *
 * `tap` lets you observe the `Ok` value, including async effects, while keeping
 * the original `Result` unchanged.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(1),
 *   Result.tap((n) => {
 *     console.log(n)
 *   })
 * )
 * ```
 *
 * @category Combinators
 */
export function tap<I extends UnknownResultMaybeAsync>(
  callback: (value: InferSuccess<I>) => void | Promise<void>,
): Combinator<I, InferSuccess<I>, InferError<I>>

export function tap(callback: (value: unknown) => void | Promise<void>) {
  return flatMap((value: unknown) => {
    const next = callback(value)
    if (!(next instanceof Promise)) return ok(value)
    return next.then<UnknownResult>(() => ok(value))
  })
}

/**
 * Run a side effect on error without changing the result.
 *
 * **Details**
 *
 * `tapError` only runs when the result is `Error`. The error is re-propagated
 * unchanged.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.error("boom"),
 *   Result.tapError((e) => {
 *     console.error(e)
 *   })
 * )
 * ```
 *
 * @category Combinators
 */
export function tapError<I extends UnknownResultMaybeAsync>(
  callback: (error: InferError<I>) => void | Promise<void>,
): Combinator<I, InferSuccess<I>, InferError<I>>

export function tapError(callback: (value: unknown) => void | Promise<void>) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    const next = callback(result.error)
    if (!(next instanceof Promise)) return result
    return next.then<UnknownResult>(() => result)
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Run a side effect when the error matches a tag.
 *
 * **Details**
 *
 * `tapErrorTag` is like `tapError` but only for errors with a specific `tag`.
 * It does nothing when the tag does not match.
 *
 * **Example**
 *
 * ```ts
 * class NotFound {
 *   readonly tag = "NotFound"
 * }
 *
 * const out = pipe(
 *   Result.error(new NotFound()),
 *   Result.tapErrorTag("NotFound", (e) => {
 *     console.log(e.tag)
 *   })
 * )
 * ```
 *
 * @category Combinators
 */
export function tapErrorTag<
  I extends UnknownResultMaybeAsync,
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
    if (!isTagged(result.error, tag)) return result
    const next = callback(result.error)
    if (!(next instanceof Promise)) return result
    return next.then<UnknownResult>(() => result)
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Keep the success value when it matches a predicate, otherwise replace it.
 *
 * **Details**
 *
 * This combinator never fails. If the predicate is false, it replaces the
 * success value with the `orElse` value. Errors pass through unchanged.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(-1),
 *   Result.filterOrElse((n) => n > 0, () => 0)
 * )
 * ```
 *
 * @category Combinators
 */
export function filterOrElse<I extends UnknownResultMaybeAsync, O>(
  predicate: (value: InferSuccess<I>) => boolean,
  orElse: () => O,
): Combinator<I, InferSuccess<I> | O, InferError<I>>

export function filterOrElse(
  predicate: (value: unknown) => unknown,
  orElse: () => unknown,
) {
  return flatMap((value: unknown) =>
    predicate(value) ? ok(value) : ok(orElse()),
  )
}

/**
 * Keep the success value when it matches a predicate, otherwise fail.
 *
 * **Details**
 *
 * Use this when a success value needs validation. If the predicate fails, the
 * result becomes `Error` using `orFailWith`.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(-1),
 *   Result.filterOrFail((n) => n > 0, () => "bad")
 * )
 * ```
 *
 * @category Combinators
 */
export function filterOrFail<I extends UnknownResultMaybeAsync, O>(
  predicate: (value: InferSuccess<I>) => boolean,
  orFailWith: (value: InferSuccess<I>) => O,
): Combinator<I, InferSuccess<I>, InferError<I> | O>

export function filterOrFail(
  predicate: (value: unknown) => unknown,
  orFailWith: (value: unknown) => unknown,
) {
  return flatMap((value: unknown) =>
    predicate(value) ? ok(value) : error(orFailWith(value)),
  )
}

/**
 * Keep the success value when it matches a predicate, otherwise throw.
 *
 * **Details**
 *
 * This is the escape hatch for values that must not continue. It throws instead
 * of returning `Error`.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(-1),
 *   Result.filterOrDie((n) => n > 0, () => {
 *     throw new Error("bad")
 *   })
 * )
 * ```
 *
 * @category Combinators
 */
export function filterOrDie<I extends UnknownResultMaybeAsync>(
  predicate: (value: InferSuccess<I>) => boolean,
  orDie: () => never,
): Combinator<I, InferSuccess<I>, InferError<I>>

export function filterOrDie(
  predicate: (value: unknown) => unknown,
  orDie: () => never,
) {
  return flatMap((value: unknown) => (predicate(value) ? ok(value) : orDie()))
}

/**
 * Handle all errors by mapping them to a new `Result`.
 *
 * **Details**
 *
 * `catchAll` lets you recover from any error by returning a new `Result`.
 * This removes the error channel by mapping to `Ok` or a new `Error` type.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.error("boom"),
 *   Result.catchAll((e) => Result.ok(`recover: ${e}`))
 * )
 * ```
 *
 * @category Combinators
 */
export function catchAll<
  I extends UnknownResultMaybeAsync,
  O extends ResultMaybeAsync<unknown, never>,
>(
  handle: (error: InferError<I>) => O,
): Combinator<I | O, InferSuccess<I> | InferSuccess<O>, never>

export function catchAll(handle: (error: unknown) => UnknownResultMaybeAsync) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    return handle(result.error)
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Handle errors that satisfy a type guard.
 *
 * **Details**
 *
 * `catchIf` lets you recover from a subset of errors while preserving the
 * remaining error types.
 *
 * **Example**
 *
 * ```ts
 * const isNotFound = (e: Error): e is Error => e.message === "404"
 *
 * const out = pipe(
 *   Result.error(new Error("404")),
 *   Result.catchIf(isNotFound, () => Result.ok("default"))
 * )
 * ```
 *
 * @category Combinators
 */
export function catchIf<
  I extends UnknownResultMaybeAsync,
  E extends InferError<I>,
  O extends UnknownResultMaybeAsync,
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
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Handle some errors by returning a new `Result`, or `undefined` to ignore.
 *
 * **Details**
 *
 * `catchSome` is a partial handler. Return `undefined` to keep the original
 * error, or return a `Result` to recover.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.error("skip"),
 *   Result.catchSome((e) => (e === "skip" ? Result.ok(0) : undefined))
 * )
 * ```
 *
 * @category Combinators
 */
export function catchSome<
  I extends UnknownResultMaybeAsync,
  O extends UnknownResultMaybeAsync,
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
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Handle a tagged error with a specific `tag` value.
 *
 * **Details**
 *
 * If the error tag does not match, the original error passes through.
 *
 * **Example**
 *
 * ```ts
 * class NotFound {
 *   readonly tag = "NotFound"
 * }
 *
 * const out = pipe(
 *   Result.error(new NotFound()),
 *   Result.catchTag("NotFound", () => Result.ok("default"))
 * )
 * ```
 *
 * @category Combinators
 */
export function catchTag<
  I extends UnknownResultMaybeAsync,
  O extends UnknownResultMaybeAsync,
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
  I extends UnknownResultMaybeAsync,
  O extends UnknownResultMaybeAsync,
  T extends InferErrorTags<I>,
>(tag: T, handle: BivariantHandler<Tagged<T>, O>) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    if (!isTagged(result.error, tag)) return result
    return handle(result.error)
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Handle tagged errors with a handler map keyed by `tag`.
 *
 * **Details**
 *
 * Each key maps to a handler for that tag. Errors with no handler pass through.
 *
 * **Example**
 *
 * ```ts
 * class NotFound {
 *   readonly tag = "NotFound"
 * }
 * class Unauthorized {
 *   readonly tag = "Unauthorized"
 * }
 *
 * const out = pipe(
 *   Result.error(new NotFound()),
 *   Result.catchTags({
 *     NotFound: () => Result.ok("default"),
 *     Unauthorized: () => Result.error("nope"),
 *   })
 * )
 * ```
 *
 * @category Combinators
 */
export function catchTags<
  I extends ResultMaybeAsync<unknown, Tagged<string>>,
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
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Recover from errors by switching to another `Result`.
 *
 * **Details**
 *
 * `orElse` is like `catchAll` but keeps the error channel of the fallback
 * `Result`.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.error("boom"),
 *   Result.orElse(() => Result.ok(0))
 * )
 * ```
 *
 * @category Combinators
 */
export function orElse<
  I extends UnknownResultMaybeAsync,
  O extends UnknownResultMaybeAsync,
>(
  handle: (error: InferError<I>) => O,
): Combinator<I | O, InferSuccess<I> | InferSuccess<O>, InferError<O>>

export function orElse(handle: (error: unknown) => UnknownResultMaybeAsync) {
  function apply(result: UnknownResult) {
    if (isOk(result)) return result
    return handle(result.error)
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Map errors into a new error value.
 *
 * **Details**
 *
 * `orElseFail` keeps success values, but replaces any error with a new one.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.error("boom"),
 *   Result.orElseFail((e) => new Error(e))
 * )
 * ```
 *
 * @category Combinators
 */
export function orElseFail<I extends UnknownResultMaybeAsync, O>(
  mapError: (error: InferError<I>) => O,
): Combinator<I, InferSuccess<I>, O>

export function orElseFail(mapError: (value: unknown) => unknown) {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    return error(mapError(result.error))
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Turn an error into a success value.
 *
 * **Details**
 *
 * `orElseSucceed` removes the error channel by mapping errors to a success
 * value.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.error("boom"),
 *   Result.orElseSucceed(() => 0)
 * )
 * ```
 *
 * @category Combinators
 */
export function orElseSucceed<I extends UnknownResultMaybeAsync, O>(
  value: (error: InferError<I>) => O,
): Combinator<I, InferSuccess<I> | O, never>

export function orElseSucceed(value: (error: unknown) => unknown) {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    return ok(value(result.error))
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Convert errors into thrown exceptions.
 *
 * **Details**
 *
 * `orDie` rethrows the error value. Use only when you want to crash on failures
 * or delegate error handling to an outer boundary.
 *
 * @category Combinators
 */
export function orDie<I extends UnknownResultMaybeAsync>(): Combinator<
  I,
  InferSuccess<I>,
  never
>

export function orDie() {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    throw result.error
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/**
 * Convert errors into thrown exceptions using a mapper.
 *
 * **Details**
 *
 * `orDieWith` lets you normalize error values before throwing.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.error("boom"),
 *   Result.orDieWith((e) => new Error(e))
 * )
 * ```
 *
 * @category Combinators
 */
export function orDieWith<I extends UnknownResultMaybeAsync, O>(
  mapError: (error: InferError<I>) => O,
): Combinator<I, InferSuccess<I>, never>

export function orDieWith(mapError: (error: unknown) => unknown) {
  function apply(result: UnknownResult): UnknownResult {
    if (isOk(result)) return result
    throw mapError(result.error)
  }
  return (result: UnknownResultMaybeAsync) => applyMaybeAsync(result, apply)
}

/** The Standard Typed interface. This is a base type extended by other specs. */
interface StandardTypedV1<Input = unknown, Output = Input> {
  /** The Standard properties. */
  readonly "~standard": StandardTypedV1.Props<Input, Output>
}

declare namespace StandardTypedV1 {
  /** The Standard Typed properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1
    /** The vendor name of the schema library. */
    readonly vendor: string
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined
  }

  /** The Standard Typed types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input
    /** The output type of the schema. */
    readonly output: Output
  }

  /** Infers the input type of a Standard Typed. */
  export type InferInput<Schema extends StandardTypedV1> = NonNullable<
    Schema["~standard"]["types"]
  >["input"]

  /** Infers the output type of a Standard Typed. */
  export type InferOutput<Schema extends StandardTypedV1> = NonNullable<
    Schema["~standard"]["types"]
  >["output"]
}

/** The Standard Schema interface. */
interface StandardSchemaV1<Input = unknown, Output = Input> {
  /** The Standard Schema properties. */
  readonly "~standard": StandardSchemaV1.Props<Input, Output>
}

declare namespace StandardSchemaV1 {
  /** The Standard Schema properties interface. */
  export interface Props<Input = unknown, Output = Input>
    extends StandardTypedV1.Props<Input, Output> {
    /** Validates unknown input values. */
    readonly validate: (
      value: unknown,
      options?: StandardSchemaV1.Options | undefined,
    ) => Result<Output> | Promise<Result<Output>>
  }

  /** The result interface of the validate function. */
  export type Result<Output> = SuccessResult<Output> | FailureResult

  /** The result interface if validation succeeds. */
  export interface SuccessResult<Output> {
    /** The typed output value. */
    readonly value: Output
    /** A falsy value for `issues` indicates success. */
    readonly issues?: undefined
  }

  export interface Options {
    /** Explicit support for additional vendor-specific parameters, if needed. */
    readonly libraryOptions?: Record<string, unknown> | undefined
  }

  /** The result interface if validation fails. */
  export interface FailureResult {
    /** The issues of failed validation. */
    readonly issues: ReadonlyArray<Issue>
  }

  /** The issue interface of the failure output. */
  export interface Issue {
    /** The error message of the issue. */
    readonly message: string
    /** The path of the issue, if any. */
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined
  }

  /** The path segment interface of the issue. */
  export interface PathSegment {
    /** The key representing a path segment. */
    readonly key: PropertyKey
  }

  /** The Standard types interface. */
  export interface Types<Input = unknown, Output = Input>
    extends StandardTypedV1.Types<Input, Output> {}

  /** Infers the input type of a Standard. */
  export type InferInput<Schema extends StandardTypedV1> =
    StandardTypedV1.InferInput<Schema>

  /** Infers the output type of a Standard. */
  export type InferOutput<Schema extends StandardTypedV1> =
    StandardTypedV1.InferOutput<Schema>
}

export class SchemaError extends TaggedError("SchemaError") {
  constructor(public issues: ReadonlyArray<StandardSchemaV1.Issue>) {
    const first = issues[0]
    const message = first ? first.message : "Schema error"
    super(message)
  }
}

function validationToResult<Output>(
  validation: StandardSchemaV1.Result<Output>,
): Result<Output, SchemaError> {
  if (!validation.issues) return ok(validation.value)
  return error(new SchemaError(validation.issues))
}

function validateMaybeAsync<S extends StandardSchemaV1>(
  schema: S,
  value: unknown,
): ResultMaybeAsync<StandardSchemaV1.InferOutput<S>, SchemaError> {
  const validation = schema["~standard"].validate(value)
  if (validation instanceof Promise) {
    return validation.then(validationToResult)
  }
  return validationToResult(validation)
}

function foldValidation<Output, A, E>(
  validation: ResultMaybeAsync<Output, SchemaError>,
  onError: (error: SchemaError) => ResultMaybeAsync<A, E>,
): ResultMaybeAsync<Output | A, E> {
  if (validation instanceof Promise) {
    return validation.then((result) => {
      if (isError(result)) return onError(result.error)
      return result
    })
  }
  if (isError(validation)) return onError(validation.error)
  return validation
}

/**
 * Validate the success value with a Standard Schema.
 *
 * **Details**
 *
 * On success, returns the schema output. On validation failure, returns a
 * `SchemaError`.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(input),
 *   Result.schema(userSchema)
 * )
 * ```
 *
 * @category Combinators
 */
export function schema<
  S extends StandardSchemaV1,
  I extends UnknownResultMaybeAsync,
  O,
>(
  schema: S,
): Combinator<I, StandardSchemaV1.InferOutput<S>, InferError<I> | SchemaError>

export function schema(schema: StandardSchemaV1) {
  return flatMap((value: unknown) => validateMaybeAsync(schema, value))
}

/**
 * Validate the success value or replace it on schema failure.
 *
 * **Details**
 *
 * If validation fails, returns the fallback value from `orElse`. Errors pass
 * through unchanged.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(input),
 *   Result.schemaOrElse(userSchema, () => defaultUser)
 * )
 * ```
 *
 * @category Combinators
 */
export function schemaOrElse<
  S extends StandardSchemaV1,
  I extends UnknownResultMaybeAsync,
  O,
>(schema: S, orElse: () => O): Combinator<I, InferSuccess<I> | O, InferError<I>>

export function schemaOrElse(schema: StandardSchemaV1, orElse: () => unknown) {
  return flatMap((value: unknown) =>
    foldValidation(validateMaybeAsync(schema, value), () => ok(orElse())),
  )
}

/**
 * Validate the success value or fail with a new error on schema failure.
 *
 * **Details**
 *
 * If validation fails, the result becomes `Error` using `orFailWith`. Errors
 * pass through unchanged.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(input),
 *   Result.schemaOrFail(userSchema, () => new Error("invalid"))
 * )
 * ```
 *
 * @category Combinators
 */
export function schemaOrFail<
  S extends StandardSchemaV1,
  I extends UnknownResultMaybeAsync,
  O,
>(
  schema: S,
  orFailWith: () => O,
): Combinator<I, StandardSchemaV1.InferOutput<S>, InferError<I> | O>

export function schemaOrFail(
  schema: StandardSchemaV1,
  orFailWith: () => unknown,
) {
  return flatMap((value: unknown) =>
    foldValidation(validateMaybeAsync(schema, value), () =>
      error(orFailWith()),
    ),
  )
}

/**
 * Validate the success value or throw on schema failure.
 *
 * **Details**
 *
 * This is the escape hatch for invalid values. If validation fails, `orDie`
 * is invoked and the error is thrown.
 *
 * **Example**
 *
 * ```ts
 * const out = pipe(
 *   Result.ok(input),
 *   Result.schemaOrDie(userSchema, () => {
 *     throw new Error("invalid")
 *   })
 * )
 * ```
 *
 * @category Combinators
 */
export function schemaOrDie<
  S extends StandardSchemaV1,
  I extends UnknownResultMaybeAsync,
>(
  schema: S,
  orDie: () => never,
): Combinator<I, StandardSchemaV1.InferOutput<S>, InferError<I>>

export function schemaOrDie(schema: StandardSchemaV1, orDie: () => never) {
  return flatMap((value: unknown) =>
    foldValidation(validateMaybeAsync(schema, value), () => orDie()),
  )
}
