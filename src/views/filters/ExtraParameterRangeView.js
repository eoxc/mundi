import $ from 'jquery';
import Marionette from 'backbone.marionette';
import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.css';

import template from './ExtraParameterRangeView.hbs';
import './ExtraParameterRangeView.css';

const ExtraParameterRangeView = Marionette.ItemView.extend({
  template,
  templateHelpers() {
    const result = this.model.get('name').replace(/([A-Z])/g, ' $1');
    return {
      displayName: result.charAt(0).toUpperCase() + result.slice(1),
    };
  },

  className: 'row extra-parameter',
  events: {
    'slideStop input[data-provide="slider"]': 'onSliderStop',
  },

  onAttach() {
    this.$('[data-provide="slider"]').slider({
      tooltip_position: 'top',
      formatter(value) {
        if (Array.isArray(value)) {
          return `${value[0]} - ${value[1]}`;
        }
        return value;
      },
    });
  },

  onSliderStop(event) {
    const $target = $(event.target);
    const type = this.model.get('type');
    const [low, high] = event.value;
    if ($target.data('slider-min') === low && $target.data('slider-max') === high) {
      this.trigger('value:unset', type);
    } else {
      this.trigger('value:change', type, { min: low, max: high });
    }
  },
});

export default ExtraParameterRangeView;
