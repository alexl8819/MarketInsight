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
const { join } = require('path');
const { createReadStream } = require('fs');
const pump = require('pump');
const express = require('express');
const asyncHandler = require('express-async-handler');

const { listDir, renderAsset } = require('../../util');
const { ASSET_ROUTE, MAIN_ASSET_PATH } = require('../../constants');

const mainRoute = asyncHandler(async (req, res) => {
  const files = await listDir(MAIN_ASSET_PATH);
  
  if (res.push) {
    req.log.info('Push enabled request');
    // Push non-html assets
    files.filter((file) => file.indexOf('.html') === -1)
    .forEach((assetFile) => {
	const source = createReadStream(join(MAIN_ASSET_PATH, assetFile));
      pump(source, res.push(`${ASSET_ROUTE}/${assetFile}`, {
	request: {
	  accept: '*/*'
	},
	response: {
	  'content-type': express.static.mime.lookup(assetFile)
	}
      }), (err) => {
        if (err) {
	  req.log.error(err)
	}
      });
    });
  }
  const htmlPath = files.find((file) => file.indexOf('.html') > -1) || 'index.html';
  const html = await renderAsset(join(MAIN_ASSET_PATH, htmlPath));
  res.set('Content-Type', 'text/html');
  await res.end(html);
});

const notFoundRoute = asyncHandler(async (req, res) => {
  await res.status(404).end('Route not found');
});

module.exports = {
  mainRoute,
  notFoundRoute
};
