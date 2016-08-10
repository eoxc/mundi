import $ from 'jquery';

import 'jquery-ui';

import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

// import LayerModel from '../../../src/core/models/LayerModel';
import LayersCollection from 'eoxc/src/core/models/LayersCollection';
import MapModel from 'eoxc/src/core/models/MapModel';
import FiltersModel from 'eoxc/src/core/models/FiltersModel';

import LayerControlLayoutView from 'eoxc/src/core/views/layers/LayerControlLayoutView';
import LayerOptionsView from 'eoxc/src/core/views/layers/LayerOptionsView';

import OpenLayersMapView from 'eoxc/src/contrib/OpenLayers/OpenLayersMapView';
import TimeSliderView from 'eoxc/src/core/views/TimeSliderView';
import PanelView from 'eoxc/src/core/views/PanelView';

import SearchCollection from 'eoxc/src/search/models/SearchCollection';
import SearchResultView from 'eoxc/src/search/views/SearchResultView';

import RootLayoutView from './views/RootLayoutView';
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
    const communicator = new Marionette.Controller();
    // set up config
    const baseLayersCollection = new LayersCollection(config.baseLayers, {
      exclusiveVisibility: true,
    });
    const layersCollection = new LayersCollection(config.layers);
    const overlayLayersCollection = new LayersCollection(config.overlayLayers);

    const mapModel = new MapModel();
    const filtersModel = new FiltersModel({
      time: [
        new Date('2006-01-01T00:00:00Z'),
        new Date('2016-12-31T00:00:00Z'),
      ],
    });

    // set up layout

    const layout = new RootLayoutView({ el: $(this.container) });
    layout.render();

    // set up views

    const navBarView = new NavBarView({
      template: this.navbarTemplate,
      communicator,
    });

    const layerControlLayoutView = new PanelView({
      title: 'Layers',
      icon: 'fa-globe',
      width: '25em',
      top: '8em',
      left: '3em',
      closed: true,
      view: new LayerControlLayoutView({
        baseLayersCollection,
        layersCollection,
        overlayLayersCollection,
      }),
    });

    communicator.on('toggle:layers', () => {
      layerControlLayoutView.toggleOpen();
    });

    // const searchResultsView = new PanelView({
    //   title: 'Search Results',
    //   icon: 'fa-search',
    //   width: '50em',
    //   top: '8em',
    //   right: '3em',
    //   closed: true,
    //   view: new SearchResultView({
    //     mapModel,
    //     communicator,
    //   }),
    // });

    const toolsView = new PanelView({
      title: 'Tools',
      icon: 'fa-wrench',
      width: '10em',
      top: '8em',
      right: '3em',
      closed: true,
      view: new ToolsView({
        mapModel,
        communicator,
      }),
    });

    communicator.on('toggle:tools', () => {
      toolsView.toggleOpen();
    });

    communicator.on('search', () => {
      const searchCollections = layersCollection
        .filter(layerModel => layerModel.get('display.visible'))
        .map(layerModel => {
          const searchCollection = new SearchCollection([], { layerModel, filtersModel });
          searchCollection.fetch();
          return new Backbone.Model({ searchCollection });
        });

      layout.showChildView('searchResults', new PanelView({
        title: 'Search Results',
        icon: 'fa-search',
        width: '50em',
        top: '8em',
        right: '3em',
        closed: false,
        view: new SearchResultView({
          collection: new Backbone.Collection(searchCollections),
          mapModel,
        }),
      }));
    });

    // hook up on the layer collections 'show' event
    layersCollection.on('show', (layerModel) => {
      const layerOptionsView = new PanelView({
        title: `${layerModel.get('displayName')} Options`,
        icon: 'fa-sliders',
        left: '45%',
        top: '8em',
        view: new LayerOptionsView({
          model: layerModel,
        }),
      });
      layout.showChildView('layerOptions', layerOptionsView);
    });

    const mapView = new OpenLayersMapView({
      baseLayersCollection,
      layersCollection,
      overlayLayersCollection,
      mapModel,
      filtersModel,
    });

    const timeSliderView = new TimeSliderView({
      layersCollection,
      filtersModel,
      mapModel,
      domain: {
        start: new Date('2006-01-01T00:00:00Z'),
        end: new Date('2016-12-31T00:00:00Z'),
      },
    });

    // render the views to the regions

    layout.showChildView('header', navBarView);
    layout.showChildView('layers', layerControlLayoutView);
    layout.showChildView('tools', toolsView);
    // layout.showChildView('searchResults', searchResultsView);
    layout.showChildView('map', mapView);
    layout.showChildView('timeSlider', timeSliderView);
  },
});
