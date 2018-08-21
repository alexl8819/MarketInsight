/**
 * lib/http/routes/default.js - Default route functions
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

const { renderHTML } = require('../../util');
const { MAIN_TEMPLATE_PATH } = require('../../constants');

const mainRoute = asyncHandler(async (req, res) => {
  const html = await renderHTML(MAIN_TEMPLATE_PATH);
  await res.end(html);
});

const notFoundRoute = asyncHandler(async (req, res) => {
  await res.status(404).json({
    message: 'Route not found'
  });
});

module.exports = {
  mainRoute,
  notFoundRoute
};
