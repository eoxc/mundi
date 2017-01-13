// require styles
require('bootstrap/dist/css/bootstrap.min.css');

import $ from 'jquery';
import 'jquery-ui';
require('es6-promise').polyfill();

import i18next from 'i18next';

import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

import LayersCollection from 'eoxc/src/core/models/LayersCollection';
import MapModel from 'eoxc/src/core/models/MapModel';
import FiltersModel from 'eoxc/src/core/models/FiltersModel';
import HighlightModel from 'eoxc/src/core/models/HighlightModel';

import LayerOptionsView from 'eoxc/src/core/views/layers/LayerOptionsView';

import TimeSliderView from 'eoxc/src/core/views/TimeSliderView';
import ModalView from 'eoxc/src/core/views/ModalView';

import SearchResultView from 'eoxc/src/search/views/SearchResultView';
import RecordDetailsView from 'eoxc/src/search/views/RecordDetailsView';
import SearchModel from 'eoxc/src/search/models/SearchModel';
import RecordsDetailsModalView from './views/RecordsDetailsModalView';

import { getParameters } from 'eoxc/src/search';

import RootLayoutView from './views/RootLayoutView';

import FiltersView from './views/FiltersView';
import SidePanelView from './views/SidePanelView';
import StopSelectionView from './views/StopSelectionView';
import SearchLimitWarningView from './views/SearchLimitWarningView';

import LayerControlLayoutView from 'eoxc/src/core/views/layers/LayerControlLayoutView';

import OpenLayersMapView from 'eoxc/src/contrib/OpenLayers/OpenLayersMapView';

import download from 'eoxc/src/download';

require('imports?jQuery=jquery!bootstrap/dist/js/bootstrap.min.js');

import getTutorialWidget from './tutorial.js';

const germanTranslation = require('./languages/de.json');
const englishTranslation = require('./languages/en.json');


function combineParameter(setting, param) {
  const options = setting.options || param.options;
  return {
    type: param.type,
    name: param.name,
    mandatory: setting.mandatory || param.mandatory,
    options,
    minExclusive: param.minExclusive,
    maxExclusive: param.maxExclusive,
    minInclusive: param.minInclusive,
    maxInclusive: param.maxInclusive,
    range: setting.range,
    min: setting.min,
    max: setting.max,
  };
}

