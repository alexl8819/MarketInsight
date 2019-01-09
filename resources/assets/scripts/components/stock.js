/**
 * components/stock.js - Stock list and stock item components
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
const PropTypes = require('prop-types');
const h = require('react-hyperscript');
const css = require('sheetify');

const { 
  assoc, 
  minimizeText 
} = require('../../../../lib/util');

const customStockStyle = css`
  :host {
    padding: 10px;
  }

  :host:hover {
    background-color: hsl(171, 100%, 31%) !important;
  }

  :host a:hover {
    background: none;
  }
`;

class Stock extends Component {
  constructor (props) {
    super(props); 
    
    this.state = {
      disabled: false
    };
  }
 
  _handleClick (symbol) {
    return (event) => {
      event.preventDefault();      
      this.props.actions.fetchSummary(symbol);
    };
  }

  componentWillMount () {
    this.setState({ 
      disabled: this.props.loading
    });
  }

  componentWillUnmount () {
    this.setState({
      disabled: false
    });
  }
  
  componentWillReceiveProps () {
    this.setState({
      disabled: !!this.props.loading
    });
  }

  render() {
    const { company, quote, selected } = this.props;
    const { symbol, companyName } = company;
    const { change, latestPrice } = quote;
    return h(`li.is-radiusless${selected ? '.active' : ''}.has-background-${selected ? 'white' : 'primary'}` +
      `${(this.state.disabled || selected) ? '.is-disabled' : ''}`, {
      className: customStockStyle
    },
    h('a', {
      href: '#',
      onClick: this._handleClick(symbol)
    }, h('div.columns', {}, [
      h('div.column.is-three-fifths', {}, [
        h('span.title.is-6.is-uppercase', symbol),
        h('div.columns', {},
          h('div.column', {},
            h('p.subtitle.is-7', {},
              minimizeText(companyName, 32, 32)
            )
          )
        )
      ]),
      h('div.column', {}, 
        h('div.has-text-right.has-text-white', {},
          h('span.tag.is-medium', {
            className: change < 0 ? 'is-danger' : 'is-success'
          }, latestPrice) 
        )
      )])
    )
    );
  }
}

Stock.propTypes = {
  symbol: PropTypes.string,
  company: PropTypes.object,
  selected: PropTypes.bool
};

const customListStyle = css`
  :host > .is-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  :host > .active {
    background-color: hsl(0, 0%, 98%);
  }
`;
class StocksList extends Component {
  render () {
    const { stocks, loading } = this.props;
     
    return loading ? null : h('aside.menu', {},
      h('ul.menu-list.has-background-white', {
        className: customListStyle
      }, stocks.map(
        (stock) => h(Stock, assoc('actions', this.props.actions, assoc('loading', loading, stock)))
      ))
    );
  }
}

StocksList.propTypes = {
  stocks: PropTypes.array,
  loading: PropTypes.bool
};

module.exports = { 
  Stock,
  StocksList
};
