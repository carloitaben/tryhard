import { fail, type Result, success } from "./result"

/** The Standard Schema interface. */
interface StandardSchemaV1<Input = unknown, Output = Input> {
  /** The Standard Schema properties. */
  readonly "~standard": StandardSchemaV1.Props<Input, Output>
}

declare namespace StandardSchemaV1 {
  /** The Standard Schema properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1
    /** The vendor name of the schema library. */
    readonly vendor: string
    /** Validates unknown input values. */
    readonly validate: (
      value: unknown,
    ) => Result<Output> | Promise<Result<Output>>
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined
  }

  /** The result interface of the validate function. */
  export type Result<Output> = SuccessResult<Output> | FailureResult

  /** The result interface if validation succeeds. */
  export interface SuccessResult<Output> {
    /** The typed output value. */
    readonly value: Output
    /** The non-existent issues. */
    readonly issues?: undefined
  }

  /** The result interface if validation fails. */
  export interface FailureResult {
    /** The issues of failed validation. */
    readonly issues: ReadonlyArray<Issue>
  }

  /** The issue interface of the failure output. */
  export interface Issue {
    /** The error message of the issue. */
    readonly message: string
    /** The path of the issue, if any. */
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined
  }

  /** The path segment interface of the issue. */
  export interface PathSegment {
    /** The key representing a path segment. */
    readonly key: PropertyKey
  }

  /** The Standard Schema types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input
    /** The output type of the schema. */
    readonly output: Output
  }

  /** Infers the input type of a Standard Schema. */
  export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
    Schema["~standard"]["types"]
  >["input"]

  /** Infers the output type of a Standard Schema. */
  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
    Schema["~standard"]["types"]
  >["output"]

  export {}
}

export type Combinator<A, E, AOut = A, EOut = E> = (
  result: Result<A, E>,
) => Result<AOut, EOut>

export function flatMap<A, E, AOut, EOut>(
  callback: (value: A) => Result<AOut, EOut>,
): Combinator<A, E, AOut, E | EOut> {
  return (result) => {
    if (!result.success) return result
    return callback(result.value)
  }
}

export function map<A, E, AOut>(
  callback: (value: A) => AOut,
): Combinator<A, E, AOut> {
  return flatMap((value) => success(callback(value)))
}

export function tap<A, E>(callback: (value: A) => void): Combinator<A, E> {
  return map((value) => {
    callback(value)
    return value
  })
}

export function mapError<A, E = never, Eout = never>(
  callback: (error: E) => Eout,
): Combinator<A, E, A, Eout> {
  return (result) => {
    if (result.success) return result
    return fail(callback(result.error))
  }
}

export function tapError<A, E>(callback: (error: E) => void): Combinator<A, E> {
  return mapError((error) => {
    callback(error)
    return error
  })
}

export function filterOrElse<A, E, AOut>(
  predicate: (value: A) => boolean,
  orElse: () => AOut,
): Combinator<A, E, A | AOut> {
  return map((value) => {
    if (predicate(value)) {
      return value
    } else {
      return orElse()
    }
  })
}

export function filterOrDie<A, E>(
  predicate: (value: A) => boolean,
  orDie: () => never,
): Combinator<A, E> {
  return filterOrElse(predicate, orDie)
}

export function filterOrFail<A, E, EOut>(
  predicate: (value: A) => boolean,
  orFail: () => EOut,
): Combinator<A, E | EOut> {
  return flatMap((value) => {
    if (predicate(value)) {
      return success(value)
    } else {
      return fail(orFail())
    }
  })
}

export function schemaOrElse<A, E, AOut, S extends StandardSchemaV1>(
  schema: S,
  orElse: (failure: StandardSchemaV1.FailureResult) => AOut,
): Combinator<A, E, StandardSchemaV1.InferOutput<S> | AOut> {
  return map((value) => {
    const validation = schema["~standard"].validate(value)
    if (validation instanceof Promise) {
      throw Error("TODO: promises are unsupported")
    }
    if (validation.issues) {
      return orElse(validation)
    } else {
      return validation.value
    }
  })
}

export function schemaOrFail<A, E, EOut, S extends StandardSchemaV1>(
  schema: S,
  orFail: (failure: StandardSchemaV1.FailureResult) => EOut,
): Combinator<A, E, StandardSchemaV1.InferOutput<S>, E | EOut> {
  return schemaOrElse(schema, (failure) => fail(orFail(failure)))
}

export function schema<A, E, S extends StandardSchemaV1>(
  schema: S,
): Combinator<
  A,
  E,
  StandardSchemaV1.InferOutput<S>,
  StandardSchemaV1.FailureResult | E
> {
  return schemaOrElse(schema, fail)
}
