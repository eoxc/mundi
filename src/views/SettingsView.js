import Marionette from 'backbone.marionette';

const template = require('./SettingsView.hbs');
require('./SettingsView.css');

require('bootstrap-datepicker');
require('bootstrap-datepicker/dist/css/bootstrap-datepicker.css');

export default Marionette.LayoutView.extend({
  template,
});
