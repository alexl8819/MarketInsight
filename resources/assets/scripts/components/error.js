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

const { isNil } = require('../../../../lib/util');

class ErrorToast extends Component {
  shouldComponentUpdate (nextProps, nextState) {
    return nextProps.error !== this.props.error;
  }
  
  componentDidUpdate () {
    this.showToast(this.props.error);
  }

  showToast (error) {
    if (isNil(error) || !(error instanceof Error)) {
      return;
    }

    toast({
      duration: 3000,
      type: 'is-danger',
      position: 'bottom-center',
      dismissable: true,
      message: error.message
    });

    this.props.actions.updateErrorStatus(null);
  }

  render () {
    return null;
  }
};

ErrorToast.propTypes = {
  error: PropTypes.instanceOf(Error)
}

module.exports = ErrorToast;
