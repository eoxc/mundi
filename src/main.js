import $ from 'jquery';

import 'jquery-ui';

import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

import LayersCollection from 'eoxc/src/core/models/LayersCollection';
import MapModel from 'eoxc/src/core/models/MapModel';
import FiltersModel from 'eoxc/src/core/models/FiltersModel';

import LayerOptionsView from 'eoxc/src/core/views/layers/LayerOptionsView';

//import PanelView from 'eoxc/src/core/views/PanelView';

import SearchCollection from 'eoxc/src/search/models/SearchCollection';
import SearchResultView from 'eoxc/src/search/views/SearchResultView';

import RootLayoutView from './views/RootLayoutView';
import MapLayoutView from './views/MapLayoutView';
import NavBarView from './views/NavBarView';
import ToolsView from './views/ToolsView';

// require styles
require('bootstrap/dist/css/bootstrap.min.css');
require('imports?jQuery=jquery!bootstrap/dist/js/bootstrap.min.js');


window.Application = Marionette.Application.extend({
  initialize({ configPath, container, navbarTemplate }) {
    this.configPath = configPath;
    this.container = container;
    this.navbarTemplate = navbarTemplate;
  },

  onStart() {
    $.getJSON(this.configPath, (config) => {
      this.onConfigLoaded(config);
      // test
    });
  },

  onConfigLoaded(config) {
    const settings = config.settings;

    // TODO: default settings

    // set up config
    const baseLayersCollection = new LayersCollection(config.baseLayers, {
      exclusiveVisibility: true,
    });
    const layersCollection = new LayersCollection(config.layers);
    const overlayLayersCollection = new LayersCollection(config.overlayLayers);

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

    // set up layout
    const layout = new RootLayoutView({ el: $(this.container) });
    layout.render();

    // setup the router and its routes
    const router = new Marionette.AppRouter({
      appRoutes: {
        map: 'onRouteMap',
        search: 'onRouteSearch',
      },
      controller: {
        onRouteMap() {
          // TODO: parse x/y/z and set it to the URL

          layout.showChildView('content', new MapLayoutView({
            baseLayersCollection,
            layersCollection,
            overlayLayersCollection,
            mapModel,
            filtersModel,
            domain: {
              start: new Date(settings.timeDomain[0]),
              end: new Date(settings.timeDomain[1]),
            },
          }));
        },
        onRouteSearch() {
          const searchCollections = layersCollection
            .filter(layerModel => layerModel.get('display.visible'))
            .map(layerModel => {
              const searchCollection = new SearchCollection([], { layerModel, filtersModel });
              searchCollection.fetch();
              return new Backbone.Model({ searchCollection });
            });

          layout.showChildView('content', new SearchResultView({
            collection: new Backbone.Collection(searchCollections),
            mapModel,
          }));
        },
      },
    });

    // set up views

    const navBarView = new NavBarView({
      template: this.navbarTemplate,
      router,
    });

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
    layout.showChildView('header', navBarView);

    Backbone.history.start({ pushState: false });
  },
});