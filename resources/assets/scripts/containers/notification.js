/**
 * containers/notification.js - Notification container
 * Copyright (C) 2018 alexl8819
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

const { updateAlertStatus } = require('../actions');
const Alert = require('../components/alert');

const { pick } = require('../../../../lib/util');

const mapStateToProps = (state) => pick(['alert'], state);

const mapDispatcherToProps = (dispatch) => ({
  actions: bindActionCreators({ 
    updateAlertStatus
  }, dispatch)
});

module.exports = connect(
  mapStateToProps,
  mapDispatcherToProps
)(Alert);
