/**
 * components/summary.js - Summary component
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

const Chart = require('./chart');
const Article = require('./article');

const { minimizeText } = require('../../../../lib/util');

const customComponentStyle = css`
  @media screen and (min-width: 769px) {
    :host {
      padding: 0.8rem 1.5rem;
    }
  }

  :host > .columns {
    border-top: 1px solid hsl(0, 0%, 86%);
  }
`;

const customSpanStyle = css`
  :host {
    margin-right: 10px;
  }
`;

const customStatsStyle = css`
  :host {
    margin-top: 10px;
    border-top: 1px dashed #d6d3d3;
    border-bottom: 1px dashed #d6d3d3;
  }
`;

const customNewsStyle = css`
  :host {
    margin-top: 10px;
  }
`;

class Summary extends Component {
  _handleClick (symbol, shouldRemove) {
    return (event) => {
      event.preventDefault();
      this.props.actions.forceResync(symbol, shouldRemove);
    };
  }

  shouldComponentUpdate (nextProps) {
    return nextProps.selected !== this.props.selected;
  }

  render () {
    if (!this.props.selected) {
      return null;
    }

    const {
      quote,
      company,
      news,
      chart,
      subscribed
    } = this.props.selected;
    
    return h('section.section.has-background-white', { 
      className: customComponentStyle 
    }, h('div.container.is-fluid', {}, [
      h('div.level', {}, [
        h('div.level-left', {},
          h('div.content.has-text-left', {}, [
            h('h3.title.is-size-3', {}, minimizeText(company.companyName, 32, 32)),
            h('h4.subtitle.is-size-4', {}, [
              h('span', {
                className: customSpanStyle
              }, quote.latestPrice),
              h('span', {
                className: quote.change && quote.change.length > 0 && quote.change[0] === '+' ? 'has-text-success' : 'has-text-danger'
              }, quote.change)
            ])
          ])
        ),
        h('div.level-right', {}, [ 
          h('div.content.has-text-right', {}, [
            h('h5.is-size-5.is-uppercase.has-text-right.has-text-weight-bold', {}, company.symbol),
            h('p.buttons', {}, 
              h('button.button.is-fullwidth', {
                className: subscribed ? 'is-danger' : 'is-primary',
                onClick: this._handleClick(company.symbol, subscribed)
              }, [
                h('span.icon', {}, 
                  h('i', {
                    className: subscribed ? 'ion-ios-bell' : 'ion-ios-bell-outline'
                  })
                ),
                h('span', {}, subscribed ? 'Unsubscribe' : 'Subscribe')
              ])
            )
          ])
        ])
      ]),
      h(Chart, { 
        series: {
          id: company.symbol,
          name: company.symbol,
          data: chart
        }
      }),
      h('div.columns', {
        className: customStatsStyle
      }, [
        h('div.column.is-half', {}, 
          h('div.content', {}, [
            h('h5.title.is-size-5', {}, 'Stats'),
            h('table.table', {}, [
              h('tbody', {}, [
                h('tr', {}, [
                  h('td.has-text-grey.is-uppercase', {}, 'open'),
                  h('td.has-text-weight-bold.is-uppercase', {}, quote.open),
                  h('td.has-text-grey.is-uppercase', {}, 'volume'),
                  h('td.has-text-weight-bold.is-uppercase', {}, quote.latestVolume)
                ]),
                h('tr', {}, [
                  h('td.has-text-grey.is-uppercase', {}, 'high'),
                  h('td.has-text-weight-bold.is-uppercase', {}, quote.high),
                  h('td.has-text-grey.is-uppercase', {}, 'avg volume'),
                  h('td.has-text-weight-bold.is-uppercase', quote.avgTotalVolume)
                ]),
                h('tr', {}, [
                  h('td.has-text-grey.is-uppercase', {}, 'low'),
                  h('td.has-text-weight-bold.is-uppercase', {}, quote.low),
                  h('td.has-text-grey.is-uppercase', {}, 'mkt cap'),
                  h('td.has-text-weight-bold.is-uppercase', {}, quote.marketCap)
                ]),
                h('tr', {}, [
                  h('td.has-text-grey.is-uppercase', {}, '52 wk high'),
                  h('td.has-text-weight-bold.is-uppercase', {}, quote.week52High),
                  h('td.has-text-grey.is-uppercase', {}, 'p/e ratio'),
                  h('td.has-text-weight-bold.is-uppercase', {}, quote.peRatio)
                ]),
                h('tr', {}, [
                  h('td.has-text-grey.is-uppercase', {}, '52 wk low'),
                  h('td.has-text-weight-bold.is-uppercase', {}, quote.week52Low)
                ])
              ])    
            ])          
          ])
        ),
        h('div.column', {}, 
          h('div.content', {}, [
            h('h5.title.is-size-5', {}, 'About'),
            h('p', {}, company.description)
          ])
        )
      ]),
      h('div.content', { className: customNewsStyle }, [
        h('h5.title.is-size-5', {}, 'News'),
        news.map((article, index) => h(Article, { key: (Date.now() * index), article, index }))
      ])
    ])
    );
  }
}

Summary.propTypes = {
  selected: PropTypes.exact({
    quote: PropTypes.object.isRequired,
    company: PropTypes.object.isRequired,
    news: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
    chart: PropTypes.array.isRequired, //.arrayOf(PropTypes.number).isRequired,
    subscribed: PropTypes.bool.isRequired
  })
};

module.exports = Summary;
