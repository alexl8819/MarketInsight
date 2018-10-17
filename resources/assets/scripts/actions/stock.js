/**
 * actions/stock.js - Stock-related actions
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
  fetchJSON, 
  validateJSON,
  uppercaseArray,
  toUpper,
  isEmpty,
  find,
  pipe,
  concat,
  sort,
  map,
  filter,
  assoc,
  StrictObjectSet
} = require('../../../../lib/util');

const { 
  SYMBOL_QUERY_SCHEMA,
  BATCH_SUMMARY_SCHEMA
} = require('../../../../lib/constants');

// Action Types
const UPDATE_CONNECTION_STATUS = 'UPDATE_CONNECTION_STATUS';
const UPDATE_READY_STATUS = 'UPDATE_READY_STATUS';
const UPDATE_LOADING_STATUS = 'UPDATE_LOADING_STATUS';
const UPDATE_ERROR_STATUS = 'UPDATE_ERROR_STATUS';
const APPLY_RESULTS = 'APPLY_RESULTS';
const MARK_ACTIVE = 'MARK_ACTIVE';
const SYNC = 'SYNC';

const WS_START_CONNECT = 'WS:CONNECT';
const WS_FORCE_DISCONNECT = 'WS:FORCE_DISCONNECT';
const WS_FORCE_RESYNC = 'WS:FORCE_RESYNC';

// Actions
const startConnect = (location) => ({
  type: WS_START_CONNECT,
  location
});

const forceDisconnect = () => ({
  type: WS_FORCE_DISCONNECT
});

const updateConnectionStatus = (connected) => ({
  type: UPDATE_CONNECTION_STATUS,
  connected
})

const updateReadyStatus = (ready) => ({
  type: UPDATE_READY_STATUS,
  ready
})

const updateLoadingStatus = (loading) => ({
  type: UPDATE_LOADING_STATUS,
  loading
})

const updateErrorStatus = (error) => ({
  type: UPDATE_ERROR_STATUS,
  error
})

const applyResults = (results) => ({
  type: APPLY_RESULTS,
  results
})

const markActive = (symbol) => ({
  type: MARK_ACTIVE,
  symbol
})

const sync = (stocks) => ({
  type: SYNC,
  stocks
})

const resync = (symbols) => ({
  type: WS_FORCE_RESYNC,
  symbols
})

// ActionCreators
const _chooseActive = () => async (dispatch, getState) => {
  const { stocks, active } = getState();
  let current;

  if (active !== null) {
    current = stocks.toArray().find(
      (stock) => stock.company.symbol === active
    );
  }

  const symbol = current && current.subscribed ? current.company.symbol : stocks.toArray().find(
    (stock) => stock.subscribed
  ).company.symbol;

  dispatch(markActive(symbol));
}

const _doReset = () => async (dispatch, getState) => {
  const { stocks } = getState();

  dispatch(sync(
    new StrictObjectSet(
      filter((stock) => stock.subscribed, stocks.toArray())
    )
  ));
}

const runSymbolQuery = (query) => async (dispatch) => {
  let results;
  //
  dispatch(updateLoadingStatus(true));
  dispatch(_chooseActive());
  dispatch(_doReset());
  //
  try {
    results = await fetchJSON(
      `https://${window.location.host}/stock/1.0/${query}/match`
    )
  } catch (err) {
    // TODO: only errors should be network related
    // TODO: dispatch request fail
    results = {}
  }

  if (!validateJSON(SYMBOL_QUERY_SCHEMA, results)) {
    if (results.error) {
      dispatch(applyResults(new StrictObjectSet([])));
    } else {
      dispatch(updateErrorStatus(new TypeError('Something went wrong. Please try again')));
    }
  } else {
    dispatch(applyResults(new StrictObjectSet(results)));
  }
  
  dispatch(updateLoadingStatus(false));
}

const fetchSummary = (symbol) => async (dispatch, getState) => {
  const { stocks } = getState();
  const normalizedSymbol = toUpper(symbol);
  let batchResults;
  //
  const selected = stocks.toArray().find(
    (stock) => stock.company.symbol === normalizedSymbol
  )
  const isSubscribed = selected ? selected.subscribed : false
  //
  dispatch(updateLoadingStatus(true));
  //
  try {
    batchResults = await fetchJSON(
      `https://${window.location.host}/stock/1.0/${normalizedSymbol}/batchSummary`
    )
  } catch (err) {
    batchResults = {}
  }
  
  if (!validateJSON(BATCH_SUMMARY_SCHEMA, batchResults)) {
    dispatch(updateErrorStatus(new TypeError('Something went wrong. Please try again.')))
  } else {
    dispatch(sync(new StrictObjectSet(
      stocks.toArray().filter(
          (stock) => stock.company.symbol !== batchResults[0].company.symbol
      )
      // Add summary to stock
      .concat(assoc('subscribed', isSubscribed, batchResults[0]))
      // Sort by symbol a-z
      .sort((a, b) => b.company.symbol < a.company.symbol)
    )))
    dispatch(markActive(symbol));
  }
  // Reset loading state
  dispatch(updateLoadingStatus(false));
};

const runSync = (symbols) => async (dispatch, getState) => {
  const { stocks } = getState()
  const normalized = uppercaseArray(symbols);
  let batchResults;
  //
  if (!stocks.size) {
    dispatch(updateReadyStatus(false));
  }
  
  // dispatch(_doReset());
  
  if (symbols.length) {
    dispatch(markActive(symbols[0]));
  }
  //
  try {
    batchResults = await fetchJSON(
      `https://${window.location.host}/stock/1.0/${normalized.join(',')}/batchSummary`
    )
  } catch (err) {
    batchResults = {}
  }
  
  if (!validateJSON(BATCH_SUMMARY_SCHEMA, batchResults)) {
    dispatch(updateErrorStatus(new Error('Something went wrong. Please try again')));
  } else {
    dispatch(sync(new StrictObjectSet(map(
      (result) => assoc('subscribed', true, result), 
      batchResults
    ))));
    dispatch(_chooseActive());
  }
  //
  dispatch(updateReadyStatus(true));
};

const forceResync = (symbol, shouldRemove) => async(dispatch, getState) => {
  const { stocks } = getState();
  
  const symbols = stocks.toArray()
    .filter((stock) => stock.subscribed)
    .map((stock) => stock.company.symbol);
  
  dispatch(updateReadyStatus(false));
  
  const updated = shouldRemove ? symbols.filter((subbed) => symbol !== subbed) : symbols.concat(symbol)

  dispatch(resync(updated));
  
  dispatch(updateReadyStatus(true));
};

module.exports = {
  startConnect,
  forceDisconnect,
  updateConnectionStatus,
  updateReadyStatus,
  updateLoadingStatus,
  updateErrorStatus,
  runSymbolQuery,
  fetchSummary,
  runSync,
  forceResync,
  markActive,
};
