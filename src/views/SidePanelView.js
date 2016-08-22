import Marionette from 'backbone.marionette';

require('./SidePanelView.css');
const template = require('./SidePanelView.hbs');

export default Marionette.LayoutView.extend({
  template,

  templateHelpers() {
    return {
      position: this.position,
      icon: this.icon,
    };
  },

  regions: {
    sidePanelContent: '.side-panel-content',
  },

  events: {
    'click .toggle-side-panel': 'onToggleSidePanelClicked',
  },

  initialize(options) {
    this.position = options.position || 'left';
    this.view = options.view;
    this.icon = options.icon;
  },

  onBeforeShow() {
    this.showChildView('sidePanelContent', this.view);
  },

  onToggleSidePanelClicked() {
    this.$('.side-panel').toggleClass('in');
  },
});
