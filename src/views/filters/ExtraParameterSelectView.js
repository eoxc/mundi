import BaseExtraParameterView from './BaseExtraParameterView';
import template from './ExtraParameterSelectView.hbs';


const ExtraParameterSelectView = BaseExtraParameterView.extend({
  template,

  events: {
    'change select': 'onSelectChange',
  },

  onSelectChange() {
    const type = this.model.get('type');
    const value = this.$('select').val();
    if (!value || value === '') {
      this.trigger('value:unset', type);
    } else {
      this.trigger('value:change', type, value);
    }
  },
});

export default ExtraParameterSelectView;
