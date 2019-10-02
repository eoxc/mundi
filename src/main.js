// require styles
import 'bootstrap/dist/css/bootstrap.min.css';

import $ from 'jquery';
import 'jquery-ui';
import es6Promise from 'es6-promise';

import _ from 'underscore'; // eslint-disable-line import/no-extraneous-dependencies
import Backbone from 'backbone'; // eslint-disable-line import/no-extraneous-dependencies
import Marionette from 'backbone.marionette';
import 'bootstrap/dist/js/bootstrap.min';

import LayersCollection from 'eoxc/src/core/models/LayersCollection';
import MapModel from 'eoxc/src/core/models/MapModel';
import FiltersModel from 'eoxc/src/core/models/FiltersModel';
import HighlightModel from 'eoxc/src/core/models/HighlightModel';

import TimeSliderView from 'eoxc/src/core/views/TimeSliderView';
import LayerControlLayoutView from 'eoxc/src/core/views/layers/LayerControlLayoutView';
import LayerOptionsModalView from 'eoxc/src/core/views/layers/LayerOptionsModalView';

import SearchResultView from 'eoxc/src/search/views/SearchResultView';
import SearchModel from 'eoxc/src/search/models/SearchModel';
import { getParameters } from 'eoxc/src/search';
import { parseDuration } from 'eoxc/src/contrib/OpenLayers/utils';

import { version as eoxcVersion } from 'eoxc/package.json';

import DownloadOptionsModel from 'eoxc/src/download/models/DownloadOptionsModel';
import DownloadSelectionView from 'eoxc/src/download/views/DownloadSelectionView';
import DownloadOptionsModalView from 'eoxc/src/download/views/DownloadOptionsModalView';
import FullResolutionDownloadOptionsModalView from 'eoxc/src/download/views/FullResolutionDownloadOptionsModalView';

import { sendProcessingRequest } from 'eoxc/src/processing';

import OpenLayersMapView from 'eoxc/src/contrib/OpenLayers/OpenLayersMapView';

import RootLayoutView from './views/RootLayoutView';

import RootFiltersView from './views/filters/RootFiltersView';
import SidePanelView from './views/SidePanelView';
import StopSelectionView from './views/StopSelectionView';
import WarningsView from './views/WarningsView';
import RecordsDetailsModalView from './views/RecordsDetailsModalView';
import SelectFilesModalView from './views/SelectFilesModalView';
import CombinedResultView from './views/combined/CombinedResultView';

import WarningsCollection from './models/WarningsCollection';

import getTutorialWidget from './tutorial';
import { premultiplyColor, sizeChangedEvent } from './utils';

import i18next from './i18next';

import { version as cdeVersion } from '../package.json';

import fallbackThumbnailUrl from './images/no_thumbnail_available.png';

// import './static/code-de.css';
import './_client.scss';

es6Promise.polyfill();

const germanFormalTranslation = require('./languages/de.json');
const germanInformalTranslation = require('./languages/deinformal.json');
const englishTranslation = require('./languages/en.json');


