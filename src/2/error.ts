export function TaggedError<const T extends string>(tag: T) {
  return class TaggedError extends Error {
    public readonly tag = tag
    public readonly type = "failure"
    public readonly value = this
    constructor(message: string, options?: ErrorOptions) {
      super(message, options)
      this.name = tag
    }
  }
}

export class UnknownException extends TaggedError("UnknownException") {
  constructor(options?: ErrorOptions) {
    super("Unknown exception", options)
  }
}
