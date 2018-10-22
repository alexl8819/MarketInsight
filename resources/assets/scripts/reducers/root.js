/**
 * reducers/root.js - Root reducer
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
const {
  assoc,
  StrictObjectSet
} = require('../../../../lib/util');

const {
  UPDATE_CONNECTION_STATUS,
  UPDATE_READY_STATUS,
  UPDATE_ERROR_STATUS,
  MARK_ACTIVE,
  SYNC,
  APPLY_RESULTS
} = require('../../../../lib/constants')

const initialState = {
  connected: false, // state of network connection
  ready: false, // state of data filled
  error: null, // state of network/application errors
  active: null, // state of active symbol watch
  results: new StrictObjectSet(), // non-duplicated result set
  stocks: new StrictObjectSet() // non-duplicated stocks set
};

// normal state: [ { 'AAPL': { companyName: '', data: []... } } ]

module.exports = (state = initialState, action) => {
  switch (action.type) {
  case UPDATE_CONNECTION_STATUS: // Updates connection status
    return assoc('connected', action.connected, state);
  case UPDATE_READY_STATUS: // Updates ready status
    return assoc('ready', action.ready, state);
  case UPDATE_ERROR_STATUS: // Updates error status
    return assoc('error', action.error, state);
  case MARK_ACTIVE: // Marks selected as active
    return assoc('active', action.symbol, state);
  case SYNC: // Update stocks
    return assoc('stocks', action.stocks, state);
  case APPLY_RESULTS: // Applys search results
    return assoc('results', action.results, state);
  default:
    return state;
  }
};