function combineParameter(setting, param) {
  const options = setting.options || param.options;
  return {
    type: param.type,
    name: param.name,
    title: param.title || setting.title,
    mandatory: setting.mandatory || param.mandatory,
    options,
    minExclusive: param.minExclusive,
    maxExclusive: param.maxExclusive,
    minInclusive: param.minInclusive,
    maxInclusive: param.maxInclusive,
    range: setting.range,
    min: setting.min,
    max: setting.max,
    step: setting.step || 1,
    default: setting.default || setting.fixed,
    fixed: setting.fixed,
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
      nsSeparator: '#',
      lng: this.config.settings.language || 'en',
      fallbackLng: 'en',
      resources: {
        de: {
          translation: germanFormalTranslation,
        },
        deinformal: {
          translation: germanInformalTranslation,
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
    const baseLayersCollection = new LayersCollection(config.baseLayers, {
      exclusiveVisibility: true,
    });
    const layersCollection = new LayersCollection(config.layers);
    const overlayLayersCollection = new LayersCollection(config.overlayLayers);

    const promises = layersCollection.map((layerModel) => {
      const parameterSettings = layerModel.get('search.parameters') || config.settings.parameters;
      if (layerModel.get('search.protocol') && parameterSettings) {
        return getParameters(layerModel)
          .then(parameters => [layerModel, parameters, null])
          .catch(error => [layerModel, null, error]);
      }
      return null;
    }).filter(promise => !!promise);

    if (promises.length) {
      Promise.all(promises)
        .then((layersPlusParametersPlusErrors) => {
          const failedLayers = layersPlusParametersPlusErrors
            .filter(layerPlusParameters => layerPlusParameters[2])
            .map(layerPlusParameters => layerPlusParameters[0]);

          layersPlusParametersPlusErrors
            .filter(layerPlusParameters => !layerPlusParameters[2])
            .forEach(([layerModel, retrievedParameters]) => {
              const parameterSettings = layerModel.get('search.parameters') || config.settings.parameters;
              const combinedParameters = parameterSettings.map((param) => {
                const retrievedParameter = retrievedParameters.find(p => p.type === param.type);
                if (!retrievedParameter) {
                  console.warn(`${layerModel.get('displayName')} does not have a parameter ${param.type}`);
                  return null;
                }
                return combineParameter(param, retrievedParameter);
              }).filter(param => !!param);

              layerModel.set('search.parameters', combinedParameters);
            });
          this.onRun(
            config, baseLayersCollection, layersCollection, overlayLayersCollection, failedLayers
          );
        });
    } else {
      this.onRun(config, baseLayersCollection, layersCollection, overlayLayersCollection, []);
    }
  },

  onRun(config, baseLayersCollection, layersCollection, overlayLayersCollection, failedLayers) {
    const settings = config.settings;

    // allow custom translations from the settings
    if (settings.translations) {
      Object.keys(settings.translations)
        .forEach(
          lng => i18next.addResourceBundle(
            lng, 'translation', settings.translations[lng], true, true
          )
        );
    }

    _.defaults(settings, {
      center: [0, 0],
      zoom: 2,
      minZoom: 0,
      maxZoom: 28,
      searchDebounceTime: 250,
      constrainTimeDomain: false,
      displayInterval: null,
      selectableInterval: null,
      maxTooltips: null,
      timeSliderControls: false,
      maxMapInterval: null,
      constrainOutCoords: false,
      highlightFillColor: 'rgba(255, 255, 255, 0.2)',
      highlightStrokeColor: '#cccccc',
      highlightStrokeWidth: 1,
      filterFillColor: 'rgba(0, 165, 255, 0)',
      filterStrokeColor: 'rgba(0, 165, 255, 1)',
      filterOutsideColor: 'rgba(0, 0, 0, 0.5)',
      footprintFillColor: 'rgba(255, 255, 255, 0.2)',
      footprintStrokeColor: '#cccccc',
      selectedFootprintFillColor: 'rgba(255, 0, 0, 0.2)',
      selectedFootprintStrokeColor: '#ff0000',
      leftPanelOpen: false,
      rightPanelOpen: false,
      leftPanelTabIndex: 0,
      rightPanelTabIndex: 0,
      enableSingleLayerMode: true,
      downloadFormats: [],
      downloadProjections: [],
      uploadEnabled: true,
      downloadEnabled: true,
      searchEnabled: true,
      filterSettings: null,
    });

    // set up config
    const mapModel = new MapModel({
      center: settings.center,
      zoom: settings.zoom,
      minZoom: settings.minZoom,
      maxZoom: settings.maxZoom,
      projection: settings.projection,
      maxMapInterval: parseDuration(settings.maxMapInterval),
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
        // apply defaults / fixed values
        filtersModel: new FiltersModel((layerModel.get('search.parameters') || []).reduce(
          (acc, param) => (
            (param.default || param.fixed)
              ? Object.assign(acc, { [param.type]: (param.default || param.fixed) })
              : acc
            ), {}
        )),
        mapModel,
        defaultPageSize: 50,
        maxCount: layerModel.get('search.searchLimit'),
        loadMore: layerModel.get('search.loadMore'),
        extraParameters: layerModel.get('search.extraParameters'),
        searchEnabled: (typeof layerModel.get('search.searchEnabled') !== 'undefined') ? layerModel.get('search.searchEnabled') : settings.searchEnabled,
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
      highlightFillColor: settings.highlightFillColor,
      highlightStrokeColor: settings.highlightStrokeColor,
      filterFillColor: settings.filterFillColor,
      filterStrokeColor: settings.filterStrokeColor,
      filterOutsideColor: settings.filterOutsideColor,
      domain,
      display,
      constrainTimeDomain: settings.constrainTimeDomain,
      timeSliderControls: settings.timeSliderControls,
      timeSliderAlternativeBrush: settings.timeSliderAlternativeBrush,
      displayInterval: settings.displayInterval,
      selectableInterval: settings.selectableInterval,
      maxTooltips: settings.maxTooltips,
      enableDynamicHistogram: settings.enableDynamicHistogram,
    }));

    // set up panels

    const startDownload = (records) => {
      layout.showChildView('modals', new DownloadOptionsModalView({
        records,
        searchCollection: new Backbone.Collection(
          searchCollection.filter(
            searchModel => searchModel.get('layerModel').get('download.protocol') !== 'S3'
          ),
        ),
        filtersModel,
        mapModel,
        model: new DownloadOptionsModel({
          availableDownloadFormats: settings.downloadFormats,
          availableProjections: settings.downloadProjections,
        }),
      }));
    };

    const showRecordDetails = (records) => {
      layout.showChildView('modals', new RecordsDetailsModalView({
        baseLayersCollection,
        overlayLayersCollection,
        layersCollection,
        records,
        highlightFillColor: settings.highlightFillColor,
        highlightStrokeColor: settings.highlightStrokeColor,
        filterFillColor: settings.filterFillColor,
        filterStrokeColor: settings.filterStrokeColor,
        filterOutsideColor: settings.filterOutsideColor,
        onStartDownload: startDownload,
        projection: settings.projection,
      }));
    };

    const selectFiles = () => {
      layout.showChildView('modals', new SelectFilesModalView({
        collection: searchCollection,
        onStartDownload: startDownload,
      }));
    };

    layersCollection.on('download-full-resolution', (layerModel) => {
      const searchModel = searchCollection.find(model => model.get('layerModel') === layerModel);
      layout.showChildView('modals', new FullResolutionDownloadOptionsModalView({
        layerModel,
        mapModel,
        filtersModel: searchModel.get('filtersModel'),
        model: new DownloadOptionsModel({
          availableDownloadFormats: settings.downloadFormats,
          availableProjections: settings.downloadProjections,
        }),
      }));
    });

    searchCollection.on('start-processing', (searchModel) => {
      sendProcessingRequest(searchModel, mapModel);
    });

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
      constrainOutCoords: settings.constrainOutCoords,
    }));

    layout.showChildView('leftPanel', new SidePanelView({
      position: 'left',
      icon: 'fa-cog',
      defaultOpen: settings.leftPanelOpen,
      openTabIndex: settings.leftPanelTabIndex,
      views: [{
        name: 'Filters',
        view: new RootFiltersView({
          filtersModel,
          mapModel,
          highlightModel,
          searchCollection,
          uploadEnabled: settings.uploadEnabled,
          domain,
          constrainTimeDomain: settings.constrainTimeDomain,
          filterSettings: settings.filterSettings,
        }),
      }, {
        name: 'Layers',
        view: new LayerControlLayoutView({
          mapModel,
          filtersModel,
          baseLayersCollection,
          overlayLayersCollection,
          layersCollection: searchCollection.length === 1 ? undefined : layersCollection,
        }),
      }],
    }));

    let termsAndConditionsUrl = settings.termsAndConditionsUrl;
    if (typeof termsAndConditionsUrl === 'object') {
      termsAndConditionsUrl = termsAndConditionsUrl[settings.language];
    }

    if (searchCollection.length === 1 && settings.enableSingleLayerMode) {
      // single layer view
      layout.showChildView('rightPanel', new SidePanelView({
        position: 'right',
        icon: 'fa-list',
        defaultOpen: settings.rightPanelOpen,
        views: [{
          name: 'Search Results',
          hasInfo: true,
          view: new CombinedResultView({
            mapModel,
            filtersModel,
            highlightModel,
            collection: searchCollection,
            downloadEnabled: settings.downloadEnabled,
            onStartDownload: startDownload,
            onSelectFiles: selectFiles,
            fallbackThumbnailUrl,
            termsAndConditionsUrl,
          }),
        }],
      }));
    } else {
      // multi layer view
      layout.showChildView('rightPanel', new SidePanelView({
        position: 'right',
        icon: 'fa-list',
        defaultOpen: settings.rightPanelOpen,
        openTabIndex: settings.rightPanelTabIndex,
        views: [{
          name: 'Search Results',
          hasInfo: true,
          view: new SearchResultView({
            mapModel,
            filtersModel,
            highlightModel,
            collection: searchCollection,
            fallbackThumbnailUrl,
          }),
        }, {
          name: 'Basket',
          hasInfo: true,
          view: new DownloadSelectionView({
            mapModel,
            filtersModel,
            highlightModel,
            collection: searchCollection,
            onStartDownload: startDownload,
            onSelectFiles: selectFiles,
            termsAndConditionsUrl,
            downloadEnabled: settings.downloadEnabled,
            fallbackThumbnailUrl,
          }),
        }],
      }));
    }

    layout.$('.search-result-view .select-all,.download-view .download-control .btn').removeClass('btn-sm');
    layout.$('.tools, .selections').removeClass('btn-group-justified');

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
    // filtersModel.on('change', () => {
    //   // show warning when time filter is set
    //   warningsCollection.setWarning(
    //     i18next.t('timefilter_warning'),
    //     filtersModel.get('time') || false
    //   );

    //   const otherFilters = Object.keys(filtersModel.attributes)
    //     .filter(key => key !== 'time' && key !== 'area');
    //   warningsCollection.setWarning(
    //     i18next.t('advancedfilter_warning'),
    //     otherFilters.length
    //   );
    // });

    // show a warning for every layer that failed to be accessed
    failedLayers.forEach(layer => warningsCollection.setWarning(
      i18next.t('layer_failed', { value: layer.get('displayName') })
    ));

    // searchCollection.on('change', () => {
    //   const show = searchCollection
    //     .filter(searchModel => (
    //       !searchModel.get('isSearching') && !searchModel.get('hasError')
    //     ))
    //     .reduce((acc, searchModel) => (
    //       acc || searchModel.get('totalResults') > searchModel.get('hasLoaded')
    //     ), false);
    //   warningsCollection.setWarning(i18next.t('toomanyresults_warning'), show);
    // });


    if (settings.extent) {
      mapModel.show({ bbox: settings.extent });
    }

    // create a dynamic style to set up the border/background color of record
    // items in the search results and download selection view.

    $(`<style>
      .record-item:hover, .record-item.highlighted {
        background-color: ${premultiplyColor(settings.highlightFillColor)};
        border-color: ${premultiplyColor(settings.highlightStrokeColor)};
      }
      .record-item.selected-for-download {
        background-color: ${premultiplyColor(settings.selectedFootprintFillColor)};
        border-color: ${premultiplyColor(settings.selectedFootprintStrokeColor)};
      }
      </style>
    `).appendTo('head');

    // mundi specific behavior fix, hard-coding class names selectors
    function updateStyleOnScrollPresent(selectorArray) {
      // accepts an array of jquery objects
      // if any has vertical scroll
      // set its padding-right, else remove padding-right
      function hasVerticalScroll(node) {
        // returns true if node has a visible scroll if a node, else false
        return (node) ? node.scrollHeight > node.offsetHeight : false;
      }
      selectorArray.forEach((selector) => {
        if (hasVerticalScroll(selector[0])) {
          $(selector).css('padding-right', '8px');
        } else {
          $(selector).css('padding-right', '0px');
        }
      });
    }

    $.fn.sizeChanged = sizeChangedEvent;

    updateStyleOnScrollPresent([$('.filters-view'), $('.layer-control')]);

    $(window).on('resize', () => {
      updateStyleOnScrollPresent([$('.filters-view'), $('.layer-control')]);
    });

    $('.panel').sizeChanged(() => {
      updateStyleOnScrollPresent([$('.filters-view'), $('.layer-control')]);
    });

    // layout.showChildView('infoPanel', new VendorInfoView({ eoxcVersion, cdeVersion }));

    // use set timeout here so that vendor info is always at the end of the attribution list
    setTimeout(() => {
      const vendorInfoHTML = `<li>Powered&nbsp;by&nbsp;<a href="https://github.com/eoxc" target="_blank">EOxC</a>&nbsp;&copy;&nbsp;<a href="https://eox.at" target="_blank">EOX&nbsp;<i class="icon-eox-eye"/></a>
      <!-- mundi Client version ${cdeVersion} https://github.com/eoxc/mundi/releases/tag/v${cdeVersion} -->
      <!-- eoxc version ${eoxcVersion} https://github.com/eoxc/eoxc/releases/tag/v${eoxcVersion} --></li>`;
      $(this.container).find('.ol-attribution ul').append(vendorInfoHTML);
    });

    if (Object.prototype.hasOwnProperty.call(settings, 'tutorial')) {
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
            /* eslint-disable no-underscore-dangle */
            let cv = tutWidg;
            while (cv._chainNext) {
              if (cv._annoElem) {
                cv.hide();
              }
              cv = cv._chainNext;
            }
            /* eslint-enable no-underscore-dangle */
            tutWidg.show();
          });
        }

        if (settings.tutorial === 'always') {
          tutWidg.show();
        }

        if (settings.tutorial === 'once') {
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
