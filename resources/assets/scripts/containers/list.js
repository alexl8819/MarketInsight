/**
 * containers/list.js - Visible Stock List container
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
const { connect } = require('react-redux');
const { bindActionCreators } = require('redux');

const { fetchSummary } = require('../actions');
const { StocksList } = require('../components/stock');

const { 
  assoc, 
  map 
} = require('../../../../lib/util');

const mapStateToProps = (state) => ({ 
  stocks: map(
    (stock) => assoc('selected', stock.company.symbol === state.active, stock),
    state.stocks.toArray()
  ), 
  loading: state.loading
});

const mapDispatcherToProps = (dispatch) => ({
  actions: bindActionCreators({
    fetchSummary
  }, dispatch)
});

module.exports = connect(
  mapStateToProps,
  mapDispatcherToProps
)(StocksList);
