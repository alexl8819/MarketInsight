/**
 * lib/stock.js - Stock specific data manipulation utilities
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
const TrieSearch = require('trie-search');
const approx = require('approximate-number');
const logger = require('pino')();

const {
  fetchJSON,
  forEach,
  keys,
  map,
  reduceToProp, 
  take,
  pick, 
  trim,
  trimArray,
  contains,
  flattenToArray, 
  isStringArray,
  uppercaseArray,
  lowercaseArray,
  filterEmpty,
  pickOut,
  isNumber,
  isString,
  assoc
} = require('./util');

const { 
  IEX_AVAIL_SYMBOLS_API, 
  IEX_STOCK_API,
  STOCK_BATCH_INTERESTED_ENDPOINTS,
  STOCK_QUOTE_WANTED_VALUES,
  STOCK_NEWS_WANTED_VALUES,
  STOCK_CHART_WANTED_VALUES,
  HOURLY_INTERVAL_MILLIS 
} = require('./constants');

class TradeableSymbols {
  constructor () {
    this._stocks = [];
    this._updateHandler = setInterval(this._runUpdate, HOURLY_INTERVAL_MILLIS);
    this._runUpdate();
  }

  get current () {
    return reduceToProp('symbol', this._stocks);
  }

  get stocks () {
    return this._stocks; 
  }

  async _runUpdate () {
    try {
      const stocksPromise = fetchJSON(IEX_AVAIL_SYMBOLS_API);
      this._stocks = await stocksPromise;
    } catch (err) {
      logger.error(err);
    }
  }

  stop () {
    if (this._updateHandler) {
      clearInterval(this._updateHandler);
    }
  }
}

const tradeableSymbols = new TradeableSymbols();

async function matchClosestSymbol (query, max=10) { // 100
  ok(isString(query), 'query is not a string');
  // Build new trie to search from 
  const tree = new TrieSearch(['symbol', 'name']);
  // Add all stocks to tree
  tree.addAll(pickOut(['symbol', 'name'], tradeableSymbols.stocks));
  // Normalize query
  const normalized = trim(query);
  // Find matches
  const matches = tree.get(normalized);
  // Limit to n matches
  const subset = take(max, matches);
  // Just throw if no matches found 
  if (!subset.length) {
    throw new Error('No matches found');
  }
  // Fetch additional info (prices and logos)
  const batchAdditionalPromise = fetchJSON(
    `${IEX_STOCK_API}/market/batch?symbols=${lowercaseArray(reduceToProp('symbol', subset)).join(',')}&types=price,logo`
  );
  const batchAddional = await batchAdditionalPromise;
  // Return a structured subset of stocks
  return map((stock) => ({ 
    company: {
      symbol: stock.symbol, 
      logo: batchAdditional[stock.symbol].logo.url, 
      companyName: stock.name 
    },
    quote: {
      latestPrice: (isNumber(batchAdditional[stock.symbol].price) 
        ? `$${batchAdditional[stock.symbol].price.toFixed(2)}` : 0.00)
    }
  }), pickOut(['name', 'symbol'], subset));
}

async function getBatchSummary (symbols, since='2y') {
  ok((Array.isArray(symbols) && isStringArray(symbols)), 'symbols is not a string array');
  // Normalize symbols
  const normalizedSymbols = filterEmpty(trimArray(symbols));
  // Uppercase all symbols
  const uppercaseSymbols = uppercaseArray(normalizedSymbols);
  // Check all symbols are valid
  forEach((symbol) => {
    if (!contains(symbol, tradeableSymbols.current)) {
      throw new Error(`getBatchSummary: ${symbol} is not a valid symbol`);
    }
  }, uppercaseSymbols);
  // Fetch stock summary batch
  const stockBatchPromise = fetchJSON(
    `${IEX_STOCK_API}/market/batch?symbols=${lowercaseArray(normalizedSymbols).join(',')}&types=${STOCK_BATCH_INTERESTED_ENDPOINTS.join(',')}&range=${since}`
  );
  const stockBatch = await stockBatchPromise;
  // Iterate and modify specific values
  return map((key) => {
    const stock = stockBatch[key];
    // Modify quote values
    const quoteSubset = pick(STOCK_QUOTE_WANTED_VALUES, stock.quote);
    // Format prices
    const formattedOpen = assoc('open', 
      (isNumber(quoteSubset.open) ? quoteSubset.open.toFixed(2) : '--'), 
      quoteSubset
    );
    const formattedHigh = assoc('high', 
      (isNumber(quoteSubset.high) ? quoteSubset.high.toFixed(2) : '--'), 
      formattedOpen
    );
    const formattedLow = assoc('low', 
      (isNumber(quoteSubset.low) ? quoteSubset.low.toFixed(2) : '--'), 
      formattedHigh
    );
    const formattedLatestPrice = assoc('latestPrice', 
      (isNumber(quoteSubset.latestPrice) ? `$${quoteSubset.latestPrice.toFixed(2)}` : 0.00), 
      formattedLow
    );
    const formattedWeekHigh = assoc('week52High',
      (isNumber(quoteSubset.week52High) ? quoteSubset.week52High.toFixed(2) : '--'),
      formattedLatestPrice
    );
    const formattedWeekLow = assoc('week52Low',
      (isNumber(quoteSubset.week52Low) ? quoteSubset.week52Low.toFixed(2) : '--'),
      formattedWeekHigh
    );
    const formattedLatestVolume = assoc('latestVolume',
      (isNumber(quoteSubset.latestVolume) ? approx(quoteSubset.latestVolume) : '--' ),
      formattedWeekLow
    );
    const formattedMarketCap = assoc('marketCap',
      (isNumber(quoteSubset.marketCap) ? approx(quoteSubset.marketCap) : '--' ),
      formattedLatestVolume
    );
    const formattedAvgVolume = assoc('avgTotalVolume',
      (isNumber(quoteSubset.avgTotalVolume) ? approx(quoteSubset.avgTotalVolume) : '--'),
      formattedMarketCap
    );
    const formattedChange = assoc('change', 
      (isNumber(quoteSubset.change) ? 
        (quoteSubset.change > 0 ? `+${quoteSubset.change}` : quoteSubset.change) : '--'),
      formattedAvgVolume
    );
    const formattedChangePercent = assoc('changePercent',
      (isNumber(quoteSubset.changePercent) ? `${quoteSubset.changePercent.toFixed(4)}%` : '--'),
      formattedChange
    );
    // Update quote data
    const moddedQuoteSubset = assoc('quote', formattedChangePercent, stock);
    // Modify news data
    const newsSubset = map(pick(STOCK_NEWS_WANTED_VALUES), 
      moddedQuoteSubset.news
    );
    const moddedNewsSubset = assoc('news', newsSubset, moddedQuoteSubset);
    // Modify chart values
    const chartSubset = map(pick(STOCK_CHART_WANTED_VALUES), moddedNewsSubset.chart);
    // Parse date value as timestamp
    const timestamped = map((series) => ({
      date: Date.parse(series.date),
      close: series.close
    }), chartSubset);
    // Flatten and merge together
    return assoc('chart', flattenToArray(timestamped), moddedNewsSubset);
  }, keys(stockBatch));
}

module.exports = {
  getBatchSummary,
  matchClosestSymbol,
  tradeableSymbols
};
