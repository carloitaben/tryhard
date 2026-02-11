# tryhard

Yet another Result type for TypeScript.

## Comparison

|               | neverthrow | typescript-result | better-result | byethrow | tryhard | effect |
| ------------- | ---------- | ----------------- | ------------- | -------- | ------- | ------ |
| Colorless     | 🛑         | ✅                | 🔶            | ✅       | ✅      | ✅     |
| Just objects  | 🛑         | 🛑                | 🛑            | ✅       | ✅      | ✅     |
| Tree-shakable | 🛑         | 🛑                | 🛑            | ✅       | ✅      | ✅     |
| Effect-flavor | 🛑         | 🔶                | ✅            | 🛑       | ✅      | ✅     |
| Effect        | 🛑         | 🛑                | 🛑            | 🛑       | 🛑      | ✅     |

(I'm still investigating this. The comparison may be incorrect.)

## Installation

1. Copy `src/index.ts`
2. Copy `src/pipe.ts`
3. Profit

## API

### constructors/guards

(ok, error, isResult, isOk, isError)

### execution

(try, tryPromise)

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
