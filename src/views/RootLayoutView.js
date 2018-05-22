import Marionette from 'backbone.marionette';

import './TimeSliderView.css';
import './MapView.css';
import template from './RootLayoutView.hbs';

export default Marionette.LayoutView.extend({
  template,
  regions: {
    content: '#content',
    leftPanel: '#leftPanel',
    rightPanel: '#rightPanel',
    bottomPanel: '#bottomPanel',
    topPanel: '#topPanel',
    infoPanel: '#infoPanel',
    timeSlider: '#timeSlider',
    modals: '#modals',
    topModals: '#top-modals',
  },

  initialize(options) {
    this.listenTo(options.mapModel, 'change:tool', (model, tool) => {
      if (tool) {
        this.$('#timeSlider,#leftPanel,#rightPanel,#infoPanel,#topPanel').fadeOut('fast');
        this.$('#bottomPanel').fadeIn('fast').css('display', 'flex');
      } else {
        this.$('#timeSlider,#leftPanel,#rightPanel,#infoPanel,#topPanel').fadeIn('fast');
        this.$('#bottomPanel').fadeOut('fast');
      }
    });
  },
});