window.Application = Marionette.Application.extend({
  initialize({ config, configPath, container, navbarTemplate }) {
    this.config = config;
    this.configPath = configPath;
    this.container = container;
    this.navbarTemplate = navbarTemplate;
  },

  onStart() {
    if (this.config) {
      this.onConfigLoaded(this.config);
    } else {
      $.getJSON(this.configPath, (config) => {
        this.onConfigLoaded(config);
      });
    }
  },

  onConfigLoaded(config) {
    this.config = config;
    i18next.init({
      lng: this.config.settings.language || 'en',
      fallbackLng: 'en',
      resources: {
        de: {
          translation: germanTranslation,
        },
        en: {
          translation: englishTranslation,
        },
      },
    }, () => {
      this.onI18NextInitialized(config);
    });
  },

  onI18NextInitialized(config) {
    // TODO: check parameters

    const baseLayersCollection = new LayersCollection(config.baseLayers, {
      exclusiveVisibility: true,
    });
    const layersCollection = new LayersCollection(config.layers);
    const overlayLayersCollection = new LayersCollection(config.overlayLayers);

    if (config.settings.parameters) {
      const parameterPromises = layersCollection
        .map(layerModel => getParameters(layerModel).then(parameters => [layerModel, parameters]));
      Promise.all(parameterPromises)
        .then((layersPlusParameters) => {
          const params = config.settings.parameters
            .map(param => [
              param, layersPlusParameters.filter(layerPlusParameters => (
                layerPlusParameters[1].find(p => p.type === param.type)
              )),
            ])

            // filter out the parameters that are nowhere available
            .filter(paramPlusApplicableLayers => paramPlusApplicableLayers[1].length)

            // combine the parameter settings info with the info from the search services
            .map((paramPlusApplicableLayers) => {
              let param = paramPlusApplicableLayers[0];
              for (let i = 0; i < paramPlusApplicableLayers[1].length; i += 1) {
                const [, layerParameters] = paramPlusApplicableLayers[1][i];
                param = combineParameter(
                  param, layerParameters.find(p => p.type === param.type)
                );
              }
              if (paramPlusApplicableLayers[1].length < layersCollection.length) {
                param.onlyAvailableAt = paramPlusApplicableLayers[1].map(layerPlusParameters => (
                  layerPlusParameters[0].get('displayName')
                ));
              }
              return param;
            });

          // const params = [].concat.apply([], extraParameters)
          //   .filter(param => param.type.startsWith('eo:'))
          //   .map((param) => {
          //     const paramSetting = config.settings.parameters[param.type];
          //     if (paramSetting) {
          //       return {
          //         type: param.type,
          //         name: param.name,
          //         mandatory: param.mandatory,
          //         options: param.options,
          //         minExclusive: param.minExclusive,
          //         maxExclusive: param.maxExclusive,
          //         minInclusive: param.minInclusive,
          //         maxInclusive: param.maxInclusive,
          //         ...paramSetting,
          //       };
          //     }
          //     return param;
          //   });

          this.onRun(
            config, baseLayersCollection, layersCollection, overlayLayersCollection, params
          );
        });
    } else {
      this.onRun(config, baseLayersCollection, layersCollection, overlayLayersCollection, []);
    }
  },

  onRun(config, baseLayersCollection, layersCollection, overlayLayersCollection, extraParameters) {
    const settings = config.settings;

    // TODO: default settings

    // set up config
    const mapModel = new MapModel({
      center: settings.center,
      zoom: settings.zoom,
    });
    const filtersModel = new FiltersModel({
      time: [
        new Date(settings.selectedTimeDomain[0]),
        new Date(settings.selectedTimeDomain[1]),
      ],
    });
    const highlightModel = new HighlightModel();

    const searchCollection = new Backbone.Collection(
      layersCollection.map(layerModel => new SearchModel({
        layerModel,
        filtersModel,
        mapModel,
        defaultPageSize: 50,
        maxCount: layerModel.get('search.searchLimit'),
      }, { automaticSearch: true })
      )
    );

    // set up layout
    const layout = new RootLayoutView({
      el: $(this.container),
      mapModel,
      searchCollection,
    });
    layout.render();

    // set up panels

    const showRecordDetails = (records) => {
      layout.showChildView('modals', new RecordsDetailsModalView({
        baseLayersCollection,
        overlayLayersCollection,
        layersCollection,
        records,
      }));
    };

    layout.showChildView('content', new OpenLayersMapView({
      mapModel,
      filtersModel,
      baseLayersCollection,
      overlayLayersCollection,
      layersCollection,
      searchCollection,
      highlightModel,
      highlightFillColor: settings.highlightFillColor,
      highlightStrokeColor: settings.highlightStrokeColor,
      onFeatureClicked(records) {
        showRecordDetails(records);
      },
    }));

    layout.showChildView('leftPanel', new SidePanelView({
      position: 'left',
      icon: 'fa-cog',
      defaultOpen: settings.leftPanelOpen,
      views: [{
        name: 'Filters',
        view: new FiltersView({
          filtersModel,
          mapModel,
          layersCollection,
          extraParameters,
        }),
      }, {
        name: 'Layers',
        view: new LayerControlLayoutView({
          mapModel,
          filtersModel,
          baseLayersCollection,
          overlayLayersCollection,
          layersCollection,
        }),
      }],
    }));

    layout.showChildView('rightPanel', new SidePanelView({
      position: 'right',
      icon: 'fa-list',
      defaultOpen: settings.rightPanelOpen,
      views: [{
        name: 'Search Results',
        view: new SearchResultView({
          mapModel,
          filtersModel,
          highlightModel,
          collection: searchCollection,
          onResultItemInfo(view, record, searchModel) {
            showRecordDetails([[record, searchModel]]);
          },
        }),
      }],
    }));

    layout.showChildView('bottomPanel', new StopSelectionView({ mapModel }));
    layout.showChildView('topPanel', new SearchLimitWarningView());

    // layout.showChildView('modals', new ModalView({}));

    const domain = {
      start: new Date(settings.timeDomain[0]),
      end: new Date(settings.timeDomain[1]),
    };
    const display = settings.displayTimeDomain ? {
      start: new Date(settings.displayTimeDomain[0]),
      end: new Date(settings.displayTimeDomain[1]),
    } : domain;

    layout.showChildView('timeSlider', new TimeSliderView({
      layersCollection,
      mapModel,
      filtersModel,
      highlightModel,
      domain,
      display,
      constrainTimeDomain: settings.constrainTimeDomain,
      displayInterval: settings.displayInterval,
      selectableInterval: settings.selectableInterval,
      maxTooltips: settings.maxTooltips,
    }));

    if (settings.extent) {
      mapModel.show({ bbox: settings.extent });
    }


    if (settings.hasOwnProperty('tutorial')) {
      if (settings.tutorial !== 'disabled') {
        let tutWidg = getTutorialWidget();

        if (settings.tutorial !== 'disabled') {
          $('.ol-attribution').append(
          `<button type="button" title="`+i18next.t('Tutorial')+`" id="tutorial" style="float:right;">
            <span>
              <i style="font-size:0.8em;" class="fa fa-book" aria-hidden="true"></i>
            </span>
          </button>`);

          $('#tutorial').click(() => {
            // Iterate through anno elements to see if any is open and needs to
            // be closed
            let cv = tutWidg;
            while (cv._chainNext) {
              if(cv._annoElem){
                cv.hide();
              }
              cv = cv._chainNext;
            }
            tutWidg.show();
          });
        }

        if (settings.tutorial === 'always') {
          tutWidg.show();
        }

        if (settings.tutorial === 'first') {
          if (typeof (Storage) !== 'undefined') {
            if (localStorage.getItem('firstVisit') === null) {
              // Open tutorial automatically if it is the first visit
              tutWidg.show();
              localStorage.setItem('firstVisit', false);
            }
          }
        }
      }
    }
    Backbone.history.start({ pushState: false });
  },
});
