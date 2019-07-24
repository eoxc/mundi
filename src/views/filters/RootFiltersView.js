import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

import template from './RootFiltersView.hbs';
import './RootFiltersView.css';

import TimeFilterView from './TimeFilterView';
import AreaFilterView from './AreaFilterView';
import ExtraParametersListView from './ExtraParametersListView';

const RootFiltersView = Marionette.LayoutView.extend({
  template,
  templateHelpers() {
    const searchModelsWithParameters = this.searchCollection
      .filter(
        searchModel => (
          searchModel.get('layerModel').get('search.parameters') || []
        ).filter(param => !param.fixed).length
      );
    return {
      searchModelsWithParameters,
      layerIdsWithParameters: searchModelsWithParameters.map(searchModel => searchModel.get('layerModel').cid),
    };
  },
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
    this.searchCollection = options.searchCollection;
    this.uploadEnabled = options.uploadEnabled;
    this.domain = options.domain;
    this.constrainTimeDomain = options.constrainTimeDomain;
  },

  onBeforeShow() {
    const options = {
      mapModel: this.mapModel,
      highlightModel: this.highlightModel,
      filtersModel: this.filtersModel,
      uploadEnabled: this.uploadEnabled,
      domain: this.domain,
      constrainTimeDomain: this.constrainTimeDomain,
    };
    this.showChildView('timeFilter', new TimeFilterView(options));
    this.showChildView('areaFilter', new AreaFilterView(options));

    this.templateHelpers().searchModelsWithParameters
      .forEach((searchModel) => {
        const layerModel = searchModel.get('layerModel');
        const layerId = layerModel.cid;
        this.addRegion(`extraParameters${layerId}`, `#extra-parameters-${layerId}`);
        this.showChildView(`extraParameters${layerId}`, new ExtraParametersListView(Object.assign({}, options, {
          searchModel,
          collection: new Backbone.Collection(layerModel.get('search.parameters')),
          // filtersModel: layerModel.get('filter')
        })));
      });
  },
});

export default RootFiltersView;
