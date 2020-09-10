const ExtendableError = require('es6-error');

class HttpError extends ExtendableError {
  constructor (message, code) {
    super(message);
    this._code = code;
  }

  get status () {
    return this._code;
  }
};

module.exports = HttpError;
