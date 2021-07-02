import Marionette from 'backbone.marionette';

import { setSearchParam } from 'eoxc/src/core/util';
import template from './ToggleTimeSliderView.hbs';
//
const ToggleTimeSliderView = Marionette.ItemView.extend({
  template,
  templateHelpers() {
    return {
      disabled: this.mapModel.get('disableTimeSlider'),
    };
  },
  events: {
    'click .toggleTimeSlider': 'onToggleTimeSlider',
  },
  initialize(options) {
    this.mapModel = options.mapModel;
    this.initialDisableTimeSlider = options.initialDisableTimeSlider;
  },
  onToggleTimeSlider() {
    this.mapModel.set('disableTimeSlider', !this.mapModel.get('disableTimeSlider'));

    const saveState = this.initialDisableTimeSlider !== this.mapModel.get('disableTimeSlider') ? this.mapModel.get('disableTimeSlider') : null;
    setSearchParam('disabletimeslider', saveState);
    this.render();
  }
});

export default ToggleTimeSliderView;
