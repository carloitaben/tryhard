import { describe, it, expect, vi, expectTypeOf } from "bun:test"
import { pipe } from "./pipe"
import * as Result from "./result"

describe("Result", () => {
  describe(Result.ok.name, () => {
    it("creates Ok with value", () => {
      const result = Result.ok(1)
      expectTypeOf(result).toEqualTypeOf<Result.Result<number, never>>()
      expect(result.tag).toBe("ok")
      if (result.tag === "ok") {
        expect(result.value).toBe(1)
      } else {
        expect.unreachable()
      }
    })
    it("creates Ok with null", () => {
      const result = Result.ok(null)
      expectTypeOf(result).toEqualTypeOf<Result.Result<null, never>>()
      expect(result.tag).toBe("ok")
      if (result.tag === "ok") {
        expect(result.value).toBe(null)
      } else {
        expect.unreachable()
      }
    })
    it("creates Ok with undefined", () => {
      const result = Result.ok(undefined)
      expectTypeOf(result).toEqualTypeOf<Result.Result<undefined, never>>()
      expect(result.tag).toBe("ok")
      if (result.tag === "ok") {
        expect(result.value).toBe(undefined)
      } else {
        expect.unreachable()
      }
    })
    it("creates Ok with void when called without arguments", () => {
      const result = Result.ok()
      expectTypeOf(result).toEqualTypeOf<Result.Result<void, never>>()
      expect(result.tag).toBe("ok")
      if (result.tag === "ok") {
        expect(result.value).toBe(undefined)
      } else {
        expect.unreachable()
      }
    })
  })

  describe(Result.error.name, () => {
    it("creates Error", () => {
      const result = Result.error("oops")
      expectTypeOf(result).toEqualTypeOf<Result.Result<never, string>>()
      expect(result.tag).toBe("error")
      if (result.tag === "error") {
        expect(result.error).toBe("oops")
      } else {
        expect.unreachable()
      }
    })
    it("creates error with Error object", () => {
      const error = new Error("oops")
      const result = Result.error(error)
      expectTypeOf(result).toEqualTypeOf<Result.Result<never, Error>>()
      expect(result.tag).toBe("error")
      if (result.tag === "error") {
        expect(result.error).toBe(error)
      } else {
        expect.unreachable()
      }
    })
  })
})

describe("Guards", () => {
  describe(Result.isResult.name, () => {
    it("returns true for Ok", () => {
      expect(Result.isResult(Result.ok("yay"))).toBe(true)
    })
    it("returns true for Error", () => {
      expect(Result.isOk(Result.error("nay"))).toBe(false)
    })
    it("narrows value to Result", () => {
      const result: unknown = Result.ok("yay")
      if (Result.isResult(result)) {
        expectTypeOf(result).toEqualTypeOf<Result.Result<unknown, unknown>>()
      } else {
        expectTypeOf(result).toEqualTypeOf<unknown>()
        expect.unreachable()
      }
    })
  })

  describe(Result.isOk.name, () => {
    it("returns true for Ok", () => {
      expect(Result.isOk(Result.ok("yay"))).toBe(true)
    })
    it("returns false for Error", () => {
      expect(Result.isOk(Result.error("nay"))).toBe(false)
    })
    it("narrows Result to Ok", () => {
      const result = Result.ok("yay")
      if (Result.isOk(result)) {
        expectTypeOf(result).toEqualTypeOf<Result.Ok<string>>()
      } else {
        expectTypeOf(result).toEqualTypeOf<Result.Error<never>>()
        expect.unreachable()
      }
    })
  })

  describe(Result.isError.name, () => {
    it("returns true for Error", () => {
      expect(Result.isError(Result.error("nay"))).toBe(true)
    })
    it("returns false for Ok", () => {
      expect(Result.isError(Result.ok("yay"))).toBe(false)
    })
    it("narrows Result to Error", () => {
      const result = Result.error("nay")
      if (Result.isError(result)) {
        expectTypeOf(result).toEqualTypeOf<Result.Error<string>>()
      } else {
        expectTypeOf(result).toEqualTypeOf<Result.Ok<never>>()
        expect.unreachable()
      }
    })
  })

  describe(Result.isTagged.name, () => {
    const tagged: unknown = { tag: "tag" }
    it("returns true for tagged", () => {
      expect(Result.isTagged(tagged)).toBe(true)
    })
    it("returns true for tagged string literal", () => {
      expect(Result.isTagged(tagged, "tag")).toBe(true)
    })
    it("returns false for other values", () => {
      expect(Result.isTagged(1)).toBe(false)
      expect(Result.isTagged(tagged, "tryhard")).toBe(false)
    })
    it("narrows Result to Tagged", () => {
      if (Result.isTagged(tagged)) {
        expectTypeOf(tagged).toEqualTypeOf<Result.Tagged<string>>()
      } else {
        expectTypeOf(tagged).toEqualTypeOf<unknown>()
        expect.unreachable()
      }
      if (Result.isTagged(tagged, "tag")) {
        expectTypeOf(tagged).toEqualTypeOf<Result.Tagged<"tag">>()
      } else {
        expectTypeOf(tagged).toEqualTypeOf<Result.Tagged<string>>()
        expect.unreachable()
      }
    })
  })
})

