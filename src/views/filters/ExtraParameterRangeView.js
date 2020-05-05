import $ from 'jquery';
import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.css';

import BaseExtraParameterView from './BaseExtraParameterView';
import template from './ExtraParameterRangeView.hbs';
import './ExtraParameterRangeView.css';

const ExtraParameterRangeView = BaseExtraParameterView.extend({
  template,

  templateHelpers() {
    const defaultValue = this.model.get('default');
    const low = defaultValue ? defaultValue[0] || defaultValue.min : this.model.get('min');
    const high = defaultValue ? defaultValue[1] || defaultValue.max : this.model.get('max');
    const step = this.model.get('step');

    return Object.assign(
      BaseExtraParameterView.prototype.templateHelpers.call(this), {
        low,
        high,
        step,
      },
    );
  },

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
