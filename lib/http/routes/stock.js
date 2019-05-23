/**
 * lib/http/routes/stock.js - Stock specific route function
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
const asyncHandler = require('express-async-handler');

const { 
  getBatchSummary, 
  matchClosestSymbol 
} = require('../../stock');
const { createLru } = require('../../cache');
const { MAX_WATCH_LIMIT } = require('../../constants');
const { 
  isString, 
  split, 
  join,
  length
} = require('../../util');

const cache = createLru(5);

const batchSummary = asyncHandler(async (req, res) => {
  ok(isString(req.params.symbols), 'symbols param is not a string');

  const cached = cache.get(req.params.symbols);

  if (cached) {
    req.log.info('batchSummary - cached response found');
    return res.status(200).json(cached);
  }

  const symbols = split(',', req.params.symbols);
  
  if (length(symbols) > MAX_WATCH_LIMIT) {
    return res.status(400).json({
      error: new Error('Max batch limit reached').message
    });
  }
  
  try {
    const batchResultsPromise = getBatchSummary(symbols);
    const batchResults = await batchResultsPromise;
    cache.set(join(',', symbols), batchResults);
    res.status(200).json(batchResults);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

const querySymbol = asyncHandler(async (req, res) => {
  ok(isString(req.params.query), 'query param is not a string');
  
  const cached = cache.get(req.params.query);

  if (cached) {
    req.log.info('querySymbol - cached response: found');
    return res.status(200).json(cached);
  }

  try {
    const matchPromise = matchClosestSymbol(req.params.query);
    const match = await matchPromise;
    cache.set(req.params.query, match);
    res.status(200).json(match);
  } catch (err) {
    if (/^No matches found$/.test(err.message)) {
      return res.status(200).json({
        error: err.message
      });
    }
    
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = {
  batchSummary,
  querySymbol
};
