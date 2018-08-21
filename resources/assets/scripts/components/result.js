/**
 * components/result.js - Search result component
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
const Image = require('react-image-resizer').default;
const PropTypes = require('prop-types');
const h = require('react-hyperscript');

const { PLACEHOLDER_32X32_ICON } = require('../../../../lib/constants');
const { minimizeText } = require('../../../../lib/util');

class SearchResult extends Component {
  _handleClick (symbol) {
    return (event) => {
      event.preventDefault();
      this.props.actions.reset();
      this.props.actions.fetchSummary(symbol);
    };
  }

  render () {
    const { symbol, logo, companyName } = this.props.company;
    return h('div', {}, [
      h('a.dropdown-item', {
        href: '#',
        onClick: this._handleClick(symbol)
      }, h('article.media', {}, [
        h('figure.media-left', {}, 
          h('div.image', {}, 
            h(Image, {
              alt: symbol,
              src: logo,
              noImageSrc: PLACEHOLDER_32X32_ICON,
              height: 28,
              width: 28
            })
          )
        ),
        h('div.media-content', {}, 
          h('div.content', {}, 
            h('p', {}, [
              h('strong', {}, symbol),
              h('br', {}),
              h('span', {}, minimizeText(companyName, 16, 24)) 
            ])
          )
        )
      ]))
    ]);
  }
}

SearchResult.propTypes = {
  symbol: PropTypes.string,
  logo: PropTypes.string,
  companyName: PropTypes.string
};

module.exports = SearchResult;