describe(Result.try.name, () => {
  it("returns ok when function returns", () => {
    const fn = Result.try(() => "yay")
    const result = fn()
    expectTypeOf(result).toEqualTypeOf<
      Result.Result<string, Result.UnknownException>
    >()
    expect(Result.isOk(result)).toBe(true)
    if (Result.isOk(result)) {
      expect(result.value).toBe("yay")
    } else {
      expect.unreachable()
    }
  })
  it("wraps error with UnknownException when function throws", () => {
    const cause = new Error("oops")
    const fn = Result.try(() => {
      throw cause
    })
    const result = fn()
    expectTypeOf(result).toEqualTypeOf<
      Result.Result<never, Result.UnknownException>
    >()
    expect(Result.isError(result)).toBe(true)
    if (Result.isError(result)) {
      expect(result.error).toBeInstanceOf(Result.UnknownException)
      expect(result.error.cause).toBe(cause)
    } else {
      expect.unreachable()
    }
  })
  it("returns custom error when function throws", () => {
    const fn = Result.try(
      () => {
        throw new Error("oops")
      },
      () => "oops",
    )
    const result = fn()
    expectTypeOf(result).toEqualTypeOf<Result.Result<never, string>>()
    expect(Result.isError(result)).toBe(true)
    if (Result.isError(result)) {
      expect(result.error).toBe("oops")
    } else {
      expect.unreachable()
    }
  })
})

