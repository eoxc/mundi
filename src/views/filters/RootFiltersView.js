import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

import template from './RootFiltersView.hbs';
import './RootFiltersView.css';

import TimeFilterView from './TimeFilterView';
import AreaFilterView from './AreaFilterView';
import ExtraParametersListView from './ExtraParametersListView';

const RootFiltersView = Marionette.LayoutView.extend({
  template,
  tagName: 'form',
  className: 'filters-view',
  regions: {
    timeFilter: '#time-filter',
    areaFilter: '#area-filter',
    extraParameters: '#extra-parameters',
  },

  initialize(options) {
    this.mapModel = options.mapModel;
    this.highlightModel = options.highlightModel;
    this.filtersModel = options.filtersModel;
    this.extraParameters = options.extraParameters;
  },

  onBeforeShow() {
    const options = {
      mapModel: this.mapModel,
      highlightModel: this.highlightModel,
      filtersModel: this.filtersModel,
    };
    this.showChildView('timeFilter', new TimeFilterView(options));
    this.showChildView('areaFilter', new AreaFilterView(options));
    if (this.extraParameters.length) {
      this.showChildView('extraParameters', new ExtraParametersListView(Object.assign({}, options, {
        collection: new Backbone.Collection(this.extraParameters),
      })));
    }
  },
});

export default RootFiltersView;
