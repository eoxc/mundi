import Marionette from 'backbone.marionette';

require('./SidePanelView.css');
const template = require('./SidePanelView.hbs');

export default Marionette.LayoutView.extend({
  template,

  templateHelpers() {
    return {
      position: this.position,
      isLeft: this.position === 'left',
      icon: this.icon,
      views: this.views,
    };
  },

  // regions: {
  //   sidePanelContent: '.side-panel-content',
  // },

  // regions() {
  //   const regions = {};
  //   this.views.forEach((view, index) => {
  //     regions[`region-${index}`] = `#${this.position}-${index}`;
  //   });
  //   return regions;
  // },

  events: {
    'click .toggle-side-panel': 'onToggleSidePanelClicked',
  },

  initialize(options) {
    this.position = options.position || 'left';
    this.views = options.views;
    this.icon = options.icon;
  },

  onBeforeShow() {
    this.views.forEach((viewConfig, index) => {
      this.addRegion(`region-${index}`, `#${this.position}-${index}`);
      this.showChildView(`region-${index}`, viewConfig.view);
    });
    // this.views.forEach(view => this.showChildView('sidePanelContent', this.view))
    // this.showChildView('sidePanelContent', this.view);
  },

  onToggleSidePanelClicked() {
    this.$('.side-panel').toggleClass('in');
  },
});
