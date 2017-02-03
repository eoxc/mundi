// require styles
import 'bootstrap/dist/css/bootstrap.min.css';

import $ from 'jquery';
import 'jquery-ui';
import es6Promise from 'es6-promise';

import i18next from 'i18next';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

import LayersCollection from 'eoxc/src/core/models/LayersCollection';
import MapModel from 'eoxc/src/core/models/MapModel';
import FiltersModel from 'eoxc/src/core/models/FiltersModel';
import HighlightModel from 'eoxc/src/core/models/HighlightModel';

import TimeSliderView from 'eoxc/src/core/views/TimeSliderView';
import LayerControlLayoutView from 'eoxc/src/core/views/layers/LayerControlLayoutView';

import SearchResultView from 'eoxc/src/search/views/SearchResultView';
import SearchModel from 'eoxc/src/search/models/SearchModel';
import { getParameters } from 'eoxc/src/search';

import DownloadView from 'eoxc/src/download/views/DownloadView';
import download from 'eoxc/src/download';

import OpenLayersMapView from 'eoxc/src/contrib/OpenLayers/OpenLayersMapView';

import RootLayoutView from './views/RootLayoutView';

import FiltersView from './views/FiltersView';
import SidePanelView from './views/SidePanelView';
import StopSelectionView from './views/StopSelectionView';
import WarningsView from './views/WarningsView';
import RecordsDetailsModalView from './views/RecordsDetailsModalView';

import WarningsCollection from './models/WarningsCollection';

import 'imports?jQuery=jquery!bootstrap/dist/js/bootstrap.min.js';

import getTutorialWidget from './tutorial';

es6Promise.polyfill();

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

    _.defaults(settings, {
      searchDebounceTime: 250,
      constrainTimeDomain: false,
      displayInterval: null,
      selectableInterval: null,
      maxTooltips: null,
      timeSliderControls: false,
      highlightFillColor: 'rgba(255, 255, 255, 0.2)',
      highlightStrokeColor: '#cccccc',
      highlightStrokeWidth: 1,
      filterFillColor: 'rgba(0, 0, 0, 0)',
      filterStrokeColor: 'rgba(0, 0, 0, 0)',
      filterOutsideColor: 'rgba(0, 0, 0, 0.2)',
      footprintFillColor: 'rgba(255, 255, 255, 0.2)',
      footprintStrokeColor: '#cccccc',
      selectedFootprintFillColor: 'rgba(255, 0, 0, 0.2)',
      selectedFootprintStrokeColor: '#ff0000',
      leftPanelOpen: false,
      rightPanelOpen: false,
    });

    // set up config
    const mapModel = new MapModel({
      center: settings.center,
      zoom: settings.zoom,
      time: [
        new Date(settings.selectedTimeDomain[0]),
        new Date(settings.selectedTimeDomain[1]),
      ],
    });
    const filtersModel = new FiltersModel({ });
    const highlightModel = new HighlightModel();

    const searchModels = layersCollection
      .filter(layerModel => layerModel.get('search.protocol'))
      .map(layerModel => new SearchModel({
        layerModel,
        filtersModel,
        mapModel,
        defaultPageSize: 50,
        maxCount: layerModel.get('search.searchLimit'),
        debounceTime: settings.searchDebounceTime,
      }));
    const searchCollection = new Backbone.Collection(searchModels);

    // set up layout
    const layout = new RootLayoutView({
      el: $(this.container),
      mapModel,
      searchCollection,
    });
    layout.render();

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
      filterFillColor: settings.filterFillColor,
      filterStrokeColor: settings.filterStrokeColor,
      filterOutsideColor: settings.filterOutsideColor,
      domain,
      display,
      constrainTimeDomain: settings.constrainTimeDomain,
      timeSliderControls: settings.timeSliderControls,
      displayInterval: settings.displayInterval,
      selectableInterval: settings.selectableInterval,
      maxTooltips: settings.maxTooltips,
    }));

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
      highlightStrokeWidth: settings.highlightStrokeWidth,
      filterFillColor: settings.filterFillColor,
      filterStrokeColor: settings.filterStrokeColor,
      filterOutsideColor: settings.filterOutsideColor,
      footprintFillColor: settings.footprintFillColor,
      footprintStrokeColor: settings.footprintStrokeColor,
      selectedFootprintFillColor: settings.selectedFootprintFillColor,
      selectedFootprintStrokeColor: settings.selectedFootprintStrokeColor,
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
          highlightModel,
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
        hasInfo: true,
        view: new SearchResultView({
          mapModel,
          filtersModel,
          highlightModel,
          collection: searchCollection,
        }),
      }, {
        name: 'Download',
        hasInfo: true,
        view: new DownloadView({
          filtersModel,
          highlightModel,
          collection: searchCollection,
        }),
      }],
    }));

    // hook up record info modal
    searchCollection.each((searchModel) => {
      searchModel.on('showInfo', (recordModels) => {
        showRecordDetails(
          recordModels.map(recordModel => [recordModel, searchModel])
        );
      });
    });

    layout.showChildView('bottomPanel', new StopSelectionView({ mapModel }));

    const warningsCollection = new WarningsCollection([]);
    layout.showChildView('topPanel', new WarningsView({ collection: warningsCollection }));

    // hook up the events that shall generate warnings
    filtersModel.on('change', () => {
      // show warning when time filter is set
      warningsCollection.setWarning(
        i18next.t('timefilter_warning'),
        filtersModel.get('time') || false
      );

      const otherFilters = Object.keys(filtersModel.attributes)
        .filter(key => key !== 'time' && key !== 'area');
      warningsCollection.setWarning(
        i18next.t('advancedfilter_warning'),
        otherFilters.length
      );
    });

    searchCollection.on('change', () => {
      const show = searchCollection
        .filter(searchModel => (
          !searchModel.get('isSearching') && !searchModel.get('hasError')
        ))
        .reduce((acc, searchModel) => (
          acc || searchModel.get('totalResults') > searchModel.get('hasLoaded')
        ), false);
      warningsCollection.setWarning(i18next.t('toomanyresults_warning'), show);
    });


    if (settings.extent) {
      mapModel.show({ bbox: settings.extent });
    }

    // create a dynamic style to set up the border/background color of record
    // items in the search results and download selection view.
    $(`<style>
      .record-item:hover, .record-item.highlighted {
        background-color: ${settings.highlightFillColor};
        border-color: ${settings.highlightStrokeColor};
      }
      .record-item.selected-for-download {
        background-color: ${settings.selectedFootprintFillColor};
        border-color: ${settings.selectedFootprintStrokeColor};
      }
      </style>
    `).appendTo('head');


    if (settings.hasOwnProperty('tutorial')) {
      if (settings.tutorial !== 'disabled') {
        const tutWidg = getTutorialWidget();

        if (settings.tutorial !== 'disabled') {
          $('.ol-attribution').append(
          `<button type="button" title="${i18next.t('Tutorial')}" id="tutorial" style="float:right;">
            <span>
              <i style="font-size:0.8em;" class="fa fa-book" aria-hidden="true"></i>
            </span>
          </button>`);

          $('#tutorial').click(() => {
            // Iterate through anno elements to see if any is open and needs to
            // be closed
            let cv = tutWidg;
            while (cv._chainNext) {
              if (cv._annoElem) {
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
