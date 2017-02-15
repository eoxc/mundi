import Marionette from 'backbone.marionette';

import template from './ExtraParametersListView.hbs';
import './ExtraParametersListView.css';

import ExtraParameterRangeView from './ExtraParameterRangeView';
import ExtraParameterSelectView from './ExtraParameterSelectView';
import ExtraParameterPlainView from './ExtraParameterPlainView';

const ExtraParametersListView = Marionette.CompositeView.extend({
  template,
  className: 'panel panel-default',

  initialize(options) {
    this.filtersModel = options.filtersModel;
  },

  childViewContainer: '#collapse-additional-filters',
  getChildView(parameter) {
    if (parameter.get('range')) {
      return ExtraParameterRangeView;
    } else if (parameter.get('options')) {
      return ExtraParameterSelectView;
    }
    return ExtraParameterPlainView;
  },

  childEvents: {
    'value:unset': 'onParameterValueUnset',
    'value:change': 'onParameterValueChange',
  },
  onParameterValueUnset(childView, type) {
    this.filtersModel.unset(type);
  },
  onParameterValueChange(childView, type, value) {
    this.filtersModel.set(type, value);
  }
});

export default ExtraParametersListView;
