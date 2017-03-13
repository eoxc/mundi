import Marionette from 'backbone.marionette';

import template from './VendorInfoView.hbs';
import './VendorInfoView.css';

const VendorInfoView = Marionette.ItemView.extend({
  template,
  templateHelpers() {
    return {
      eoxcVersion: this.eoxcVersion,
      cdeVersion: this.cdeVersion,
    };
  },
  events: {
    'click .toggle-collapse': 'onToggleCollapseClicked',
  },
  initialize(options) {
    this.eoxcVersion = options.eoxcVersion;
    this.cdeVersion = options.cdeVersion;
  },
  onToggleCollapseClicked() {
    this.$('.collapse,.arrow-collapse,.icon-eox-eye-white').toggle();
  }
});

export default VendorInfoView;
