import * as Result from "../"

export class AssertionError extends Result.TaggedError("AssertionError") {
  constructor(value: unknown) {
    super("Assertion failed", { cause: value })
  }
}

export function assertResult(
  value: unknown,
): asserts value is Result.Result<unknown, unknown> {
  if (!Result.isResult(value)) throw new AssertionError(value)
}

export function assertSuccess(
  value: unknown,
): asserts value is Result.Ok<unknown> {
  if (!Result.isOk(value)) throw new AssertionError(value)
}

export function assertFailure(
  value: unknown,
): asserts value is Result.Error<unknown> {
  if (!Result.isError(value)) throw new AssertionError(value)
}
