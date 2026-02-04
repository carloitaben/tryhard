import { TaggedError } from "../src/2/error"
import * as Result from "../src/2/result"

export class AssertionError extends TaggedError("AssertionError") {
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
): asserts value is Result.Success<unknown> {
  if (!Result.isSuccess(value)) throw new AssertionError(value)
}

export function assertFailure(
  value: unknown,
): asserts value is Result.Failure<unknown> {
  if (!Result.isFailure(value)) throw new AssertionError(value)
}
