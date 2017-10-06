import Marionette from 'backbone.marionette';

import template from './ExtraParametersListView.hbs';
import './ExtraParametersListView.css';

import ExtraParameterRangeView from './ExtraParameterRangeView';
import ExtraParameterSelectView from './ExtraParameterSelectView';
import ExtraParameterPlainView from './ExtraParameterPlainView';

const ExtraParametersListView = Marionette.CompositeView.extend({
  template,
  templateHelpers() {
    const layerModel = this.searchModel.get('layerModel');
    return {
      name: layerModel.get('displayName'),
      id: layerModel.get('id'),
      visible: layerModel.get('display.visible'),
    };
  },
  className: 'panel panel-default',

  initialize(options) {
    this.searchModel = options.searchModel;
    this.filtersModel = options.searchModel.get('filtersModel');
    this.listenTo(this.searchModel, 'change display.visible', this.render);
  },

  childViewContainer() {
    return `#collapse-additional-filters-${this.searchModel.get('layerModel').get('id')}`;
  },

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
