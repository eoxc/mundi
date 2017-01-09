import Marionette from 'backbone.marionette';
import 'jquery.scrollbar';
import 'jquery.scrollbar/jquery.scrollbar.css';

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
    this.defaultOpen = options.defaultOpen;
  },

  onBeforeShow() {
    this.views.forEach((viewConfig, index) => {
      this.addRegion(`region-${index}`, `#${this.position}-${index}`);
      this.showChildView(`region-${index}`, viewConfig.view);
    });

    if (this.defaultOpen) {
      this.onToggleSidePanelClicked();
    }
    // this.views.forEach(view => this.showChildView('sidePanelContent', this.view))
    // this.showChildView('sidePanelContent', this.view);
  },

  onShow() {
    this.$('.scrollbar-inner').scrollbar();
  },

  onToggleSidePanelClicked() {
    this.$('.side-panel').toggleClass('in');
    this.$('.toggle-side-panel-out').toggleClass('out');
  },
});
