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

describe(Result.tapErrorTag.name, () => {
  test("sync", () => {
    const fn = vi.fn()
    const result = pipe(
      Result.error(new Result.UnknownException()),
      Result.tapErrorTag("UnknownException", fn),
    )
    expect(result).toEqual(Result.error(new Result.UnknownException()))
    expect(fn).toHaveBeenCalledWith(new Result.UnknownException())
  })

  test("no match", () => {
    const fn = vi.fn()
    const error: Result.Result<
      never,
      Result.UnknownException | { tag: "Other" }
    > = Result.error(new Result.UnknownException())
    const result = pipe(error, Result.tapErrorTag("Other", fn))
    expect(result).toEqual(Result.error(new Result.UnknownException()))
    expect(fn).not.toHaveBeenCalled()
  })

  test("async", () => {
    const fn = vi.fn(async () => {})
    const result = pipe(
      Result.error(Promise.resolve(new Result.UnknownException())),
      Result.tapErrorTag("UnknownException", fn),
    )
    expect(result).resolves.toEqual(Result.error(new Result.UnknownException()))
    expect(fn).toHaveBeenCalledWith(new Result.UnknownException())
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
    expectTypeOf(result).toEqualTypeOf<Promise<Result.Result<string, never>>>()
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

describe(Result.catchAll.name, () => {
  test("sync", () => {
    const fn = vi.fn(() => Result.ok("fallback"))
    const result = pipe(Result.error(0), Result.catchAll(fn))
    expect(result).toEqual(Result.ok("fallback"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<string, never>>()
    expect(fn).toHaveBeenCalledWith(0)
  })
  test("async", () => {
    const fn = vi.fn(() => Result.ok("fallback"))
    const result = pipe(Result.error(Promise.resolve(0)), Result.catchAll(fn))
    expect(result).resolves.toEqual(Result.ok("fallback"))
    expectTypeOf(result).toEqualTypeOf<Promise<Result.Result<string, never>>>()
    expect(fn).toHaveBeenCalledWith(0)
  })
})

describe(Result.catchTag.name, () => {
  test("sync", () => {
    const fn = vi.fn(() => Result.ok("fallback"))
    const result = pipe(
      Result.error(new Result.UnknownException()),
      Result.flatMap(() => Result.error("boom")),
      Result.catchTag("UnknownException", fn),
    )
    expect(result).toEqual(Result.ok("fallback"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<string, string>>()
    expect(fn).toHaveBeenCalledWith(new Result.UnknownException())
  })
})

describe(Result.catchIf.name, () => {
  test("sync", () => {
    const recovered = pipe(
      Result.error("boom"),
      Result.catchIf(
        (e) => e === "boom",
        () => Result.ok("recovered"),
      ),
    )
    expect(recovered).toEqual(Result.ok("recovered"))

    const kept = pipe(
      Result.error("boom"),
      Result.catchIf(
        (e) => e === "other",
        () => Result.ok("recovered"),
      ),
    )
    expect(kept).toEqual(Result.error("boom"))
  })
})

describe(Result.catchSome.name, () => {
  test("sync", () => {
    const recovered = pipe(
      Result.error("boom"),
      Result.catchSome((e) => (e === "boom" ? Result.ok("ok") : undefined)),
    )
    expect(recovered).toEqual(Result.ok("ok"))

    const kept = pipe(
      Result.error("boom"),
      Result.catchSome((e) => (e === "other" ? Result.ok("ok") : undefined)),
    )
    expect(kept).toEqual(Result.error("boom"))
  })
})

describe(Result.catchTags.name, () => {
  type NetworkError = { tag: "NetworkError"; message: string }
  type OtherError = { tag: "OtherError"; message: string }

  test("sync", () => {
    const network: NetworkError = { tag: "NetworkError", message: "down" }
    const result = pipe(
      Result.error<NetworkError | OtherError>(network),
      Result.catchTags({
        NetworkError: () => Result.ok("ok"),
      }),
    )
    expect(result).toEqual(Result.ok("ok"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<string, OtherError>>()
  })

  test("missing handler", () => {
    const other: OtherError = { tag: "OtherError", message: "no" }
    const result = pipe(
      Result.error<NetworkError | OtherError>(other),
      Result.catchTags({
        NetworkError: () => Result.ok("ok"),
      }),
    )
    expect(result).toEqual(Result.error(other))
  })

  test("async", () => {
    const result = pipe(
      Result.error<NetworkError | OtherError>(
        Promise.resolve({ tag: "NetworkError", message: "down" }),
      ),
      Result.catchTags({
        NetworkError: () => Result.ok("ok"),
      }),
    )
    expect(result).resolves.toEqual(Result.ok("ok"))
  })
})

describe(Result.orElse.name, () => {
  test("sync", () => {
    const recovered = pipe(
      Result.error("boom"),
      Result.orElse(() => Result.ok("fallback")),
    )
    expect(recovered).toEqual(Result.ok("fallback"))
    expectTypeOf(recovered).toEqualTypeOf<Result.Result<string, never>>()
  })

  test("async", () => {
    const recovered = pipe(
      Result.error(Promise.resolve("boom")),
      Result.orElse(() => Result.ok("fallback")),
    )
    expect(recovered).resolves.toEqual(Result.ok("fallback"))
    expectTypeOf(recovered).toEqualTypeOf<Result.ResultAsync<string, never>>()
  })
})

describe(Result.orElseFail.name, () => {
  test("sync", () => {
    const result = pipe(
      Result.error("boom"),
      Result.orElseFail((e) => `wrapped:${e}`),
    )
    expect(result).toEqual(Result.error("wrapped:boom"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<never, string>>()
  })

  test("async", () => {
    const result = pipe(
      Result.error(Promise.resolve("boom")),
      Result.orElseFail((e) => `wrapped:${e}`),
    )
    expect(result).resolves.toEqual(Result.error("wrapped:boom"))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<never, string>>()
  })
})

describe(Result.orElseSucceed.name, () => {
  test("sync", () => {
    const result = pipe(
      Result.error("boom"),
      Result.orElseSucceed((e) => `default:${e}`),
    )
    expect(result).toEqual(Result.ok("default:boom"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<string, never>>()
  })

  test("async", () => {
    const result = pipe(
      Result.error(Promise.resolve("boom")),
      Result.orElseSucceed((e) => `default:${e}`),
    )
    expect(result).resolves.toEqual(Result.ok("default:boom"))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<string, never>>()
  })
})

describe(Result.orDie.name, () => {
  test("sync", () => {
    const ok = pipe(Result.ok(1), Result.orDie())
    expect(ok).toEqual(Result.ok(1))
    expectTypeOf(ok).toEqualTypeOf<Result.Result<number, never>>()

    expect(() => pipe(Result.error("boom"), Result.orDie())).toThrow("boom")
  })

  test("async", () => {
    const ok = pipe(Result.ok(Promise.resolve(1)), Result.orDie())
    expect(ok).resolves.toEqual(Result.ok(1))
    expectTypeOf(ok).toEqualTypeOf<Result.ResultAsync<number, never>>()

    const failed = pipe(Result.error(Promise.resolve("boom")), Result.orDie())
    expect(failed).rejects.toBe("boom")
  })
})

describe(Result.orDieWith.name, () => {
  test("sync", () => {
    const ok = pipe(
      Result.ok(1),
      Result.orDieWith((error) => `mapped:${error}`),
    )
    expect(ok).toEqual(Result.ok(1))
    expectTypeOf(ok).toEqualTypeOf<Result.Result<number, never>>()

    expect(() =>
      pipe(
        Result.error("boom"),
        Result.orDieWith((e) => `mapped:${e}`),
      ),
    ).toThrow("mapped:boom")
  })

  test("async", () => {
    const ok = pipe(
      Result.ok(Promise.resolve(1)),
      Result.orDieWith((e) => `mapped:${e}`),
    )
    expect(ok).resolves.toEqual(Result.ok(1))
    expectTypeOf(ok).toEqualTypeOf<Result.ResultAsync<number, never>>()

    const failed = pipe(
      Result.error(Promise.resolve("boom")),
      Result.orDieWith((e) => `mapped:${e}`),
    )
    expect(failed).rejects.toBe("mapped:boom")
  })
})
