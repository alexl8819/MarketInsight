/**
 * components/search.js - Search component
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
const debounce = require('debounce');
const h = require('react-hyperscript');
const css = require('sheetify');
const PropTypes = require('prop-types');

const SearchResult = require('./result');

const { 
  trim,
  assoc,
  map
} = require('../../../../lib/util');

const customSearchInputStyle = css`
  :host {
    width: 100%;
  }

  :host:disabled {
    background-color: transparent;
  }
`;

const customDropdownStyle = css`
  :host, 
  :host > .dropdown, 
  .dropdown > .dropdown-trigger, 
  .dropdown-trigger > .field,
  .field > .control,
  .control > .input {
    width: 100%;
  }
`;

const INITIAL_STATE = {
  query: '',
  isFetching: false
};

class Search extends Component {
  constructor (props) {
    super(props);
    
    this.state = INITIAL_STATE;
  }

  _resetQuery () {
    this.setState(INITIAL_STATE);
  }

  _handleChange (event) { 
    const query = event.target.value;
    
    if (/\s+/g.test(query)) {
      this.setState({ 
        query: trim(query) 
      });
      return false;
    }

    this.setState({
      query: query,
      isFetching: true 
    });
    this.handleChangeDebounced();
  }

  componentWillMount () {
    this.handleChangeDebounced = debounce(() => {
      if (this.state.query.length < 1) {
        return;
      }

      this.props.actions.runSymbolQuery(this.state.query);
    }, 600);
  }

  render () {
    const { connected, results } = this.props;
    return h('div', { className: customDropdownStyle },
      h('div', {
        className: connected && this.state.isFetching ? 'dropdown is-active' : 'dropdown'
      }, [
        h('div.dropdown-trigger', {}, 
          h('div.field', {}, 
            h('div.control.has-icons-left', {
              className: connected && this.state.isFetching ? 'is-loading': ''
            }, [ 
              h('input.input.is-shadowless.is-borderless.is-transparent', {
                type: 'text',
                className: customSearchInputStyle,
                placeholder: 'Search for symbol',
                onChange: this._handleChange.bind(this),
                value: this.state.query,
                disabled: !connected
              }),
              h('span.icon.is-left', {}, h('i.ion-ios-search.strong', {}))
            ])
          )
        ),
        h('div#dropdown-menu.dropdown-menu', { 
          role: 'menu',
          className: customDropdownStyle 
        }, 
          h('div.dropdown-content', {}, !results.length 
            ? h('div.dropdown-item.is-unselectable', {}, 'No results found') 
            : map((result) => h(SearchResult, assoc('actions', 
                assoc('reset', this._resetQuery.bind(this), this.props.actions), result)
              ), results)
        ))
      ])
    )
  }
};

Search.defaultProps = {
  connected: false,
  results: []
};

Search.propTypes = {
  connected: PropTypes.bool.isRequired,
  results: PropTypes.arrayOf(PropTypes.object).isRequired
};

module.exports = Search;
