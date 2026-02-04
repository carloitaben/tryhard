import {
  filterOrDie,
  filterOrElse,
  filterOrFail,
  flatMap,
  map,
  mapError,
  schema,
  schemaOrElse,
  schemaOrFail,
  tap,
  tapError,
} from "./combinators"

import { describe, expect, it, test, vi } from "vitest"
import {
  wrap,
  fail,
  pipe,
  success,
  ResultError,
  UnknownException,
} from "./result"
import * as v from "valibot"

const result = wrap(() => 1)

describe(wrap.name, () => {
  it("returns errors as values", () => {
    const wrapped = wrap((kaboom: boolean) => {
      if (kaboom) throw Error()
      return "defused"
    })

    expect(() => wrapped(true)).not.toThrow()
    expect(wrapped(true).success).toBe(false)
    expect((wrapped(true) as ResultError).error).toBeInstanceOf(
      UnknownException,
    )
  })
})

test(map.name, () => {
  expect(
    pipe(
      success("foo"),
      map(() => "bar"),
    ),
  ).toEqual(success("bar"))

  expect(
    pipe(
      success(1),
      map((value) => -value),
    ),
  ).toEqual(success(-1))
})

test(tap.name, () => {
  const fn = vi.fn()
  expect(
    pipe(
      success(1),
      tap((value) => fn(value)),
    ),
  ).toEqual(success(1))
  expect(fn).toHaveBeenCalledExactlyOnceWith(1)
})

test(tapError.name, () => {
  const fn = vi.fn()
  expect(
    pipe(
      fail(1),
      tapError((error) => fn(error)),
    ),
  ).toEqual(fail(1))
  expect(fn).toHaveBeenCalledExactlyOnceWith(1)
})

test(schema.name, () => {
  expect(pipe(success(1), schema(v.number()))).toEqual(success(1))
  expect(pipe(success(1), schema(v.string())).success).toBe(false)
})
