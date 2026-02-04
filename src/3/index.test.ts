import { describe, expect, test } from "bun:test"
import { pipe } from "./pipe"
import * as Result from "./tryhard"

const wrapped = Result.wrap(() => 1)
const wrappedPromise = Result.wrap(async () => Promise.resolve(1))

function expectResultOk<A, E>(
  result: Result.Result<A, E>,
): asserts result is Result.Ok<A> {
  expect(result.type).toBe("ok")
}

describe(Result.wrap.name, () => {
  test("sync", () => {
    const result = wrapped()
    expect(result).not.toBeInstanceOf(Promise)
    expectResultOk(result)
    expect(result.value).toBe(1)
  })
  test("async", async () => {
    const promise = wrappedPromise()
    expect(promise).toBeInstanceOf(Promise)
    const result = await promise
    expectResultOk(result)
    expect(result.value).toBe(1)
  })
})

describe(Result.flatMap.name, () => {
  test("sync", () => {
    const result = pipe(
      wrapped(),
      Result.flatMap((value) => Result.ok(value.toString())),
    )
    expect(result).not.toBeInstanceOf(Promise)
    expectResultOk(result)
    expect(result.value).toBe("1")
  })
  test("async", async () => {
    const pipeline = pipe(
      wrappedPromise(),
      Result.flatMap(async (value) => Result.ok(value.toString())),
    )
    expect(pipeline).toBeInstanceOf(Promise)
    const result = await pipeline
    if (result.type === "ok") {
      result.value
    } else {
      result.error
    }

    expectResultOk(result)
    expect(result.value).toBe("1")
  })
})

describe(Result.map.name, () => {
  test("sync", () => {
    const result = pipe(
      wrapped(),
      Result.map((value) => value.toString()),
    )

    expect(result).not.toBeInstanceOf(Promise)
    expectResultOk(result)
    expect(result.value).toBe("1")
  })
  test("async", async () => {
    const pipeline = pipe(
      wrappedPromise(),
      Result.map((value) => value.toString()),
    )
    expect(pipeline).toBeInstanceOf(Promise)
    const result = await pipeline
    expectResultOk(result)
    expect(result.value).toBe("1")
  })
})
