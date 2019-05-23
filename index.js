/**
 * index.js - HTTP server bootstrap
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
const { readFileSync } = require('fs');
const { createServer } = require('spdy');
const express = require('express');
const debug = require('debug')('http');

const middleware = require('./lib/http/middleware').default;
const router = require('./lib/http/router');
const { 
  BasicMarketWatchStore, 
  RedisMarketWatchStore 
} = require('./lib/store');
const { 
  MAIN_ASSET_PATH, 
  ASSET_ROUTE 
} = require('./lib/constants');

const app = express();

app.use(middleware);
app.use(ASSET_ROUTE, express.static(MAIN_ASSET_PATH));
app.use(router);

const server = createServer(
  process.env.NODE_ENV === 'production' ? {
    key: readFileSync(process.env.KEY_PATH),
    cert: readFileSync(process.env.CERT_PATH)
  } : require('spdy-keys'), app);

const bound = server.listen(process.env.PORT || 9000, () => {
  const config = {
    perMessageDeflate: true,
    server
  };

  process.env.NODE_ENV === 'production' ? 
    RedisMarketWatchStore.start(config) : BasicMarketWatchStore.start(config);
  debug(`Listening on port ${bound.address().port}`);
});
