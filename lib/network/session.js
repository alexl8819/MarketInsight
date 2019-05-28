/**
 * lib/network/session.js - Server/client sessions
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
const { ok } = require('assert');
const { EventEmitter } = require('events');
const WebSocket = require('simple-websocket');
const eos = require('end-of-stream');
// const delay = require('delay');
// const pTimeout = require('p-timeout');
const pEvent = require('p-event');

const {
  Message,
  SyncMessage,
  ErrorMessage
}  = require('./messages');
const MessageDispatcher = require('./dispatch');
const { 
  DISCONNECT_RETRY_MILLIS,
  MAX_TIMEOUT_MILLIS,
  MAX_RECONNECT_ATTEMPTS
} = require('../constants');

const { isNil } = require('../util');

class Session extends EventEmitter {
  constructor (socket, options = {}) {
    super(options);

    this._socket = socket;
    this._createMessageRouter();
    this._createPipeline();
  }

  get socket () {
    return this._socket;
  }

  _onFinish (err) {
    this.emit('finish', err);
    this.destroy(err);
  }

  _createMessageRouter () {
    this._dispatcher = new MessageDispatcher(
      (message) => this.emit('unhandled', message)
    );
    this._dispatcher.put(SyncMessage.validate, 
      (message) => this.emit(SyncMessage.header, message)
    );
    this._dispatcher.put(ErrorMessage.validate, 
      (message) => this.emit(ErrorMessage.header, message)
    );
  }

  _createPipeline () {
    ok(this._socket, 'socket was not initialized');
    
    this._socket.on('data', this._handleMessage.bind(this));
    eos(this._socket, this._onFinish.bind(this));
  }

  _handleMessage (data) {
    if (!data.length) {
      return;
    }

    try {
      this._dispatcher.findMatch(Message.unpack(data));
    } catch(err) {
      return;
    }
  }

  write (message) {
    ok(Buffer.isBuffer(message), 'not a valid message');
    
    this._socket.send(message);
  }

  destroy () {
    ok(!isNil(this._socket), 'socket not initialized');

    this._socket.destroy();
    this.removeAllListeners();
  }
}

class ServerSession extends Session {
  constructor (socket) {
    super(socket);
  }

  _onFinish (err) {
    this.emit('disconnect');
    super._onFinish(err);
  }

  static bind (socket) {
    return new ServerSession(socket);
  }
}

class ClientSession extends Session {
  constructor (socket, address, reconnect = true) {
    super(socket);
    
    this.address = address;
    this._reconnect = reconnect;
    this._attempts = 0;
  }

  _onFinish (err) {
    this.emit('disconnect');

    if (this._reconnect) {
      const timeoutIntervalHandler = setInterval(async () => {
        if ((++this._attempts) >= MAX_RECONNECT_ATTEMPTS) {
          clearInterval(timeoutIntervalHandler);
          return this._onFinish(err);
        }
        
        this._socket.destroy();
        this._socket = null;
        this._socket = new WebSocket(this.address);
        const socketConnectPromise = pEvent(this._socket, 'connect');
        await socketConnectPromise;
        clearInterval(timeoutIntervalHandler);
        this._createPipeline();
        this._attempts = 0;
        this.emit('reconnect');
      }, DISCONNECT_RETRY_MILLIS);
      return;
    }

    super._onFinish(err);
  }

  static async connect (address) {
    const socket = new WebSocket(address);
    
    const timeoutHandler = setTimeout(() => {
      socket.destroy();
      throw new Error('Failed to connect. Connection timed out.');
    }, MAX_TIMEOUT_MILLIS);
    
    const connectPromise = pEvent(socket, 'connect', {
      rejectionEvents: []
    });

    await connectPromise;
    clearTimeout(timeoutHandler);
    
    return new ClientSession(socket, address);
  }
}

module.exports = {
  ServerSession,
  ClientSession
};
