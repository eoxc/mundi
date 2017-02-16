import Marionette from 'backbone.marionette';

import template from './VendorInfoView.hbs';
import './VendorInfoView.css';

const VendorInfoView = Marionette.ItemView.extend({
  template,
  events: {
    'click .toggle-collapse': 'onToggleCollapseClicked',
  },
  onToggleCollapseClicked() {
    this.$('.collapse,.arrow-collapse,.icon-eox-eye-white').toggle();
  }
});

export default VendorInfoView;
