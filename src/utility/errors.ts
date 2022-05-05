class SaneError extends Error {
  // https://github.com/microsoft/TypeScript/issues/13965
  __proto__: Error;
  constructor(message?: string) {
    const trueProto = new.target.prototype;
    super(message);

    // Alternatively use Object.setPrototypeOf if you have an ES6 environment.
    this.__proto__ = trueProto;
  }
}

export class InvalidParameterError extends SaneError {
  constructor(message: string) {
    super(message);
  }
}

export class OutOfSyncDatasetError extends SaneError {
  constructor(message: string) {
    super(message);
  }
}

export class DataAccessError extends SaneError {
  constructor(message: string) {
    super(message);
  }
}

export class EmptyDataError extends DataAccessError {
  constructor(pvname: string, extra: string) {
    super(`Request returned and empty array, ${pvname} ${extra}`);
  }
}

export class OptimizeDataError extends DataAccessError {
  constructor(pvname: string, bins: number, extra?: string) {
    super(`Optimize request returned and empty array, ${pvname} bins ${bins}, ${extra}`);
  }
}

export class DiffDataError extends DataAccessError {
  constructor(pvname: string, extra?: string) {
    super(`Diff request returned and empty array, ${pvname}, ${extra}`);
  }
}
