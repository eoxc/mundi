import Marionette from 'backbone.marionette';

import template from './VendorInfoView.hbs';
import './VendorInfoView.css';
import '../eox/style.css';

const VendorInfoView = Marionette.ItemView.extend({
  template,
  onRender() {
    this.$('[data-toggle="popover"]').popover();
  }
});

export default VendorInfoView;
