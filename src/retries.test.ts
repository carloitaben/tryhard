import { describe, expect, test, vi } from "bun:test"
import * as Result from "./result"
import { eventually, retry } from "./retries"

describe(retry.name, () => {
  test("sync retries", () => {
    let attempts = 0
    const result = retry(
      () => {
        attempts += 1
        return attempts < 3 ? Result.error("no") : Result.ok("yes")
      },
      { times: 3 },
    )
    expect(result).toEqual(Result.ok("yes"))
    expect(attempts).toBe(3)
  })

  test("times predicate short-circuit", () => {
    let attempts = 0
    const result = retry(
      () => {
        attempts += 1
        return Result.error("no")
      },
      {
        times: ({ attempt }) => attempt < 1,
      },
    )
    expect(result).toEqual(Result.error("no"))
    expect(attempts).toBe(2)
  })

  test("delay function called", () => {
    let attempts = 0
    const delay = vi.fn(() => 0)
    const result = retry(
      () => {
        attempts += 1
        return attempts < 2 ? Result.error("no") : Result.ok("yes")
      },
      { times: 2, delay },
    )
    expect(result).toEqual(Result.ok("yes"))
    expect(delay).toHaveBeenCalledTimes(1)
    expect(delay).toHaveBeenCalledWith({ attempt: 0, error: "no" })
  })

  test("async effect", () => {
    let attempts = 0
    const result = retry(
      async () => {
        attempts += 1
        return attempts < 2 ? Result.error("no") : Result.ok("yes")
      },
      { times: 2 },
    )
    expect(result).resolves.toEqual(Result.ok("yes"))
  })
})

describe(eventually.name, () => {
  test("retries forever", () => {
    let attempts = 0
    const result = eventually(() => {
      attempts += 1
      return attempts < 3 ? Result.error("no") : Result.ok("yes")
    })
    expect(result).toEqual(Result.ok("yes"))
    expect(attempts).toBe(3)
  })
})
