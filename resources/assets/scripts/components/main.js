/**
 * components/main.js - Main component
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
const { PureComponent, Fragment } = require('react');
const PropTypes = require('prop-types');
const h = require('react-hyperscript');

const { APP_VERSION } = require('../../../../lib/constants');

const Navigation = require('./navigation');
const { 
  Active,
  VisibleStocksList 
} = require('../containers');

const Loading = require('./loading');

class Main extends PureComponent {
  componentWillMount () {
    this.props.actions.startConnect(window.location.host);
  }

  componentWillUnmount () {
    this.props.actions.forceDisconnect();
  }

  render () {
    return this.props.connected && this.props.ready ? h(Fragment, {}, [
      h('header.header', {}, 
        h(Navigation, {})
      ),
      h('main.content', {}, 
        h('div.columns.is-gapless', {}, [
          h('div.column.is-one-quarter', {},
            h(VisibleStocksList, {})
          ),
          h('div.column', {}, 
            h(Active, {})
          )
        ])
      ),
      h('footer.footer', {}, 
        h('div.content.has-background-white.has-text-centered', {}, h('p', {}, h('small', {}, `v${APP_VERSION}`))))
    ]) : h(Loading, {});
  }
}

Main.defaultProps = {
  connected: false,
  ready: false
};

Main.propTypes = {
  connected: PropTypes.bool.isRequired,
  ready: PropTypes.bool.isRequired
};

module.exports = Main;
