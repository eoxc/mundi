import Marionette from 'backbone.marionette';

import template from './ExtraParameterPlainView.hbs';


const ExtraParameterPlainView = Marionette.ItemView.extend({
  template,
  templateHelpers() {
    const result = this.model.get('name').replace(/([A-Z])/g, ' $1');
    return {
      displayName: result.charAt(0).toUpperCase() + result.slice(1),
    };
  },

  className: 'row extra-parameter',
  events: {
    'change input[type="text"]': 'onInputChange',
  },

  onInputChange() {
    this.$('input').val();
    const type = this.model.get('type');
    const value = this.$('select').val();
    if (!value || value === '') {
      this.trigger('value:unset', type);
    } else {
      this.trigger('value:change', type, value);
    }
  }
});

export default ExtraParameterPlainView;
