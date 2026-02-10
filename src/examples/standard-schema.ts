import * as Result from ".."

// #########################
// ###   Standard Typed  ###
// #########################

/** The Standard Typed interface. This is a base type extended by other specs. */
export interface StandardTypedV1<Input = unknown, Output = Input> {
  /** The Standard properties. */
  readonly "~standard": StandardTypedV1.Props<Input, Output>
}

export declare namespace StandardTypedV1 {
  /** The Standard Typed properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1
    /** The vendor name of the schema library. */
    readonly vendor: string
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined
  }

  /** The Standard Typed types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input
    /** The output type of the schema. */
    readonly output: Output
  }

  /** Infers the input type of a Standard Typed. */
  export type InferInput<Schema extends StandardTypedV1> = NonNullable<
    Schema["~standard"]["types"]
  >["input"]

  /** Infers the output type of a Standard Typed. */
  export type InferOutput<Schema extends StandardTypedV1> = NonNullable<
    Schema["~standard"]["types"]
  >["output"]
}

// ##########################
// ###   Standard Schema  ###
// ##########################

/** The Standard Schema interface. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  /** The Standard Schema properties. */
  readonly "~standard": StandardSchemaV1.Props<Input, Output>
}

export declare namespace StandardSchemaV1 {
  /** The Standard Schema properties interface. */
  export interface Props<Input = unknown, Output = Input>
    extends StandardTypedV1.Props<Input, Output> {
    /** Validates unknown input values. */
    readonly validate: (
      value: unknown,
      options?: StandardSchemaV1.Options | undefined,
    ) => Result<Output> | Promise<Result<Output>>
  }

  /** The result interface of the validate function. */
  export type Result<Output> = SuccessResult<Output> | FailureResult

  /** The result interface if validation succeeds. */
  export interface SuccessResult<Output> {
    /** The typed output value. */
    readonly value: Output
    /** A falsy value for `issues` indicates success. */
    readonly issues?: undefined
  }

  export interface Options {
    /** Explicit support for additional vendor-specific parameters, if needed. */
    readonly libraryOptions?: Record<string, unknown> | undefined
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

  /** The Standard types interface. */
  export interface Types<Input = unknown, Output = Input>
    extends StandardTypedV1.Types<Input, Output> {}

  /** Infers the input type of a Standard. */
  export type InferInput<Schema extends StandardTypedV1> =
    StandardTypedV1.InferInput<Schema>

  /** Infers the output type of a Standard. */
  export type InferOutput<Schema extends StandardTypedV1> =
    StandardTypedV1.InferOutput<Schema>
}

export class StandardSchemaError extends Result.TaggedError(
  "StandardSchemaError",
) {
  constructor(public issues: ReadonlyArray<StandardSchemaV1.Issue>) {
    const first = issues[0]
    const message = first ? first.message : "Standard schema error"
    super(message)
  }
}

function validationToResult<Output>(
  validation: StandardSchemaV1.Result<Output>,
): Result.Result<Output, StandardSchemaError> {
  if (!validation.issues) return Result.ok(validation.value)
  return Result.error(new StandardSchemaError(validation.issues))
}

function validateMaybeAsync<S extends StandardSchemaV1>(
  schema: S,
  value: unknown,
): Result.ResultMaybeAsync<
  StandardSchemaV1.InferOutput<S>,
  StandardSchemaError
> {
  const validation = schema["~standard"].validate(value)
  if (validation instanceof Promise) {
    return validation.then(validationToResult)
  }
  return validationToResult(validation)
}

function foldValidation<Output, A, E>(
  validation: Result.ResultMaybeAsync<Output, StandardSchemaError>,
  onError: (error: StandardSchemaError) => Result.ResultMaybeAsync<A, E>,
): Result.ResultMaybeAsync<Output | A, E> {
  if (validation instanceof Promise) {
    return validation.then((result) => {
      if (Result.isError(result)) return onError(result.error)
      return result
    })
  }
  if (Result.isError(validation)) return onError(validation.error)
  return validation
}

/**
 * TODO: document
 */
export function schema<
  S extends StandardSchemaV1,
  I extends Result.ResultMaybeAsync<StandardSchemaV1.InferInput<S>, any>,
  O,
>(
  schema: S,
): Result.Combinator<
  I,
  StandardSchemaV1.InferOutput<S>,
  Result.InferError<I> | StandardSchemaError
>

export function schema(schema: StandardSchemaV1) {
  const combinator = Result.flatMap((value: unknown) =>
    validateMaybeAsync(schema, value),
  )
  return (
    result: Result.UnknownResultMaybeAsync,
  ): Result.UnknownResultMaybeAsync => combinator(result)
}

/**
 * TODO: document
 */
export function schemaOrElse<
  S extends StandardSchemaV1,
  I extends Result.ResultMaybeAsync<StandardSchemaV1.InferInput<S>, any>,
  O,
>(
  schema: S,
  orElse: () => O,
): Result.Combinator<I, Result.InferSuccess<I> | O, Result.InferError<I>>

export function schemaOrElse(schema: StandardSchemaV1, orElse: () => unknown) {
  const combinator = Result.flatMap((value: unknown) =>
    foldValidation(validateMaybeAsync(schema, value), () =>
      Result.ok(orElse()),
    ),
  )
  return (
    result: Result.UnknownResultMaybeAsync,
  ): Result.UnknownResultMaybeAsync => combinator(result)
}

/**
 * TODO: document
 */
export function schemaOrFail<
  S extends StandardSchemaV1,
  I extends Result.ResultMaybeAsync<StandardSchemaV1.InferInput<S>, any>,
  O,
>(
  schema: S,
  orFailWith: () => O,
): Result.Combinator<
  I,
  StandardSchemaV1.InferOutput<S>,
  Result.InferError<I> | O
>

export function schemaOrFail(
  schema: StandardSchemaV1,
  orFailWith: () => unknown,
) {
  const combinator = Result.flatMap((value: unknown) =>
    foldValidation(validateMaybeAsync(schema, value), () =>
      Result.error(orFailWith()),
    ),
  )
  return (
    result: Result.UnknownResultMaybeAsync,
  ): Result.UnknownResultMaybeAsync => combinator(result)
}

/**
 * TODO: document
 */
export function schemaOrDie<
  S extends StandardSchemaV1,
  I extends Result.ResultMaybeAsync<StandardSchemaV1.InferInput<S>, any>,
>(
  schema: S,
  orDie: () => never,
): Result.Combinator<I, StandardSchemaV1.InferOutput<S>, Result.InferError<I>>

export function schemaOrDie(schema: StandardSchemaV1, orDie: () => never) {
  const combinator = Result.flatMap((value: unknown) =>
    foldValidation(validateMaybeAsync(schema, value), () => orDie()),
  )
  return (
    result: Result.UnknownResultMaybeAsync,
  ): Result.UnknownResultMaybeAsync => combinator(result)
}
