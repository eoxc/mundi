import Marionette from 'backbone.marionette';

import template from './VendorInfoView.hbs';
import './VendorInfoView.css';
import eyePath from '../eox/EOX_Logo_eye_only.svg';

const VendorInfoView = Marionette.ItemView.extend({
  template,
  templateHelpers: {
    eyePath,
  },
  events: {
    'click .toggle-collapse': 'onToggleCollapseClicked',
  },
  onToggleCollapseClicked() {
    this.$('.collapse,.arrow-collapse,.icon-eox-eye').toggle();
  }
});

export default VendorInfoView;
