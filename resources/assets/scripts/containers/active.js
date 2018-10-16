/**
 * container/active.js - Active stock container
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

const { forceResync } = require('../actions');
const Summary = require('../components/summary');

// const { matchByKey } = require('../../../../lib/util');

const mapStateToProps = (state) => ({
  selected: state.stocks.toArray().find(
    (stock) => stock.company.symbol === state.active
  )
  /*selected: matchByKey(
    'company',
    'symbol',
    state.active, 
    state.stocks.toArray()
  )*/
});

const mapDispatcherToProps = (dispatch) => ({
  actions: bindActionCreators({
    forceResync
  }, dispatch)
});

module.exports = connect(
  mapStateToProps,
  mapDispatcherToProps
)(Summary);
