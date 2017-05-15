import BaseExtraParameterView from './BaseExtraParameterView';
import template from './ExtraParameterPlainView.hbs';


const ExtraParameterPlainView = BaseExtraParameterView.extend({
  template,

  events: {
    'change input[type="text"]': 'onInputChange',
  },

  onInputChange() {
    const type = this.model.get('type');
    const value = this.$('input[type="text"]').val();
    if (!value || value === '') {
      this.trigger('value:unset', type);
    } else {
      this.trigger('value:change', type, value);
    }
  }
});

export default ExtraParameterPlainView;
