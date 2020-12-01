import Marionette from 'backbone.marionette';
import { setSearchParam } from 'eoxc/src/core/util';

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

  events: {
    'click .toggle-side-panel': 'onToggleSidePanelClicked',
    'shown.bs.tab [data-toggle="tab"]': 'onTabShown',
  },

  initialize(options) {
    this.position = options.position || 'left';
    this.views = options.views;
    this.icon = options.icon;
    this.defaultOpen = options.defaultOpen;
    this.openTabIndex = options.openTabIndex;
    this.appConfig = options.config; // whole app config before search params
  },

  onBeforeShow() {
    this.views.forEach((viewConfig, index) => {
      this.addRegion(`region-${index}`, `#${this.position}-${index}`);
      this.showChildView(`region-${index}`, viewConfig.view);
      if (viewConfig.hasInfo) {
        this.listenTo(viewConfig.view, 'update:status', (status) => {
          this.$(`[href="#${this.position}-${index}"] .info`).html(status);
        });
      }
    });

    if (this.defaultOpen) {
      this.onToggleSidePanelClicked();
    }

    if (typeof this.openTabIndex !== 'undefined' && parseInt(this.openTabIndex, 10) > 0) {
      // to trigger respective event
      this.$(`a[href="#${this.position}-${this.openTabIndex}"]`).tab('show');
      // to manually reset active on tab contents
      for (let i = 0; i < this.views.length; i++) {
        if (this.openTabIndex === i) {
          this.$(`#${this.position}-${i}`).addClass('active');
        } else {
          this.$(`#${this.position}-${i}`).removeClass('active');
        }
      }
    }
  },

  onToggleSidePanelClicked() {
    this.$('.side-panel').toggleClass('in');
    this.$('.toggle-side-panel-out').toggleClass('out');
    // search parameters updates
    const panelShown = this.$('.side-panel').hasClass('in');
    if (!this.appConfig.settings.disableSearchParams) {
      // sets only when different from config.defaultOpen
      setSearchParam(`${this.position}panel`, panelShown !== this.appConfig.settings[`${this.position}PanelOpen`] ? panelShown : null);
    }
  },

  onTabShown(e) {
    const ind = parseInt(e.target.href.split('#')[1].split('-')[1], 10);
    const view = this.views[ind].view;
    view.triggerMethod('shown');
    // search parameters updates
    if (!this.appConfig.settings.disableSearchParams) {
      // sets only when different from config.OpenTabIndex
      setSearchParam(`${this.position}paneltab`, ind !== this.appConfig.settings[`${this.position}PanelTabIndex`] ? ind : null);
    }
  },
});
