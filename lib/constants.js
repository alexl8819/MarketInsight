/**
 * lib/constants.js - Global constants
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
const {
  name,
  version
} = require('../package.json');
// App name and version 
exports.APP_NAME = name;
exports.APP_VERSION = version;
// Key format for redis usage
exports.REDIS_KEY = `${APP_NAME}-${APP_VERSION}_`;
// Main action types
exports.UPDATE_CONNECTION_STATUS = 'UPDATE_CONNECTION_STATUS';
exports.UPDATE_READY_STATUS = 'UPDATE_READY_STATUS';
exports.UPDATE_LOADING_STATUS = 'UPDATE_LOADING_STATUS';
exports.UPDATE_ALERT_STATUS = 'UPDATE_ALERT_STATUS';
exports.APPLY_RESULTS = 'APPLY_RESULTS';
exports.MARK_ACTIVE = 'MARK_ACTIVE';
exports.SYNC = 'SYNC';
exports.WS_START_CONNECT = 'WS:CONNECT';
exports.WS_FORCE_DISCONNECT = 'WS:FORCE_DISCONNECT';
exports.WS_FORCE_RESYNC = 'WS:FORCE_RESYNC';
// Placeholders
exports.PLACEHOLDER_32X32_ICON = 'https://bulma.io/images/placeholders/32x32.png';
exports.PLACEHOLDER_32X32_NEWS_ICON = 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDMyIDMyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzMiAzMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSIzMnB4IiBoZWlnaHQ9IjMycHgiPgo8Zz4KCTxnPgoJCTxwYXRoIGQ9Ik0yOCw3VjNIMHYyMmMwLDAsMCw0LDQsNGgyNWMwLDAsMy0wLjA2MiwzLTRWN0gyOHogTTQsMjdjLTIsMC0yLTItMi0yVjVoMjR2MjAgICAgYzAsMC45MjEsMC4yODQsMS41NTksMC42NzYsMkg0eiIgZmlsbD0iIzAwMDAwMCIvPgoJCTxyZWN0IHg9IjQiIHk9IjkiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyIiBmaWxsPSIjMDAwMDAwIi8+CgkJPHJlY3QgeD0iMTUiIHk9IjIxIiB3aWR0aD0iNyIgaGVpZ2h0PSIyIiBmaWxsPSIjMDAwMDAwIi8+CgkJPHJlY3QgeD0iMTUiIHk9IjE3IiB3aWR0aD0iOSIgaGVpZ2h0PSIyIiBmaWxsPSIjMDAwMDAwIi8+CgkJPHJlY3QgeD0iMTUiIHk9IjEzIiB3aWR0aD0iOSIgaGVpZ2h0PSIyIiBmaWxsPSIjMDAwMDAwIi8+CgkJPHJlY3QgeD0iNCIgeT0iMTMiIHdpZHRoPSI5IiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==';
// Third party APIs
exports.IEX_AVAIL_SYMBOLS_API = 'https://api.iextrading.com/1.0/ref-data/symbols';
exports.IEX_STOCK_API = 'https://api.iextrading.com/1.0/stock';
// Interested endpoints we care about
exports.STOCK_BATCH_INTERESTED_ENDPOINTS = ['quote', 'news', 'chart', 'company'];
exports.STOCK_QUOTE_WANTED_VALUES = ['open', 'high', 'low', 'week52High', 'week52Low', 'change', 'changePercent', 'latestPrice', 'latestVolume', 'avgTotalVolume', 'marketCap', 'peRatio'];
exports.STOCK_NEWS_WANTED_VALUES = ['datetime', 'headline', 'source', 'url', 'image'];
exports.STOCK_CHART_WANTED_VALUES = ['date', 'close'];
// Routes
exports.MAIN_ROUTE = '/';
exports.ASSET_ROUTE = '/static';
// API endpoints
exports.STOCKS_API_BATCH_SUMMARY_ROUTE = '/stock/1.0/:symbols/batchSummary';
exports.STOCKS_API_PARTIAL_MATCH_ROUTE = '/stock/1.0/:query/match';
//
exports.HOURLY_INTERVAL_MILLIS = 60 * 60 * 1000;
exports.MAX_TIMEOUT_MILLIS = 30 * 1000;
exports.DISCONNECT_RETRY_MILLIS = 60 * 1000;
exports.MAX_WATCH_LIMIT = 10;
exports.MAX_RECONNECT_ATTEMPTS = 5;
// Paths
exports.MAIN_ASSET_PATH = join(__dirname, '../public');
// HTTP result schemas
exports.SYMBOL_QUERY_SCHEMA = {
  required: true,
  type: 'array'
};
exports.BATCH_SUMMARY_SCHEMA = {
  required: true,
  type: 'array'
};
// Chart options
exports.DEFAULT_CHART_OPTIONS = {
  chart: {
    height: 600
  },
  colors: ['#00D1B2'],
  rangeSelector: {
    selected: 1
  },
  yAxis: {
    labels: {
      formatter: function () {
        return (this.value > 0 ? ' + ' : '') + this.value + '%';
      }
    },
    plotLines: [{
      value: 0,
      width: 2,
      color: 'silver'
    }]
  },
  plotOptions: {
    series: {
      compare: 'percent',
      showInNavigator: true
    }
  },
  tooltip: {
    pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
    valueDecimals: 2,
    split: true
  },
  responsive: {
    rules: [{
      condition: {
        maxWidth: 500
      },
      chartOptions: {
        chart: {
          height: 400
        },
        subtitle: {
          text: null
        },
        navigator: {
          enabled: false
        }
      }
    }]
  }
};
