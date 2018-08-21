/**
 * components/navigation.js - Navigation component
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
const h = require('react-hyperscript');
const css = require('sheetify');

const { Query } = require('../containers');

const { APP_NAME } = require('../../../../lib/constants');

const customNavStyle = css`
  @media screen and (max-width: 768px) {
    :host .navbar-brand > .navbar-item {
      width: 150px;
      margin-left: auto;
      margin-right: auto;
    }
  }
  
  :host .navbar-brand {
    font-family: 'Oxygen', sans-serif;
    height: auto;
  }
`;

module.exports = () => {
  return h('nav.navbar.is-transparent', {
    className: customNavStyle
  }, [
    h('div.navbar-brand.has-background-primary', {}, 
      h('div.navbar-item.has-text-white.has-text-centered', {}, [
        h('span.is-size-6.is-unselectable', {}, APP_NAME),
        h('span.icon.is-medium', {}, 
          h('i.ion-arrow-graph-up-right', {})
        )
      ])
    ),
    h('div.navbar-start', {}, 
      h('div.navbar-item.has-background-white', {},
        h(Query, {})
      )
    )
  ]);
};
