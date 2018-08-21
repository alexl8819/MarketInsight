/**
 * store.js - Redux store enhancer
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
const { createStore, applyMiddleware } = require('redux');
const thunk = require('redux-thunk').default;

const websocketHandler  = require('./middleware');
const combinedReducer = require('./reducers');

let store;

if (process.env.NODE_ENV !== 'production') {
  const { logger } = require('redux-logger');
  store = createStore(
    combinedReducer,
    applyMiddleware(
      websocketHandler,
      thunk,
      logger
    )
  );
} else {
  store = createStore(
    combinedReducer,
    applyMiddleware(
      websocketHandler,
      thunk
    )
  );
}

module.exports = store;
