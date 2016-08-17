import Marionette from 'backbone.marionette';

import LayerControlLayoutView from 'eoxc/src/core/views/layers/LayerControlLayoutView';

require('./PanelView.css');
const template = require('./PanelView.hbs');

export default Marionette.LayoutView.extend({
  template,

  templateHelpers() {
    return {
      position: this.position,
    };
  },

  regions: {
    panelContent: '#panel-content',
  },

  events: {
    'click #toggle-panel': 'onTogglePanelClicked',
  },

  initialize(options) {
    this.options = options;
    this.position = options.position || 'left';
  },

  onBeforeShow() {
    this.showChildView('panelContent', new LayerControlLayoutView(this.options));
  },

  onTogglePanelClicked() {
    this.$('.panel').toggleClass('in');
  },
});
