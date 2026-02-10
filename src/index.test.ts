import { describe, test, expect, vi, expectTypeOf } from "bun:test"
import { pipe } from "./pipe"
import * as Result from "./index"

describe(Result.flatMap.name, () => {
  test("sync", () => {
    const ok = pipe(
      Result.ok(1),
      Result.flatMap((value) => Result.ok(value.toString())),
    )
    expect(ok).toEqual(Result.ok("1"))
    expectTypeOf(ok).toEqualTypeOf<Result.Result<string, never>>()

    const error = pipe(
      Result.error(1),
      Result.flatMap(() => Result.ok("1")),
    )
    expect(error).toEqual(Result.error(1))
    expectTypeOf(error).toEqualTypeOf<Result.Result<string, number>>()
  })
  test("async", () => {
    const ok = pipe(
      Result.ok(Promise.resolve(1)),
      Result.flatMap((value) => Result.ok(value.toString())),
    )
    expect(ok).resolves.toEqual(Result.ok("1"))
    expectTypeOf(ok).toEqualTypeOf<Result.ResultAsync<string, never>>()

    const error = pipe(
      Result.error(Promise.resolve(1)),
      Result.flatMap(() => Result.ok("1")),
    )
    expect(error).resolves.toEqual(Result.error(1))
    expectTypeOf(error).toEqualTypeOf<Result.ResultAsync<string, number>>()
  })
})

describe(Result.tap.name, () => {
  test("sync", () => {
    const fn = vi.fn()
    const result = pipe(Result.ok(1), Result.tap(fn))
    expect(result).toEqual(Result.ok(1))
    expectTypeOf(result).toEqualTypeOf<Result.Result<number, never>>()
    expect(fn).toHaveBeenCalledWith(1)
  })
  test("async", () => {
    const fn = vi.fn()
    const result = pipe(Result.ok(Promise.resolve(1)), Result.tap(fn))
    expect(result).resolves.toEqual(Result.ok(1))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<number, never>>()
    expect(fn).toHaveBeenCalledWith(1)
  })
})

describe(Result.tapError.name, () => {
  test("sync", () => {
    const fn = vi.fn()
    const result = pipe(Result.error(1), Result.tapError(fn))
    expect(result).toEqual(Result.error(1))
    expectTypeOf(result).toEqualTypeOf<Result.Result<never, number>>()
    expect(fn).toHaveBeenCalledWith(1)
  })
  test("async", () => {
    const fn = vi.fn()
    const result = pipe(Result.error(Promise.resolve(1)), Result.tapError(fn))
    expect(result).resolves.toEqual(Result.error(1))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<never, number>>()
    expect(fn).toHaveBeenCalledWith(1)
  })
})

