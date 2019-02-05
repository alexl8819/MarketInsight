/**
 * components/error.js - Error toast component
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
const { Component } = require('react');
const { toast } = require('bulma-toast');
const PropTypes = require('prop-types');

const { isEmpty } = require('../../../../lib/util');

class Alert extends Component {
  shouldComponentUpdate (nextProps) {
    return nextProps.alert !== this.props.alert;
  }
  
  componentDidUpdate () {
    this.showToast(this.props.alert);
  }

  showToast (alert) {
    if (isEmpty(alert)) {
      return;
    }

    toast({
      duration: 3000,
      type: alert.isError ? 'is-danger' : 'is-success',
      position: 'bottom-center',
      dismissable: true,
      message: alert.message
    });

    this.props.actions.updateAlertStatus({});
  }

  render () {
    return null;
  }
}

Alert.defaultProps = {
  alert: {}
};

Alert.propTypes = {
  alert: PropTypes.shape({
    message: PropTypes.string,
    isError: PropTypes.bool
  })
};

module.exports = Alert;
