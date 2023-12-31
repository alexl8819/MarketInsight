/**
 * actions/stock.js - Stock-related actions
 * Copyright (C) 2018 alexl8819
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
  isStringArray,
  isNil,
  find,
  concat,
  sort,
  join,
  forEach,
  map,
  filter,
  length,
  assoc,
  difference,
  removeItemBySlice,
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
  if (stocks.size === 0) {
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
  ok(isString(query), 'query is not a string');
  
  dispatch(_applySubscribeOnlyFilter());
  dispatch(updateLoadingStatus(true));

  let results;
  let errorCode;
  //
  try {
    const matchResultsPromise = fetchJSON(
      `${window.location.protocol}//${window.location.host}/stock/1.0/match?query=${encodeURIComponent(query)}`
    );
    results = await matchResultsPromise;
  } catch (err) {
    errorCode = err.status;
    results = {};
  }

  if (!validateJSON(SYMBOL_QUERY_SCHEMA, results)) {
    dispatch(results.error ? 
      applyResults(new StrictObjectSet([])) : 
      updateAlertStatus({
        message: (errorCode === 403 ? 'API limits reached' : 'Something went wrong.') + ' Please try again later',
        isError: true
      })
    );
  } else {
    dispatch(_chooseActiveSymbol());
    dispatch(applyResults(new StrictObjectSet(results)));
  }
  
  dispatch(updateLoadingStatus(false));
};

// Fetchs summary of the currently active stock
const fetchSummary = (symbol) => async (dispatch, getState) => {
  ok(isString(symbol), 'symbol is not a string');
  
  const { stocks } = getState();
  const normalizedSymbol = toUpper(symbol);
  //
  dispatch(updateLoadingStatus(true));
  //
  let batchResults;
  // TODO: use errorCode
  // let errorCode;
  //
  try {
    const batchResultsPromise = fetchJSON(
      `${window.location.protocol}//${window.location.host}/stock/1.0/batchSummary?symbols=${normalizedSymbol}`
    );
    batchResults = await batchResultsPromise;
  } catch (err) {
    // errorCode = err.status;
    batchResults = {};
  }
  // 
  if (!validateJSON(BATCH_SUMMARY_SCHEMA, batchResults)) {
    dispatch(updateAlertStatus({
      message: (batchResults.statusCode === 403 ? 'API limits reached.' : 'Something went wrong.') + ' Please try again later',
      isError: true
    }));
  } else {
    // Find stock from symbol
    const selected = find((stock) => stock.company.symbol === normalizedSymbol, stocks.toArray());
    // Apply summary on selected stock and sort list
    dispatch(
      sync(
        new StrictObjectSet(
          sort(
            (a, b) => a.company.symbol.localeCompare(b.company.symbol),
            concat(
              [
                assoc(
                  'subscribed', 
                  selected ? selected.subscribed : false,
                  batchResults[0]
                )
              ], 
              filter(
                (stock) => stock.company.symbol !== batchResults[0].company.symbol, 
                stocks.toArray()
              )
            )
          )
        )
      )
    );
    dispatch(markActive(symbol));
  }
  // Reset loading state
  dispatch(updateLoadingStatus(false));
};

const runSync = (symbols) => async (dispatch, getState) => {
  ok(isStringArray(symbols), 'symbols is not a string array');
  //
  const { stocks, active } = getState();
  // Normalize all symbols
  const normalized = uppercaseArray(symbols);
  // Update to loading status
  dispatch(updateLoadingStatus(true));
  // Check length changed
  if (!length(normalized)) {
    dispatch(markActive(null));
    dispatch(sync(new StrictObjectSet([])));
    dispatch(updateLoadingStatus(false));
    dispatch(updateReadyStatus(true));
    return;
  }
  // TODO: maybe use isEmpty
  if (length(normalized) && isNil(active)) {
    dispatch(markActive(symbols[0]));
  }
  let nextSubscriptionList;
  let batchResults;
  let errorCode;
  // If no local changes have ever occured (new users)
  if (!stocks.size) {
    dispatch(updateReadyStatus(false));
    forEach((symbol) => dispatch(updateAlertStatus({ message: `Added ${symbol} to watchlist`})), normalized);
    try {
      const batchResultsPromise = fetchJSON(
        `${window.location.protocol}//${window.location.host}/stock/1.0/batchSummary?symbols=${encodeURIComponent(join(',', normalized))}`
      );
      batchResults = await batchResultsPromise;
    } catch (err) {
      errorCode = err.status;
      batchResults = {};
    }
    // Validate results match expected structure
    if (!validateJSON(BATCH_SUMMARY_SCHEMA, batchResults)) {
      dispatch(updateAlertStatus({
        message: (errorCode ? 'API limit reached.' : 'Something went wrong.') + ' Please try again later',
        isError: true
      }));
    } else {
      // Create new subscription list by merging with results
      nextSubscriptionList = batchResults;
    }
    dispatch(sync(new StrictObjectSet(map(
      (result) => assoc('subscribed', true, result), 
      nextSubscriptionList
    ))));
    // Choose active symbol
    dispatch(_chooseActiveSymbol());
    // Finish
    dispatch(updateLoadingStatus(false));
    dispatch(updateReadyStatus(true));
  } else {
    // Create symbol list based on existing stocks
    const curSymbols = map((stock) => stock.company.symbol, stocks.toArray());
    // Diff against each list
    const rmDiff = difference(curSymbols, symbols);
    const addDiff = difference(symbols, curSymbols);
    // Skip and return if no diffs occured
    if (length(addDiff) === length(rmDiff)) {
      nextSubscriptionList = stocks.toArray();
      dispatch(sync(new StrictObjectSet(map(
        (result) => assoc('subscribed', true, result), 
        nextSubscriptionList
      ))));
      // Choose active symbol
      dispatch(_chooseActiveSymbol());
      // Finish
      dispatch(updateLoadingStatus(false));
      dispatch(updateReadyStatus(true));
      return;
    }
    // If removed diff changed
    if (length(rmDiff) > 0) {
      nextSubscriptionList = stocks.toArray().filter((stock) => rmDiff.indexOf(stock.company.symbol) === -1);
      // Notify symbol adds/removals
      forEach((symbol) => dispatch(updateAlertStatus({ message: `Removed ${symbol} from watchlist` })), rmDiff);
    } 
    // If added diff changed
    if (length(addDiff) > 0) {
      // Notify symbol adds/removals
      forEach((symbol) => dispatch(updateAlertStatus({ message: `Added ${symbol} to watchlist`})), addDiff);
      const normalizedAddSymbols = uppercaseArray(addDiff);
      try {
        const batchResultsPromise = fetchJSON(
          `${window.location.protocol}//${window.location.host}/stock/1.0/batchSummary?symbols=${encodeURIComponent(join(',', normalizedAddSymbols))}`
        );
        batchResults = await batchResultsPromise;
      } catch (err) {
        errorCode = err.status;
        batchResults = {};
      }
      // Validate results match expected structure
      if (!validateJSON(BATCH_SUMMARY_SCHEMA, batchResults)) {
        dispatch(updateAlertStatus({
          message: (errorCode ? 'API limit reached.' : 'Something went wrong.') + ' Please try again later',
          isError: true
        }));
      } else {
        // Create new subscription list by merging with results
        nextSubscriptionList = stocks.toArray().concat(batchResults);
      }
    }
    // Dispatch new subscription list
    dispatch(sync(new StrictObjectSet(map(
      (result) => assoc('subscribed', true, result), 
      nextSubscriptionList
    ))));
    // Choose active symbol
    dispatch(_chooseActiveSymbol());
    // Finish
    dispatch(updateLoadingStatus(false));
    dispatch(updateReadyStatus(true));
  }
};

// User action forced resync
const forceResync = (symbol, remove) => (dispatch, getState) => {
  const { stocks } = getState();
  // Dispatch non-ready status
  dispatch(updateReadyStatus(false));
  // Build filtered set of symbols based on subscription
  const symbols = map((stock) => stock.company.symbol, filter((stock) => stock.subscribed, stocks.toArray()));
  // Modify list and resync
  dispatch(resync(remove ? removeItemBySlice(symbol, symbols) : concat([symbol], symbols)));
  // Mark active entry as null on removals
  if (remove) {
    dispatch(markActive(null));
  }
  // Finish
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
