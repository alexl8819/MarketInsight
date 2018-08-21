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
const cache = require('../../cache')(5);
const { MAX_WATCH_LIMIT } = require('../../constants');

const batchSummary = asyncHandler(async (req, res) => {
  ok(typeof req.params.symbols === 'string', 'symbols param is not a string');

  const cached = cache.get(req.params.symbols);

  if (cached) {
    req.log.info('batchSummary - cached response found');
    return res.status(200).json(cached);
  }

  const symbols = req.params.symbols.split(',');
  
  if (symbols.length > MAX_WATCH_LIMIT) {
    return res.status(400).json({
      error: new Error('Max batch limit reached').message
    });
  }
  
  try {
    const batchResults = await getBatchSummary(symbols);
    cache.set(symbols.join(','), batchResults);
    await res.status(200).json(batchResults);
  } catch (err) {
    await res.status(500).json({
      error: err.message
    });
  }
});

const querySymbol = asyncHandler(async (req, res) => {
  ok(typeof req.params.query === 'string', 'query param is not a string');
  
  const cached = cache.get(req.params.query);

  if (cached) {
    req.log.info('querySymbol - cached response: found');
    return res.status(200).json(cached);
  }

  try {
    const match = await matchClosestSymbol(req.params.query);
    cache.set(req.params.query, match);
    await res.status(200).json(match);
  } catch (err) {
    if (/^No matches found$/.test(err.message)) {
      return res.status(200).json({
        error: err.message
      });
    }
    
    await res.status(500).json({
      error: err.message
    });
  }
});

module.exports = {
  batchSummary,
  querySymbol
};
