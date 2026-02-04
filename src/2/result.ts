import { UnknownException } from "./error"

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

function fail<E>(error: Promise<E>): ResultAsync<never, E>

function fail<E>(error: E): Result<never, E>

function fail<E>(error: E): ResultMaybeAsync<never, E> {
  if (error instanceof Promise) {
    return error.catch(fail)
  }

  return {
    type: "failure",
    error,
  }
}

export function isResult(value: unknown): value is Result<unknown, unknown> {
  if (value && typeof value === "object" && "type" in value) {
    if (value.type === "success") return "value" in value
    if (value.type === "failure") return "error" in value
  }
  return false
}

export function isSuccess(value: unknown): value is Success<unknown> {
  return isResult(value) && value.type === "success"
}

export function isFailure(value: unknown): value is Failure<unknown> {
  return isResult(value) && value.type === "failure"
}

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
  onError: any = (error: any) => new UnknownException({ cause: error }),
) {
  return (...args: unknown[]) => {
    try {
      const value = callback(...args)
      if (!(value instanceof Promise)) return success(value)
      return value.then(success).catch((error) => fail(onError(error)))
    } catch (error) {
      return fail(onError(error))
    }
  }
}
