// Quasi-nominative typing.
// The __brand property never actually exists at run time, we just pretend that
// it does for the sake of type checking.

export type Brand<T, B> = T & { __brand: B };
