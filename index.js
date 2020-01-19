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
require('make-promises-safe');

const { join } = require('path');
const { readFileSync } = require('fs');
const { createServer } = require('http');
const express = require('express');
const debug = require('debug')('http');

const { tradeableSymbols } = require('./lib/stock');
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

const server = createServer(app);

const bound = server.listen(process.env.PORT || 9000, async () => {
  const config = Object.freeze({
    perMessageDeflate: true,
    server
  });
  // Update known symbol list
  await tradeableSymbols.update();
  // Start specific store based on env
  let store;
  if (process.env.NODE_ENV === 'production') {
    store = await RedisMarketWatchStore.start(config);
  } else {
    store = await BasicMarketWatchStore.start(config);
  }

  if (!store) {
    throw new Error('bootstrap: Unable to initialize store');
  }

  // Handle incoming interrupts
  process.on('SIGINT', async () => {
    try {
      const stopPromise = store.stop();
      await stopPromise;
    } catch (err) {
      console.error(err);
      return process.exit(1);
    }
    process.exit(0);
  }); 
  debug(`Listening on port ${bound.address().port}`);
});
