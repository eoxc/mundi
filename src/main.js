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

import { getParameters } from 'eoxc/src/search';

import RootLayoutView from './views/RootLayoutView';

import FiltersView from './views/FiltersView';
import SidePanelView from './views/SidePanelView';
import StopSelectionView from './views/StopSelectionView';

import LayerControlLayoutView from 'eoxc/src/core/views/layers/LayerControlLayoutView';

import OpenLayersMapView from 'eoxc/src/contrib/OpenLayers/OpenLayersMapView';

import download from 'eoxc/src/download';

require('imports?jQuery=jquery!bootstrap/dist/js/bootstrap.min.js');


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
    i18next.init({
      lng: 'en',
      resources: {
        de: {
          translation: require('./languages/de.json'),
        },
      },
    }, () => {
      if (this.config) {
        this.onConfigLoaded(this.config);
      } else {
        $.getJSON(this.configPath, (config) => {
          this.onConfigLoaded(config);
        });
      }
    });
  },

  onConfigLoaded(config) {
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
      }, { automaticSearch: true })
      )
    );

    // set up layout
    const layout = new RootLayoutView({
      el: $(this.container),
      mapModel,
    });
    layout.render();

    // setup the router and its routes
    // const router = new Marionette.AppRouter({
    //   appRoutes: {
    //     map: 'onRouteMap',
    //     search: 'onRouteSearch',
    //   },
    //   controller: {
    //     onRouteMap() {
    //       // TODO: parse x/y/z and set it to the URL
    //
    //       layout.showChildView('content', new MapLayoutView({
    //         baseLayersCollection,
    //         layersCollection,
    //         overlayLayersCollection,
    //         mapModel,
    //         filtersModel,
    //         domain: {
    //           start: new Date(settings.timeDomain[0]),
    //           end: new Date(settings.timeDomain[1]),
    //         },
    //       }));
    //     },
    //     onRouteSearch() {
    //       const searchCollections = layersCollection
    //         .filter(layerModel => layerModel.get('display.visible'))
    //         .map(layerModel => {
    //           const searchCollection = new SearchCollection([], { layerModel, filtersModel });
    //           searchCollection.fetch();
    //           return new Backbone.Model({ searchCollection });
    //         });
    //
    //       layout.showChildView('content', new SearchResultView({
    //         collection: new Backbone.Collection(searchCollections),
    //         mapModel,
    //       }));
    //     },
    //   },
    // });

    // set up views

    // const navBarView = new NavBarView({
    //   template: this.navbarTemplate,
    //   router,
    // });

    // const layerControlLayoutView = new PanelView({
    //   title: 'Layers',
    //   icon: 'fa-globe',
    //   width: '25em',
    //   top: '8em',
    //   left: '3em',
    //   closed: true,
    //   view: new LayerControlLayoutView({
    //     baseLayersCollection,
    //     layersCollection,
    //     overlayLayersCollection,
    //   }),
    // });

    // communicator.on('toggle:layers', () => {
    //   layerControlLayoutView.toggleOpen();
    // });


    // TODO remove this
    // const toolsView = new PanelView({
    //   title: 'Tools',
    //   icon: 'fa-wrench',
    //   width: '10em',
    //   top: '8em',
    //   right: '3em',
    //   closed: true,
    //   view: new ToolsView({
    //     mapModel,
    //     communicator,
    //   }),
    // });
    //
    // // hook up on the layer collections 'show' event
    // layersCollection.on('show', (layerModel) => {
    //   const layerOptionsView = new PanelView({
    //     title: `${layerModel.get('displayName')} Options`,
    //     icon: 'fa-sliders',
    //     left: '45%',
    //     top: '8em',
    //     view: new LayerOptionsView({
    //       model: layerModel,
    //     }),
    //   });
    //   layout.showChildView('layerOptions', layerOptionsView);
    // });

    // render the views to the regions
    // layout.showChildView('header', navBarView);


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
          // onResultItemClicked(view, record) {
          //   layout.showChildView('modals', new ModalView({
          //     view: new RecordDetailsView({ model: record }),
          //   }));
          // },
          onResultItemInfo(view, record, layerModel) {
            const detailsMapModel = new MapModel({ center: [0, 0], zoom: 5 });
            const detailsHighlightModel = new HighlightModel();

            const time = record.get('properties').time;
            layout.showChildView('modals', new ModalView({
              title: `${layerModel.get('displayName')} - ${time[0].toISOString()}`,
              view: new RecordDetailsView({
                model: record,
                mapModel: detailsMapModel,
                mapView: new OpenLayersMapView({
                  mapModel: detailsMapModel,
                  filtersModel: new FiltersModel({ time }),
                  highlightModel: detailsHighlightModel,
                  baseLayersCollection,
                  overlayLayersCollection,
                  layersCollection,
                  highlightFillColor: 'rgba(0, 0, 0, 0)',
                  highlightStrokeColor: settings.highlightStrokeColor,
                }),
              }),
              buttons: [
                ['Download', () => {
                  download(layerModel, filtersModel, record, {}, $('#download-elements'));
                }],
              ],
            }));

            detailsMapModel.show(record.attributes);
            detailsHighlightModel.highlight(record.attributes);
          },
        }),
      }],
    }));

    layout.showChildView('bottomPanel', new StopSelectionView({ mapModel }));

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

    require('./tutorial.js');

    Backbone.history.start({ pushState: false });
  },
});
