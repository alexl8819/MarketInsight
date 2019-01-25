/**
 * components/chart.js - Chart component
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
const Highstock = require('highcharts/highstock');
const PropTypes = require('prop-types');
const h = require('react-hyperscript');

const { assoc } = require('../../../../lib/util');

const { DEFAULT_CHART_OPTIONS } = require('../../../../lib/constants');

require('highcharts/modules/exporting')(Highstock);

// structure: { name: 'MSFT' as String, data: data as JSON }

class Chart extends Component {
  constructor (props) {
    super(props);

    this.state = {
      chart: null,
      series: {}
    };
  }

  _renderChart () {
    this.state.chart = Highstock.stockChart('chart', 
      assoc('series', [ this.props.series ], DEFAULT_CHART_OPTIONS)
    );
    this.setState({
      series: this.props.series
    });
  }

  shouldComponentUpdate (nextProps, nextState) {
    return nextProps.series.name !== this.props.series.name;
  }

  componentWillUnmount () {
    this.state.chart.destroy();
    this.state.chart = null;
  }
 
  componentDidUpdate () {
    if (!this.state.series.hasOwnProperty('name')) {
      return;
    }

    const selectedSeries = this.state.chart.get(this.state.series.name);
    
    if (selectedSeries) {
      selectedSeries.remove();
    
      this.state.chart.addSeries(this.props.series);
      this.setState({
        series: this.props.series
      });
    }
  }

  componentDidMount () {
    this._renderChart();
  }

  render () {
    return h('div#chart', {});
  }
};

Chart.defaultProps = {
  series: []
};

Chart.propTypes = {
  series: PropTypes.object.isRequired
};

module.exports = Chart;
