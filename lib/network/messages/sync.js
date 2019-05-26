/**
 * lib/network/messages/sync.js - Sync message implementation
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
  isEmpty,
  filterEmpty, 
  isStringArray 
} = require('../../../lib/util');
/*
 * Message format:
 * ['MSFT', 'AAPL', 'GOOG']
 */
class SyncMessage extends Message { 
  constructor (payload) {
    super(payload);
  }

  static get header () {
    return 'sync';
  }
  
  static get schema () {
    return {
      required: true,
      type: 'array'
    };
  }

  static validate (payload) {
    return Message.validateSchema(payload, SyncMessage.schema) //&& isStringArray(payload) 
      && (payload.length || payload.every((value) => typeof value === 'string' && value.length && !/^\s+$/.test(value)));
  }

  pack () {
    if (!SyncMessage.validate(this.payload)) {
      throw new TypeError(`pack: Invalid message type: ${SyncMessage.header}`);
    }

    return super.pack();
  }
}

module.exports = SyncMessage;