describe(Result.flatMap.name, () => {
  it("sync", () => {
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
  it("async", () => {
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
  it("sync", () => {
    const fn = vi.fn()
    const result = pipe(Result.ok(1), Result.tap(fn))
    expect(result).toEqual(Result.ok(1))
    expectTypeOf(result).toEqualTypeOf<Result.Result<number, never>>()
    expect(fn).toHaveBeenCalledWith(1)
  })
  it("async", () => {
    const fn = vi.fn()
    const result = pipe(Result.ok(Promise.resolve(1)), Result.tap(fn))
    expect(result).resolves.toEqual(Result.ok(1))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<number, never>>()
    expect(fn).toHaveBeenCalledWith(1)
  })
})

describe(Result.tapError.name, () => {
  it("sync", () => {
    const fn = vi.fn()
    const result = pipe(Result.error(1), Result.tapError(fn))
    expect(result).toEqual(Result.error(1))
    expectTypeOf(result).toEqualTypeOf<Result.Result<never, number>>()
    expect(fn).toHaveBeenCalledWith(1)
  })
  it("async", () => {
    const fn = vi.fn()
    const result = pipe(Result.error(Promise.resolve(1)), Result.tapError(fn))
    expect(result).resolves.toEqual(Result.error(1))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<never, number>>()
    expect(fn).toHaveBeenCalledWith(1)
  })
})

describe(Result.tapErrorTag.name, () => {
  it("sync", () => {
    const fn = vi.fn()
    const result = pipe(
      Result.error(new Result.UnknownException()),
      Result.tapErrorTag("UnknownException", fn),
    )
    expect(result).toEqual(Result.error(new Result.UnknownException()))
    expect(fn).toHaveBeenCalledWith(new Result.UnknownException())
  })

  it("no match", () => {
    const fn = vi.fn()
    const error: Result.Result<
      never,
      Result.UnknownException | { tag: "Other" }
    > = Result.error(new Result.UnknownException())
    const result = pipe(error, Result.tapErrorTag("Other", fn))
    expect(result).toEqual(Result.error(new Result.UnknownException()))
    expect(fn).not.toHaveBeenCalled()
  })

  it("async", () => {
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
  it("sync", () => {
    const result = pipe(
      Result.ok(1),
      Result.map((value) => value.toString()),
    )
    expect(result).toEqual(Result.ok("1"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<string, never>>()
  })
  it("async", () => {
    const result = pipe(
      Result.ok(Promise.resolve(1)),
      Result.map((value) => value.toString()),
    )
    expect(result).resolves.toEqual(Result.ok("1"))
    expectTypeOf(result).toEqualTypeOf<Promise<Result.Result<string, never>>>()
  })
})

describe(Result.mapError.name, () => {
  it("sync", () => {
    const result = pipe(
      Result.error(1),
      Result.mapError((value) => value.toString()),
    )
    expect(result).toEqual(Result.error("1"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<never, string>>()
  })
  it("async", () => {
    const result = pipe(
      Result.error(Promise.resolve(1)),
      Result.mapError((value) => value.toString()),
    )
    expect(result).resolves.toEqual(Result.error("1"))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<never, string>>()
  })
})

describe(Result.filterOrElse.name, () => {
  it("sync", () => {
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
  it("async", () => {
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
  it("sync", () => {
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
  it("async", () => {
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
  it("sync", () => {
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
  it("async", () => {
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
  it("sync", () => {
    const fn = vi.fn(() => Result.ok("fallback"))
    const result = pipe(Result.error(0), Result.catchAll(fn))
    expect(result).toEqual(Result.ok("fallback"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<string, never>>()
    expect(fn).toHaveBeenCalledWith(0)
  })
  it("async", () => {
    const fn = vi.fn(() => Result.ok("fallback"))
    const result = pipe(Result.error(Promise.resolve(0)), Result.catchAll(fn))
    expect(result).resolves.toEqual(Result.ok("fallback"))
    expectTypeOf(result).toEqualTypeOf<Promise<Result.Result<string, never>>>()
    expect(fn).toHaveBeenCalledWith(0)
  })
})

describe(Result.catchTag.name, () => {
  it("sync", () => {
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
  it("sync", () => {
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
  it("sync", () => {
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

  it("sync", () => {
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

  it("missing handler", () => {
    const other: OtherError = { tag: "OtherError", message: "no" }
    const result = pipe(
      Result.error<NetworkError | OtherError>(other),
      Result.catchTags({
        NetworkError: () => Result.ok("ok"),
      }),
    )
    expect(result).toEqual(Result.error(other))
  })

  it("async", () => {
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
  it("sync", () => {
    const recovered = pipe(
      Result.error("boom"),
      Result.orElse(() => Result.ok("fallback")),
    )
    expect(recovered).toEqual(Result.ok("fallback"))
    expectTypeOf(recovered).toEqualTypeOf<Result.Result<string, never>>()
  })

  it("async", () => {
    const recovered = pipe(
      Result.error(Promise.resolve("boom")),
      Result.orElse(() => Result.ok("fallback")),
    )
    expect(recovered).resolves.toEqual(Result.ok("fallback"))
    expectTypeOf(recovered).toEqualTypeOf<Result.ResultAsync<string, never>>()
  })
})

describe(Result.orElseFail.name, () => {
  it("sync", () => {
    const result = pipe(
      Result.error("boom"),
      Result.orElseFail((e) => `wrapped:${e}`),
    )
    expect(result).toEqual(Result.error("wrapped:boom"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<never, string>>()
  })

  it("async", () => {
    const result = pipe(
      Result.error(Promise.resolve("boom")),
      Result.orElseFail((e) => `wrapped:${e}`),
    )
    expect(result).resolves.toEqual(Result.error("wrapped:boom"))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<never, string>>()
  })
})

describe(Result.orElseSucceed.name, () => {
  it("sync", () => {
    const result = pipe(
      Result.error("boom"),
      Result.orElseSucceed((e) => `default:${e}`),
    )
    expect(result).toEqual(Result.ok("default:boom"))
    expectTypeOf(result).toEqualTypeOf<Result.Result<string, never>>()
  })

  it("async", () => {
    const result = pipe(
      Result.error(Promise.resolve("boom")),
      Result.orElseSucceed((e) => `default:${e}`),
    )
    expect(result).resolves.toEqual(Result.ok("default:boom"))
    expectTypeOf(result).toEqualTypeOf<Result.ResultAsync<string, never>>()
  })
})

describe(Result.orDie.name, () => {
  it("sync", () => {
    const ok = pipe(Result.ok(1), Result.orDie())
    expect(ok).toEqual(Result.ok(1))
    expectTypeOf(ok).toEqualTypeOf<Result.Result<number, never>>()

    expect(() => pipe(Result.error("boom"), Result.orDie())).toThrow("boom")
  })

  it("async", () => {
    const ok = pipe(Result.ok(Promise.resolve(1)), Result.orDie())
    expect(ok).resolves.toEqual(Result.ok(1))
    expectTypeOf(ok).toEqualTypeOf<Result.ResultAsync<number, never>>()

    const failed = pipe(Result.error(Promise.resolve("boom")), Result.orDie())
    expect(failed).rejects.toBe("boom")
  })
})

describe(Result.orDieWith.name, () => {
  it("sync", () => {
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

  it("async", () => {
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

describe(Result.yieldResult.name, () => {
  it("sync ok", () => {
    const out = Result.gen(function* () {
      const n = yield* Result.yieldResult(Result.ok(1))
      return n + 1
    })

    expect(out).toEqual(Result.ok(2))
    expectTypeOf(out).toEqualTypeOf<Result.Result<number, never>>()
  })

  it("sync return Result", () => {
    const out = Result.gen(function* () {
      yield* Result.yieldResult(Result.ok(undefined))
      return Result.ok("done")
    })

    expect(out).toEqual(Result.ok("done"))
  })
})

describe(Result.yieldAsync.name, () => {
  it("async ok", async () => {
    const out = Result.gen(async function* () {
      const n = yield* Result.yieldAsync(Result.ok(Promise.resolve(1)))
      return n + 1
    })

    expect(out).resolves.toEqual(Result.ok(2))
    expectTypeOf(out).toEqualTypeOf<Result.ResultAsync<number, never>>()
  })

  it("async ok sync result", async () => {
    const out = Result.gen(async function* () {
      const n = yield* Result.yieldAsync(Result.ok(1))
      return n + 1
    })

    expect(out).resolves.toEqual(Result.ok(2))
    expectTypeOf(out).toEqualTypeOf<Result.ResultAsync<number, never>>()
  })

  it("async return Result", async () => {
    const out = Result.gen(async function* () {
      yield* Result.yieldAsync(Result.ok(Promise.resolve(undefined)))
      return Result.ok("done")
    })

    expect(out).resolves.toEqual(Result.ok("done"))
  })
})

describe(Result.gen.name, () => {
  it("sync return value", () => {
    const out = Result.gen(function* () {
      const n = yield* Result.yieldResult(Result.ok(1))
      return n
    })

    expect(out).toEqual(Result.ok(1))
    expectTypeOf(out).toEqualTypeOf<Result.Result<number, never>>()
  })

  it("sync error runs finally", () => {
    let finalized = false
    const out = Result.gen(function* () {
      try {
        yield Result.error("boom")
        return 1
      } finally {
        finalized = true
      }
    })

    expect(out).toEqual(Result.error("boom"))
    expect(finalized).toBe(true)
  })

  it("sync throw becomes UnknownException", () => {
    const cause = new Error("boom")
    const out = Result.gen(function* (): Generator<
      Result.UnknownResult,
      Result.Result<number, Result.UnknownException>,
      number
    > {
      throw cause
    })

    expect(out).toEqual(Result.error(new Result.UnknownException({ cause })))
    if (Result.isError(out) && out.error instanceof Result.UnknownException) {
      expect(out.error.cause).toBe(cause)
    }
  })

  it("async error runs finally", async () => {
    let finalized = false
    const out = Result.gen(async function* () {
      try {
        yield Result.error(Promise.resolve("boom"))
        return 1
      } finally {
        finalized = true
      }
    })

    expect(out).resolves.toEqual(Result.error("boom"))
    expect(finalized).toBe(true)
  })

  it("async throw becomes UnknownException", async () => {
    const cause = new Error("boom")
    const out = await Result.gen(async function* (): AsyncGenerator<
      Result.UnknownResultMaybeAsync,
      Result.Result<number, Result.UnknownException>,
      number
    > {
      throw cause
    })

    expect(out).toEqual(Result.error(new Result.UnknownException({ cause })))
    if (Result.isError(out) && out.error instanceof Result.UnknownException) {
      expect(out.error.cause).toBe(cause)
    }
  })
})
