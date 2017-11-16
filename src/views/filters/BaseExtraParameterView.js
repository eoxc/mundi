import Marionette from 'backbone.marionette';

const BaseExtraParameterView = Marionette.ItemView.extend({
  templateHelpers() {
    let name = this.model.get('name');
    if (!name) {
      const type = this.model.get('type');
      name = type; // TODO
    }

    const result = name.replace(/([A-Z])/g, ' $1');
    return {
      displayName: result.charAt(0).toUpperCase() + result.slice(1),
    };
  },

  className: 'row extra-parameter',

  onRender() {
    this.$('[data-toggle="tooltip"]').tooltip();
  }
});

export default BaseExtraParameterView;
