/**
 * index.js - App bootstrap
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
require('core-js/fn/promise'); // Polyfill promises for older browsers

const { render } = require('react-dom');
const h = require('react-hyperscript');
const ready = require('document-ready');

const Root = require('./components/root');

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('rootElement (#app) was not found. Unable to proceed');
}

// Render UI when ready
ready(() => render(h(Root, {}), rootElement));
