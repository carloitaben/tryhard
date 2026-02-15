import { flow } from "../flow"
import * as Result from "../"

const reusableErrorPolicy = flow(
  Result.catchIf(
    (error) => error instanceof SyntaxError,
    () => Result.error("Some generic error"),
  ),
  Result.tapError(console.error),
  Result.orElse(() => Result.error("Some fallback mechanism")),
)
