import BaseExtraParameterView from './BaseExtraParameterView';
import template from './ExtraParameterSelectView.hbs';


const ExtraParameterSelectView = BaseExtraParameterView.extend({
  template,

  templateHelpers() {
    const defaultValue = this.model.get('default');
    return Object.assign(
      BaseExtraParameterView.prototype.templateHelpers.call(this), {
        options: this.model.get('options').map(
          option => Object.assign({}, option, {
            isSelected: option.value === defaultValue,
          })
        ),
      },
    );
  },

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
