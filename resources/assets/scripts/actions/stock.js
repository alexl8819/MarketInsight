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
const ok = require('assert');
const { 
  fetchJSON, 
  validateJSON,
  uppercaseArray,
  toUpper,
  isString,
  isNil,
  //  isEmpty,
  find,
  //  pipe,
  //  concat,
  //  sort,
  forEach,
  map,
  filter,
  length,
  assoc,
  difference,
  SortedStringSet,
  StrictObjectSet
} = require('../../../../lib/util');

const { 
  UPDATE_CONNECTION_STATUS,
  UPDATE_READY_STATUS,
  UPDATE_LOADING_STATUS,
  UPDATE_ALERT_STATUS,
  APPLY_RESULTS,
  MARK_ACTIVE,
  SYNC,
  WS_START_CONNECT,
  WS_FORCE_DISCONNECT,
  WS_FORCE_RESYNC,
  SYMBOL_QUERY_SCHEMA,
  BATCH_SUMMARY_SCHEMA
} = require('../../../../lib/constants');

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
});

const updateReadyStatus = (ready) => ({
  type: UPDATE_READY_STATUS,
  ready
});

const updateLoadingStatus = (loading) => ({
  type: UPDATE_LOADING_STATUS,
  loading
});

const updateAlertStatus = (alert, isError = false) => ({
  type: UPDATE_ALERT_STATUS,
  alert,
  isError
});

const applyResults = (results) => ({
  type: APPLY_RESULTS,
  results
});

const markActive = (symbol) => ({
  type: MARK_ACTIVE,
  symbol
});

const sync = (stocks) => ({
  type: SYNC,
  stocks
});

const resync = (symbols) => ({
  type: WS_FORCE_RESYNC,
  symbols
});

// ActionCreators
// Chooses the next active symbol
const _chooseActiveSymbol = () => (dispatch, getState) => {
  const { stocks, active } = getState();
  
  // Do not mark any symbols active if no stocks exist
  if (!length(stocks.size)) {
    return;
  }

  let current;
  
  // If the previous active symbol is not nil, find stock
  if (!isNil(active)) {
    current = find((stock) => stock.company.symbol === active, stocks.toArray());
  }
  
  // If none was found, pick first matching symbol that is subscribed
  if (isNil(current)) {
    const firstMatch = find((stock) => stock.subscribed, stocks.toArray());
    return dispatch(markActive(firstMatch.company.symbol));
  }
  
  dispatch(markActive(current.company.symbol));
};

// Resets stock set to filter
const _applySubscribeOnlyFilter = () => (dispatch, getState) => {
  const { stocks } = getState();
  
  dispatch(sync(
    new StrictObjectSet(
      filter((stock) => stock.subscribed, stocks.toArray())
    )
  ));
};

// Runs a query for symbols
const runSymbolQuery = (query) => async (dispatch) => {
  ok(isString(query), 'is not a string');
  
  dispatch(updateLoadingStatus(true));
  dispatch(_chooseActiveSymbol());
  dispatch(_applySubscribeOnlyFilter());

  let results;
  //
  try {
    const matchResultsPromise = fetchJSON(
      `https://${window.location.host}/stock/1.0/${query}/match`
    );
    results = await matchResultsPromise;
  } catch (err) {
    // TODO: only errors should be network related
    // TODO: dispatch request fail
    results = {};
  }

  if (!validateJSON(SYMBOL_QUERY_SCHEMA, results)) {
    if (results.error) {
      dispatch(applyResults(new StrictObjectSet([])));
    } else {
      dispatch(updateAlertStatus({
        message: 'Something went wrong. Please try again',
        isError: true
      }));
    }
  } else {
    dispatch(applyResults(new StrictObjectSet(results)));
  }
  
  dispatch(updateLoadingStatus(false));
};

// Fetchs summary of the currently active stock
const fetchSummary = (symbol) => async (dispatch, getState) => {
  const { stocks } = getState();
  const normalizedSymbol = toUpper(symbol);
  //
  dispatch(updateLoadingStatus(true));
  //
  let batchResults;
  try {
    const batchResultsPromise = fetchJSON(
      `https://${window.location.host}/stock/1.0/${normalizedSymbol}/batchSummary`
    );
    batchResults = await batchResultsPromise;
  } catch (err) {
    batchResults = {};
  }
  
  if (!validateJSON(BATCH_SUMMARY_SCHEMA, batchResults)) {
    dispatch(updateAlertStatus({
      message: 'Something went wrong. Please try again.',
      isError: true
    }));
  } else {
    const selected = find((stock) => stock.company.symbol === normalizedSymbol, stocks.toArray());
    const isSubscribed = selected ? selected.subscribed : false;

    dispatch(sync(new StrictObjectSet(
      stocks.toArray().filter(
        (stock) => stock.company.symbol !== batchResults[0].company.symbol
      )
      // Add summary to stock
        .concat(assoc('subscribed', isSubscribed, batchResults[0]))
      // Sort by symbol a-z
        .sort((a, b) => b.company.symbol < a.company.symbol)
    )));
    dispatch(markActive(symbol));
  }
  // Reset loading state
  dispatch(updateLoadingStatus(false));
};

const runSync = (symbols) => async (dispatch, getState) => {
  const { stocks, active } = getState();
  const normalized = uppercaseArray(symbols);
  let batchResults;

  if (!length(normalized)) {
    dispatch(markActive(null));
    return dispatch(updateReadyStatus(true));
  }
  //
  if (!stocks.size) {
    dispatch(updateReadyStatus(false));
  }
  
  if (length(normalized) && isNil(active)) {
    dispatch(markActive(symbols[0]));
  }

  const curSymbols = map((stock) => stock.company.symbol, stocks.toArray());
  const rmDiff = difference(curSymbols, symbols);
  const addDiff = difference(symbols, curSymbols);
  
  forEach((symbol) => dispatch(updateAlertStatus({ message: `Removed ${symbol} from watchlist` })), rmDiff);
  forEach((symbol) => dispatch(updateAlertStatus({ message: `Added ${symbol} to watchlist`})), addDiff);
  //
  try {
    batchResults = await fetchJSON(
      `https://${window.location.host}/stock/1.0/${normalized.join(',')}/batchSummary`
    );
  } catch (err) {
    batchResults = {};
  }
  
  if (!validateJSON(BATCH_SUMMARY_SCHEMA, batchResults)) {
    dispatch(updateAlertStatus({
      message: 'Something went wrong. Please try again',
      isError: true
    }));
  } else {
    dispatch(sync(new StrictObjectSet(map(
      (result) => assoc('subscribed', true, result), 
      batchResults
    ))));
    dispatch(_chooseActiveSymbol());
  }
  //
  dispatch(updateReadyStatus(true));
};

// User action forced resync
const forceResync = (symbol, remove) => (dispatch, getState) => {
  const { stocks } = getState();
  
  dispatch(updateReadyStatus(false));
  
  // Build set of symbols
  const symbols = map((stock) => stock.company.symbol, filter((stock) => stock.subscribed, stocks.toArray()));
  
  // Modify list
  const modified = remove ? symbols.filter((subbed) => symbol !== subbed) : symbols.concat(symbol);

  dispatch(resync(modified));
  dispatch(updateReadyStatus(true));
};

module.exports = {
  startConnect,
  forceDisconnect,
  updateConnectionStatus,
  updateReadyStatus,
  updateLoadingStatus,
  updateAlertStatus,
  runSymbolQuery,
  fetchSummary,
  runSync,
  forceResync,
  markActive,
};
