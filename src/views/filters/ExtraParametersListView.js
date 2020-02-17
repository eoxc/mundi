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
      id: layerModel.cid,
      collapsed: this.collapsed,
      singleLayerModeUsed: this.singleLayerModeUsed,
    };
  },
  className: 'panel panel-default',

  initialize(options) {
    this.searchModel = options.searchModel;
    this.filtersModel = options.searchModel.get('filtersModel');
    this.listenTo(this.searchModel, 'change display.visible', this.onChangeVisible);
    this.singleLayerModeUsed = options.singleLayerModeUsed;
    // set according to configured filter
    // additional filters are by default collapsed=true
    if (options.settings) {
      if (typeof options.settings.collapsed !== 'undefined') {
        this.collapsed = options.settings.collapsed;
      } else {
        this.collapsed = true;
      }
    } else {
      this.collapsed = true;
    }
  },

  childViewContainer() {
    return `#collapse-additional-filters-${this.searchModel.get('layerModel').cid}`;
  },

  filter(parameter) {
    // exclude 'fixed' parameters
    return !parameter.get('fixed');
  },

  getChildView(parameter) {
    if (parameter.get('range')) {
      return ExtraParameterRangeView;
    } else if (parameter.get('options')) {
      return ExtraParameterSelectView;
    }
    return ExtraParameterPlainView;
  },

  onRender() {
    this.onChangeVisible();
  },

  onChangeVisible() {
    if (!this.singleLayerModeUsed) {
      this.$el.css('display', this.searchModel.get('layerModel').get('display.visible') ? '' : 'none');
    }
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
