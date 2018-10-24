/**
 * middleware/socket.js - Middleware for websocket activity
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
const { WEBSOCKET_SUPPORT } = require('simple-websocket');
const pify = require('pify');
const {
  updateConnectionStatus, 
  updateReadyStatus, 
  updateErrorStatus,
  runSync 
} = require('../actions');

const { ClientSession } = require('../../../../lib/network/session');
const {
  SyncMessage,
  ErrorMessage
} = require('../../../../lib/network/messages');

const connect = pify(ClientSession.connect);

let session;

const websocketHandler = (store) => (next) => async (action) => {
  if (!WEBSOCKET_SUPPORT) {
    store.dispatch(updateErrorStatus(
      new Error('Websockets Unsupported - Browser update required')
    ));
    return;
  }
  
  switch (action.type) {
  case 'WS:CONNECT':
    if (session) {
      store.dispatch(updateErrorStatus(
        new Error('Network connection has already been established')
      ));
      return;  
    }
    // Attempt to connect to the server
    try {
      session = await connect(`wss://${action.location}`);
    } catch (err) {
      console.error(err)
      store.dispatch(updateErrorStatus(new Error('Network connection failed')));
      setTimeout(() => store.dispatch(updateConnectionStatus(false)), 2000);
      return;
    }
    // Handle all sync messages
    session.on('sync', (message) => {
      if (SyncMessage.validate(message)) {
        store.dispatch(runSync(message));
      }
    });
    // Handle disconnect updates
    session.on('disconnect', () => {
      store.dispatch(updateErrorStatus(new Error('Network disconnection occured')));
      setTimeout(() => store.dispatch(updateConnectionStatus(false)), 2000);
    });
    // Handle reconnect updates
    session.on('reconnect', () => store.dispatch(updateConnectionStatus(true)));
    // Handle errors message
    session.on('error', (error) => {
      if (ErrorMessage.validate(error)) {
        store.dispatch(updateErrorStatus(new Error(error.message)));
      }
    });
    // Handle cleanup
    session.once('finish', () => store.dispatch(updateConnectionStatus(false)));
    // Send online update
    store.dispatch(updateConnectionStatus(true));
    break;
  case 'WS:FORCE_DISCONNECT': // Disconnect
    if (!session) {
      store.dispatch(updateErrorStatus(
        new Error('Fatal error occured: Page refresh required')
      ));
      return;
    }
    // Disconnect session
    session.destroy();
    // Update connection status
    store.dispatch(updateConnectionStatus(false));
    break;
  case 'WS:FORCE_RESYNC':
    // Check session still exists
    if (!session) {
      store.dispatch(updateErrorStatus(
        new Error('Fatal error occured: Page refresh required')
      ));
      return;
    }
    // Wait for message to be written
    store.dispatch(updateReadyStatus(false));
    // Write sync message
    session.write(new SyncMessage(action.symbols).pack());
    // Update ready status again
    store.dispatch(updateReadyStatus(true));
    break;
  default:
    break;
  }

  next(action);
};

module.exports = websocketHandler;
