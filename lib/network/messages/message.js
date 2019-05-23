/**
 * lib/network/messages/message.js - Base message implementation
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
const { validateJSON } = require('../../util');

class Message {
  constructor (payload) {
    this.payload = payload;
  }

  static unpack (payload = {}) {
    if (!Buffer.isBuffer(payload)) {
      throw new TypeError('unpack: payload is not a valid buffer');
    }

    return JSON.parse(payload.toString());
  }

  static validateSchema (payload = {}, schema) {
    return validateJSON(schema, payload);
  }

  pack () {
    return Buffer.from(JSON.stringify(this.payload));
  }
}

module.exports = Message;
