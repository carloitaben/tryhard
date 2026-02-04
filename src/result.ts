export class UnknownException extends Error {
  constructor() {
    super()
  }
}

export function success<A>(value: A): Result<A, never> {
  return {
    success: true,
    value,
  }
}

export function fail<E = UnknownException>(error: E): Result<never, E> {
  return {
    success: false,
    error,
  }
}

export type ResultSuccess<A> = {
  success: true
  value: A
}

export type ResultError<E = UnknownException> = {
  success: false
  error: E
}

export type Result<A, E = never> = ResultSuccess<A> | ResultError<E>

export type UnknownResult = Result<unknown, unknown>

export function isResult(value: unknown): value is UnknownResult {
  if (value && typeof value === "object" && "success" in value) {
    return value.success ? "value" in value : "error" in value
  }
  return false
}

export function wrap<
  Args extends unknown[],
  const A,
  const E = UnknownException,
>(callback: (...args: Args) => A, onError?: (error: unknown) => E) {
  return (...args: Args): Result<A, E> => {
    try {
      const result = callback(...args)
      return success(result)
    } catch (error) {
      if (onError) return fail(onError(error))
      return fail(new UnknownException({ cause: error }))
    }
  }
}

export function pipe<A>(value: A | (() => A)): A
export function pipe<A, B>(value: A | (() => A), fn1: (input: A) => B): B
export function pipe<A, B, C>(
  value: A | (() => A),
  fn1: (input: A) => B,
  fn2: (input: B) => C,
): C
export function pipe<A, B, C, D>(
  value: A | (() => A),
  fn1: (input: A) => B,
  fn2: (input: B) => C,
  fn3: (input: C) => D,
): D
export function pipe<A, B, C, D, E>(
  value: A | (() => A),
  fn1: (input: A) => B,
  fn2: (input: B) => C,
  fn3: (input: C) => D,
  fn4: (input: D) => E,
): E
// ... and so on

export function pipe(value: any, ...fns: Function[]): unknown {
  return fns.reduce(
    (acc, fn) => fn(acc),
    typeof value === "function" ? value() : value,
  )
}
