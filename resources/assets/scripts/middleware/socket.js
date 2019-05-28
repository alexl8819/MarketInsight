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
const pEvent = require('p-event');
const delay = require('delay');
const merge = require('merge-async-iterators');

const {
  updateConnectionStatus, 
  updateReadyStatus, 
  updateAlertStatus,
  runSync 
} = require('../actions');
const { ClientSession } = require('../../../../lib/network/session');
const {
  SyncMessage,
  ErrorMessage
} = require('../../../../lib/network/messages');

let session;

const websocketHandler = (store) => (next) => async (action) => {
  if (!WEBSOCKET_SUPPORT) {
    store.dispatch(updateAlertStatus({
      message: 'Websockets Unsupported - Browser update required',
      isError: true
    }));
    return;
  }
  
  switch (action.type) {
  case 'WS:CONNECT':
    if (session) {
      store.dispatch(updateAlertStatus({
        message: 'Network connection has already been established',
        isError: true
      }));
      return;  
    }
    // Attempt to connect to the server
    try {
      const connectPromise = ClientSession.connect(`wss://${action.location}`);
      session = await connectPromise;
    } catch (err) {
      store.dispatch(updateAlertStatus({
        message: 'Network connection failed',
        isError: true
      }));
      await delay(2000);
      store.dispatch(updateConnectionStatus(false));
      return;
    }
    // Send online update
    store.dispatch(updateConnectionStatus(true));
    // Handle all sync messages
    const syncMessageIteratorPromise = pEvent.iterator(session, 'sync', {
      rejectionEvents: [],
      resolutionEvents: ['finish']
    });
    // Handle all error messages
    const errorMessageIteratorPromise = pEvent.iterator(session, 'error', {
      rejectionEvents: [],
      resolutionEvents: ['finish']
    });
    // Handle all disconnect updates
    const disconnectMessageIteratorPromise = pEvent.iterator(session, 'disconnect', {
      rejectionEvents: [],
      resolutionEvents: ['finish']
    });
    // Handle all reconnect updates
    const reconnectMessageIteratorPromise = pEvent.iterator(session, 'reconnect', {
      rejectionEvents: [],
      resolutionEvents: ['finish']
    });
    
    const syncMessageIterator = await syncMessageIteratorPromise;
    const errorMessageIterator = await errorMessageIteratorPromise;
    const disconnectMessageIterator = await disconnectMessageIteratorPromise;
    const reconnectMessageIterator = await reconnectMessageIteratorPromise;
    // TODO: better iterator detection instead of comparison
    try {
      for await (const {iterator, value} of merge([
        syncMessageIterator, 
        errorMessageIterator,
        disconnectMessageIterator,
        reconnectMessageIterator
    ], { yieldIterator: true })) {
        if (iterator === syncMessageIterator) {
          if (SyncMessage.validate(value)) {
            store.dispatch(runSync(value));
          }
        }

        if (iterator === errorMessageIterator) {
          if (ErrorMessage.validate(value)) {
            store.dispatch(updateAlertStatus({
              message: value.message,
              isError: true
            }));
          }
        }

        if (iterator === disconnectMessageIterator) {
          store.dispatch(updateAlertStatus({
            message: 'Network disconnection occured',
            isError: true
          }));
          await delay(2000);
          store.dispatch(updateConnectionStatus(false));
        }

        if (iterator === reconnectMessageIterator) {
          store.dispatch(updateConnectionStatus(true));
        }
      }
    } catch (e) {
      console.error(e)
    }
    // Handle cleanup
    const finishPromise = pEvent(session, 'finish');
    await finishPromise;
    store.dispatch(updateConnectionStatus(false));
    break;
  case 'WS:FORCE_DISCONNECT': // Disconnect
    if (!session) {
      store.dispatch(updateAlertStatus({
        message: 'Fatal error occured: Page refresh required',
        isError: true
      }));
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
      store.dispatch(updateAlertStatus({
        message: 'Fatal error occured: Page refresh required',
        isError: true
      }));
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
  // Execute next action
  next(action);
};

module.exports = websocketHandler;