describe(Result.map.name, () => {
  test("sync", () => {
    const result = pipe(
      Result.ok(1),
      Result.map((value) => value.toString()),
    )
    expect(result).toEqual(Result.ok("1"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<string, never>>()
  })
  test("async", () => {
    const result = pipe(
      Result.ok(Promise.resolve(1)),
      Result.map((value) => value.toString()),
    )
    expect(result).resolves.toEqual(Result.ok("1"))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<string, never>>()
  })
})

describe(Result.mapError.name, () => {
  test("sync", () => {
    const result = pipe(
      Result.error(1),
      Result.mapError((value) => value.toString()),
    )
    expect(result).toEqual(Result.error("1"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<never, string>>()
  })
  test("async", () => {
    const result = pipe(
      Result.error(Promise.resolve(1)),
      Result.mapError((value) => value.toString()),
    )
    expect(result).resolves.toEqual(Result.error("1"))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<never, string>>()
  })
})

describe(Result.filterOrElse.name, () => {
  test("sync", () => {
    const kept = pipe(
      Result.ok(2),
      Result.filterOrElse(
        (value) => value > 1,
        () => "fallback",
      ),
    )
    expect(kept).toEqual(Result.ok(2))
    expectTypeOf(kept).toEqualTypeOf<Result.Result<number | string, never>>()

    const replaced = pipe(
      Result.ok(0),
      Result.filterOrElse(
        (value) => value > 1,
        () => "fallback",
      ),
    )
    expect(replaced).toEqual(Result.ok("fallback"))
    expectTypeOf(replaced).toEqualTypeOf<
      Result.Result<number | string, never>
    >()

    const error = pipe(
      Result.error(1),
      Result.filterOrElse(
        (value) => value > 1,
        () => "fallback",
      ),
    )
    expect(error).toEqual(Result.error(1))
    expectTypeOf(error).toEqualTypeOf<Result.Result<string, number>>()
  })
  test("async", () => {
    const kept = pipe(
      Result.ok(Promise.resolve(2)),
      Result.filterOrElse(
        (value) => value > 1,
        () => "fallback",
      ),
    )
    expect(kept).resolves.toEqual(Result.ok(2))
    expectTypeOf(kept).toEqualTypeOf<
      Result.ResultAsync<number | string, never>
    >()

    const replaced = pipe(
      Result.ok(Promise.resolve(0)),
      Result.filterOrElse(
        (value) => value > 1,
        () => "fallback",
      ),
    )
    expect(replaced).resolves.toEqual(Result.ok("fallback"))
    expectTypeOf(replaced).toEqualTypeOf<
      Result.ResultAsync<number | string, never>
    >()

    const error = pipe(
      Result.error(Promise.resolve(1)),
      Result.filterOrElse(
        (value) => value > 1,
        () => "fallback",
      ),
    )
    expect(error).resolves.toEqual(Result.error(1))
    expectTypeOf(error).toEqualTypeOf<Result.ResultAsync<string, number>>()
  })
})

describe(Result.filterOrDie.name, () => {
  test("sync", () => {
    const kept = pipe(
      Result.ok(2),
      Result.filterOrDie(
        (value) => value > 1,
        () => {
          throw new Error("die")
        },
      ),
    )
    expect(kept).toEqual(Result.ok(2))
    expectTypeOf(kept).toEqualTypeOf<Result.Result<number, never>>()

    expect(() =>
      pipe(
        Result.ok(0),
        Result.filterOrDie(
          (value) => value > 1,
          () => {
            throw new Error("die")
          },
        ),
      ),
    ).toThrow("die")

    const error = pipe(
      Result.error("boom"),
      Result.filterOrDie(
        (value) => value > 1,
        () => {
          throw new Error("die")
        },
      ),
    )
    expect(error).toEqual(Result.error("boom"))
    expectTypeOf(error).toEqualTypeOf<Result.Result<never, string>>()
  })
  test("async", () => {
    const kept = pipe(
      Result.ok(Promise.resolve(2)),
      Result.filterOrDie(
        (value) => value > 1,
        () => {
          throw new Error("die")
        },
      ),
    )
    expect(kept).resolves.toEqual(Result.ok(2))
    expectTypeOf(kept).toEqualTypeOf<Result.ResultAsync<number, never>>()

    const died = pipe(
      Result.ok(Promise.resolve(0)),
      Result.filterOrDie(
        (value) => value > 1,
        () => {
          throw new Error("die")
        },
      ),
    )
    expect(died).rejects.toThrow("die")

    const error = pipe(
      Result.error(Promise.resolve("boom")),
      Result.filterOrDie(
        (value) => value > 1,
        () => {
          throw new Error("die")
        },
      ),
    )
    expect(error).resolves.toEqual(Result.error("boom"))
    expectTypeOf(error).toEqualTypeOf<Result.ResultAsync<never, string>>()
  })
})

describe(Result.filterOrFail.name, () => {
  test("sync", () => {
    const kept = pipe(
      Result.ok(2),
      Result.filterOrFail(
        (value) => value > 1,
        (value) => `bad:${value}`,
      ),
    )
    expect(kept).toEqual(Result.ok(2))
    expectTypeOf(kept).toEqualTypeOf<Result.Result<number, string>>()

    const failed = pipe(
      Result.ok(0),
      Result.filterOrFail(
        (value) => value > 1,
        (value) => `bad:${value}`,
      ),
    )
    expect(failed).toEqual(Result.error("bad:0"))
    expectTypeOf(failed).toEqualTypeOf<Result.Result<number, string>>()

    const error = pipe(
      Result.error(1),
      Result.filterOrFail(
        (value) => value > 1,
        (value) => `bad:${value}`,
      ),
    )
    expect(error).toEqual(Result.error(1))
    expectTypeOf(error).toEqualTypeOf<Result.Result<never, number | string>>()
  })
  test("async", () => {
    const kept = pipe(
      Result.ok(Promise.resolve(2)),
      Result.filterOrFail(
        (value) => value > 1,
        (value) => `bad:${value}`,
      ),
    )
    expect(kept).resolves.toEqual(Result.ok(2))
    expectTypeOf(kept).toEqualTypeOf<Result.ResultAsync<number, string>>()

    const failed = pipe(
      Result.ok(Promise.resolve(0)),
      Result.filterOrFail(
        (value) => value > 1,
        (value) => `bad:${value}`,
      ),
    )
    expect(failed).resolves.toEqual(Result.error("bad:0"))
    expectTypeOf(failed).toEqualTypeOf<Result.ResultAsync<number, string>>()

    const error = pipe(
      Result.error(Promise.resolve(1)),
      Result.filterOrFail(
        (value) => value > 1,
        (value) => `bad:${value}`,
      ),
    )
    expect(error).resolves.toEqual(Result.error(1))
    expectTypeOf(error).toEqualTypeOf<
      Result.ResultAsync<never, number | string>
    >()
  })
})
