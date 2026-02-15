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
 * const r1 = ok()
 * const r2 = ok(123)
 * const r3 = ok(Promise.resolve("done"))
 * ```
 *
 * @category Constructors
 */
export function ok(value?: unknown): UnknownResultMaybeAsync {
  if (value instanceof Promise) {
    return value.then<UnknownResult>(ok)
  }

  return {
    type: "ok",
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
 * const r1 = error("boom")
 * const r2 = error(Promise.resolve(new Error("boom")))
 * ```
 *
 * @category Constructors
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

export class AssertionError extends Error {
  constructor(type: string, value: unknown) {
    super(`Assertion failed. Expected value of type ${type}`, { cause: value })
  }
}

/**
 * Check if a value is a `Result`.
 *
 * **Details**
 *
 * A value is a `Result` if it has a `type` discriminator and the corresponding
 * payload (`value` for ok, `error` for error).
 *
 * @category Guards
 */
export function isResult(value: unknown): value is Result<unknown, unknown> {
  if (value && typeof value === "object" && "type" in value) {
    if (value.type === "ok") return "value" in value
    if (value.type === "error") return "error" in value
  }
  return false
}

/**
 * Asserts that a value is a `Result`.
 *
 * **Details**
 *
 * A value is a `Result` if it has a `type` discriminator and the corresponding
 * payload (`value` for ok, `error` for error).
 *
 * @category Guards
 */
export function assertResult(
  value: unknown,
): asserts value is Result<unknown, unknown> {
  if (!isResult(value)) throw new AssertionError("Result.Result", value)
}

/**
 * Check if a value is `Ok`.
 *
 * **Details**
 *
 * A value is `Ok` if it has a `type` discriminator of `ok` and the
 * corresponding `value` payload.
 *
 * @category Guards
 */
export function isOk(value: unknown): value is Ok<unknown> {
  return isResult(value) && value.type === "ok"
}

/**
 * Asserts that a value is `Ok`.
 *
 * **Details**
 *
 * A value is `Ok` if it has a `type` discriminator of `ok` and the
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
 * A value is `Error` if it has a `type` discriminator of `error` and the
 * corresponding `error` payload.
 *
 * @category Guards
 */
export function isError(value: unknown): value is Error<unknown> {
  return isResult(value) && value.type === "error"
}

/**
 * Asserts that a value is `Error`.
 *
 * **Details**
 *
 * A value is `Error` if it has a `type` discriminator of `error` and the
 * corresponding `error` payload.
 *
 * @category Guards
 */
export function assertError(value: unknown): asserts value is Error<unknown> {
  if (!isError(value)) throw new AssertionError("Result.Error", value)
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

function applyMaybeAsync(
  result: UnknownResultMaybeAsync,
  apply: (result: UnknownResult) => UnknownResultMaybeAsync,
): UnknownResultMaybeAsync {
  return result instanceof Promise ? result.then(apply) : apply(result)
}

/**
 * Create a tagged error class compatible with `Result` error values.
 *
 * **Details**
 *
 * The class includes a `tag` for pattern matching and conforms to the
 * `{ type: "error", error }` shape used by `Result`. This makes it a good fit
 * for tag-based combinators.
 *
 * **Example**
 *
 * ```ts
 * const NotFound = TaggedError("NotFound")
 * const err = new NotFound("missing")
 * ```
 *
 * @category Errors
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
 * const parse = try((s: string) => JSON.parse(s))
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
 * const fetchJson = tryPromise(async () => {
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
 *   const n = yield* yieldResult(ok(1))
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
 *   const n = yield* yieldAsync(ok(1))
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
 *   const n = yield* yieldResult(ok(1))
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
 *   n > 0 ? ok(n - 1) : error("bad")
 *
 * const out = pipe(
 *   ok(3),
 *   flatMap(applyDiscount)
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
 *   ok(1),
 *   map((n) => n + 1)
 * )
 * ```
 *
 * @category Combinators
 */
export function map<I extends UnknownResultMaybeAsync, O>(
  callback: (value: InferSuccess<I>) => O,
): Combinator<I, O, InferError<I>>

export function map(callback: (value: unknown) => unknown) {
  const combinator = flatMap((value: unknown) => ok(callback(value)))
  return combinator
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
 *   error("boom"),
 *   mapError((e) => new Error(e))
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
 *   ok(1),
 *   tap((n) => {
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
  const combinator = flatMap((value: unknown) => {
    const next = callback(value)
    if (!(next instanceof Promise)) return ok(value)
    return next.then<UnknownResult>(() => ok(value))
  })
  return combinator
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
 *   error("boom"),
 *   tapError((e) => {
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
 *   error(new NotFound()),
 *   tapErrorTag("NotFound", (e) => {
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
 *   ok(-1),
 *   filterOrElse((n) => n > 0, () => 0)
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
  const combinator = flatMap((value: unknown) =>
    predicate(value) ? ok(value) : ok(orElse()),
  )
  return combinator
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
 *   ok(-1),
 *   filterOrFail((n) => n > 0, () => "bad")
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
  const combinator = flatMap((value: unknown) =>
    predicate(value) ? ok(value) : error(orFailWith(value)),
  )
  return combinator
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
 *   ok(-1),
 *   filterOrDie((n) => n > 0, () => {
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
  const combinator = flatMap((value: unknown) =>
    predicate(value) ? ok(value) : orDie(),
  )
  return combinator
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
 *   error("boom"),
 *   catchAll((e) => ok(`recover: ${e}`))
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
 *   error(new Error("404")),
 *   catchIf(isNotFound, () => ok("default"))
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
 *   error("skip"),
 *   catchSome((e) => (e === "skip" ? ok(0) : undefined))
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
 *   error(new NotFound()),
 *   catchTag("NotFound", () => ok("default"))
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
 *   error(new NotFound()),
 *   catchTags({
 *     NotFound: () => ok("default"),
 *     Unauthorized: () => error("nope"),
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
 *   error("boom"),
 *   orElse(() => ok(0))
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
 *   error("boom"),
 *   orElseFail((e) => new Error(e))
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
 *   error("boom"),
 *   orElseSucceed(() => 0)
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
 *   error("boom"),
 *   orDieWith((e) => new Error(e))
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
