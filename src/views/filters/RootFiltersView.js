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
    this.filterSettings = options.filterSettings;
    this.singleLayerModeUsed = options.singleLayerModeUsed;
    this.layersCollection = options.layersCollection;
    this.baseLayersCollection = options.baseLayersCollection;
    this.overlayLayersCollection = options.overlayLayersCollection;
  },

  onBeforeShow() {
    const options = {
      mapModel: this.mapModel,
      highlightModel: this.highlightModel,
      filtersModel: this.filtersModel,
    };
    // check out which filters to show
    if (this.filterSettings) {
      const fs = this.filterSettings;
      if (fs.time) {
        this.timeSettings = fs.time;
        this.timeFilterHidden = this.timeSettings.hidden;
      }
      if (fs.area) {
        this.areaSettings = fs.area;
        this.areaFilterHidden = this.areaSettings.hidden;
      }
    }

    if (!this.timeFilterHidden) {
      this.showChildView('timeFilter', new TimeFilterView(Object.assign({}, options, {
        constrainTimeDomain: this.constrainTimeDomain,
        domain: this.domain,
        settings: this.timeSettings,
        layersCollection: this.layersCollection,
        overlayLayersCollection: this.overlayLayersCollection,
        baseLayersCollection: this.baseLayersCollection,
      })));
    }
    if (!this.areaFilterHidden) {
      this.showChildView('areaFilter', new AreaFilterView(Object.assign({}, options, {
        uploadEnabled: this.uploadEnabled,
        settings: this.areaSettings,
      })));
    }
    this.templateHelpers().searchModelsWithParameters
      .forEach((searchModel) => {
        const layerModel = searchModel.get('layerModel');
        const layerId = layerModel.cid;
        const paramFs = layerModel.get('search.parametersFilterSettings');
        let additionalFilterHidden = false;
        if (paramFs) {
          additionalFilterHidden = paramFs.hidden;
        }
        if (!additionalFilterHidden) {
          this.addRegion(`extraParameters${layerId}`, `#extra-parameters-${layerId}`);
          this.showChildView(`extraParameters${layerId}`, new ExtraParametersListView(Object.assign({}, options, {
            searchModel,
            collection: new Backbone.Collection(layerModel.get('search.parameters')),
            settings: paramFs,
            singleLayerModeUsed: this.singleLayerModeUsed
          })));
        }
      });
  }
});

export default RootFiltersView;
