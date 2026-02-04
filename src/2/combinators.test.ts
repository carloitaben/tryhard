import { describe, expect, test } from "bun:test"
import * as Result from "./tryhard"

const wrapped = Result.wrap(() => 1)
const wrappedPromise = Result.wrap(async () => Promise.resolve(1))

describe(Result.wrap.name, () => {
  test("sync", () => {
    const result = wrapped()
    expect(result).not.toBeInstanceOf(Promise)
    expect(result.type).toBe("success")
    Result.assertSuccess(result)
    expect(result.value).toBe(1)
  })
  test("async", async () => {
    const promise = wrappedPromise()
    expect(promise).toBeInstanceOf(Promise)
    const result = await promise
    expect(result.type).toBe("success")
    Result.assertSuccess(result)
    expect(result.value).toBe(1)
  })
})

describe(Result.flatMap.name, () => {
  test("sync", () => {
    const result = Result.pipe(
      wrapped(),
      Result.flatMap((value) => Result.success(value.toString())),
    )
    expect(result).not.toBeInstanceOf(Promise)
    expect(result.type).toBe("success")
    if (result.type === "success") {
      result.value
    } else {
      result.error
    }
    Result.assertSuccess(result)
    expect(result.value).toBe("1")
  })
  test("async", async () => {
    const pipeline = Result.pipe(
      wrappedPromise(),
      Result.flatMap(async (value) => Result.success(value.toString())),
    )
    expect(pipeline).toBeInstanceOf(Promise)
    const result = await pipeline
    if (result.type === "success") {
      result.value
    } else {
      result.error
    }

    expect(result.type).toBe("success")
    Result.assertSuccess(result)
    expect(result.value).toBe("1")
  })
})

describe(Result.map.name, () => {
  test("sync", () => {
    const result = Result.pipe(
      wrapped(),
      Result.map((value) => value.toString()),
    )

    expect(result).not.toBeInstanceOf(Promise)
    expect(result.type).toBe("success")
    if (result.type === "success") {
      result.value
    } else {
      result.error
    }
    Result.assertSuccess(result)
    expect(result.value).toBe("1")
  })
  test("async", async () => {
    const pipeline = Result.pipe(
      wrappedPromise(),
      Result.map((value) => value.toString()),
    )
    expect(pipeline).toBeInstanceOf(Promise)
    const result = await pipeline
    expect(result.type).toBe("success")
    Result.assertSuccess(result)
    expect(result.value).toBe("1")
  })
})
