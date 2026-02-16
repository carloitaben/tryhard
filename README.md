# tryhard

Yet another Result type for TypeScript.

## Comparison

|                       | neverthrow | typescript-result | better-result | byethrow | tryhard | effect |
| --------------------- | ---------- | ----------------- | ------------- | -------- | ------- | ------ |
| Colorless combinators | 🛑         | ✅                | ✅            | ✅       | ✅      | ✅     |
| Just objects          | 🛑         | 🛑                | 🛑            | ✅       | ✅      | 🛑     |
| Tree-shakable         | 🛑         | 🛑                | 🛑            | ✅       | ✅      | 🔶     |
| Effect-flavor         | 🛑         | 🛑                | ✅            | 🛑       | ✅      | ✅     |
| Effect                | 🛑         | 🛑                | 🛑            | 🛑       | 🛑      | ✅     |

## Installation

1. Copy `src/result.ts`
2. Copy `src/flow.ts`
3. Copy `src/pipe.ts`
4. Profit

## Examples

```ts
import { z } from "zod"
import { pipe } from "./pipe"
import * as Result from "./result"

class BadStatus extends Result.TaggedError("BadStatus") {
  readonly status: number
  readonly statusText: string
  constructor(status: number, statusText: string) {
    super(`Bad status: ${status} ${statusText}`)
    this.status = status
    this.statusText = statusText
  }
}

class MissingHeader extends Result.TaggedError("MissingHeader") {
  readonly name: string
  constructor(name: string) {
    super(`Missing header: ${name}`)
    this.name = name
  }
}

class SchemaError extends Result.TaggedError("SchemaError") {
  constructor(message: string) {
    super(message)
  }
}

type FetchError = BadStatus | MissingHeader | SchemaError

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const fetchJson = Result.tryPromise(async (url: string) => {
  const response = await fetch(url)
  return response
})

const ensureOk = Result.flatMap((response: Response) =>
  response.ok
    ? Result.ok(response)
    : Result.error<FetchError>(
        new BadStatus(response.status, response.statusText),
      ),
)

const requireHeader = (name: string) =>
  Result.flatMap((response: Response) => {
    const value = response.headers.get(name)
    return value
      ? Result.ok(response)
      : Result.error<FetchError>(new MissingHeader(name))
  })

const parseJson = Result.flatMap((response: Response) =>
  Result.tryPromise(async () => response.json())(),
)

const parseUser = Result.flatMap((value: unknown) => {
  const parsed = UserSchema.safeParse(value)
  return parsed.success
    ? Result.ok(parsed.data)
    : Result.error<FetchError>(new SchemaError(parsed.error.message))
})

const fetchUser = (
  url: string,
): Result.ResultAsync<{ id: string; name: string }, FetchError> =>
  pipe(
    fetchJson(url),
    ensureOk,
    requireHeader("x-request-id"),
    parseJson,
    parseUser,
    Result.catchTag("BadStatus", (e) =>
      Result.error(new BadStatus(e.status, e.statusText)),
    ),
  )
```

```ts
import { pipe } from "./pipe"
import * as Result from "./index"

type Config = { port: number; debug: boolean }

const parseNumber = (value: string) => Result.try(() => Number(value))()

const parseBool = Result.map((value: string) => value === "true")

const parsePort = Result.flatMap((value: string) =>
  pipe(
    parseNumber(value),
    Result.filterOrFail(
      (n) => Number.isInteger(n) && n > 0,
      () => "bad port",
    ),
  ),
)

const parseConfig = (env: Record<string, string | undefined>) =>
  pipe(
    Result.ok(env),
    Result.map((e) => ({ port: e.PORT ?? "3000", debug: e.DEBUG ?? "false" })),
    Result.flatMap(({ port, debug }) =>
      pipe(
        Result.ok(port),
        parsePort,
        Result.flatMap((portValue) =>
          pipe(
            Result.ok(debug),
            parseBool,
            Result.map((debugFlag) => ({ port: portValue, debug: debugFlag })),
          ),
        ),
      ),
    ),
  )

const config = parseConfig(process.env)
```

```ts
import { pipe } from "./pipe"
import * as Result from "./result"

type Email = { value: string }

const parseEmail = Result.flatMap((value: string) =>
  pipe(
    Result.ok(value.trim()),
    Result.filterOrFail(
      (v) => v.includes("@"),
      () => new Error("invalid email"),
    ),
    Result.map((v) => ({ value: v }) satisfies Email),
  ),
)

const email = pipe(Result.ok(" user@example.com "), parseEmail)
```

```ts
import { pipe } from "./pipe"
import * as Result from "./index"

class NetworkError extends Result.TaggedError("NetworkError") {}
class AuthError extends Result.TaggedError("AuthError") {}

type ApiError = NetworkError | AuthError

const task = Result.error<ApiError>(new NetworkError("down"))

const recovered = pipe(
  task,
  Result.catchTags({
    NetworkError: () => Result.ok("retry later"),
    AuthError: () => Result.error(new AuthError("reauth")),
  }),
)
```

```ts
import { pipe } from "./pipe"
import * as Result from "./result"

const save = Result.tryPromise(async (value: string) => {
  await Promise.resolve(value)
  return value.length
})

const out = pipe(
  save("hello"),
  Result.tap((n) => {
    console.log("saved", n)
  }),
  Result.tapError((e) => {
    console.error("save failed", e)
  }),
)
```

## API

### constructors/guards

(ok, error, isResult, isOk, isError)

### execution

(try, tryPromise)

### generators

(gen, yieldResult, yieldAsync)

### transforms

(map, flatMap, mapError)

### taps

(tap, tapError, tapErrorTag)

### filters

(filterOrElse, filterOrFail, filterOrDie)

### error recovery

(catchAll, catchIf, catchSome, catchTag, catchTags, orElse, orElseFail, orElseSucceed)

### termination

(orDie, orDieWith)

### tagging

(Tagged, isTagged, isTaggedWith, TaggedError)
