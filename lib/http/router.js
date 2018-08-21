/**
 * lib/http/router.js - Router
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
const { Router } = require('express');

const { 
  mainRoute, 
  notFoundRoute 
} = require('./routes').default;
const { 
  batchSummary, 
  querySymbol 
} = require('./routes').stock;

const checkSymbolsExist = require('./middleware').custom;

const {
  MAIN_ROUTE, 
  STOCKS_API_BATCH_SUMMARY_ROUTE,
  STOCKS_API_PARTIAL_MATCH_ROUTE 
} = require('../constants');

const router = Router();

// Main route
router.get(MAIN_ROUTE, mainRoute);
// Stocks API
router.get(
  STOCKS_API_BATCH_SUMMARY_ROUTE, 
  checkSymbolsExist, 
  batchSummary
);
router.get(
  STOCKS_API_PARTIAL_MATCH_ROUTE, 
  checkSymbolsExist,
  querySymbol
);
// 404 routes
router.use(notFoundRoute);

module.exports = router;
