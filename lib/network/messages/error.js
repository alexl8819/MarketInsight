/**
 * lib/network/messages/error.js - Error message implementation
 * Copyright (C) 2018  idealwebsolutions
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/
const Message = require('./message');
const { 
  isError, 
  isEmpty 
} = require('../../../lib/util');
/*
 * Message format:
 * { reason: 'Unable to add' }
 */
class ErrorMessage extends Message { 
  constructor (payload) {
    super(payload);
  }

  static get header () {
    return 'error';
  }
  
  static get schema () {
    return {
      required: true,
      type: 'object',
      properties: {
        message: {
          required: true,
          type: 'string'
        }
      }
    };
  }

  validate () {
    return Message.validateSchema(this.payload, ErrorMessage.schema) && !isError(this.payload) && !isEmpty(this.payload.message);
  }

  pack () {
    if (!this._validate()) {
      throw new TypeError(`pack: invalid message type: ${ErrorMessage.header}`);
    }

    return super.pack();
  }
}

module.exports = ErrorMessage;
