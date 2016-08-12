import Marionette from 'backbone.marionette';

import OpenLayersMapView from 'eoxc/src/contrib/OpenLayers/OpenLayersMapView';
import TimeSliderView from 'eoxc/src/core/views/TimeSliderView';
import LayerControlLayoutView from 'eoxc/src/core/views/layers/LayerControlLayoutView';


const MapLayoutView = Marionette.LayoutView.extend({
  template: () => `
    <div id="map" style="width: 100%; height:100%; margin: 0;"></div>
    <div id="timeSlider" style="position: absolute; width: 90%; left: 5%; bottom: 30px"></div>
    <div id="buttons" class="panel" style="position: absolute; right: 10px; top: 80px; max-width: 500px;">
      <button id="btn-show-layers" type="button" class="btn btn-sm btn-default" style="float:right">Layers<span class="caret"></span></button>
      <div id="layerControl"></div>
    </div>
  `,

  regions: {
    map: '#map',
    timeSlider: '#timeSlider',
    layerControl: '#layerControl',
  },

  events: {
    'click #btn-show-layers': 'onShowLayersClicked',
  },

  initialize(options) {
    this.options = options;
  },

  onBeforeShow() {
    this.showChildView('map', new OpenLayersMapView(this.options));
    this.showChildView('timeSlider', new TimeSliderView(this.options));
    this.showChildView('layerControl', new LayerControlLayoutView(this.options));
  },

  onShowLayersClicked() {
    const $layerControl = this.$('#layerControl');
    const $button = this.$('#btn-show-layers');
    if ($layerControl.is(':visible')) {
      $button.removeClass('active');
      $layerControl.hide();
    } else {
      $button.addClass('active');
      $layerControl.show();
    }
  },
});

export default MapLayoutView;
