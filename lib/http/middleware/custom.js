/**
 * lib/http/middleware/custom.js - Custom middleware
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
const asyncHandler = require('express-async-handler');

const { tradeableSymbols } = require('../../../lib/stock');
const { isEmpty } = require('../../../lib/util');

module.exports = asyncHandler(async (req, res, next) => {
  if (isEmpty(tradeableSymbols.current)) {
    return res.status(503).json({
      error: new Error('tradeableSymbols: Latest symbols have not yet been fetched. Please try again later.').message
    });
  }

  await next();
});
