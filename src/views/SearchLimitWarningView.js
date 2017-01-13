import Marionette from 'backbone.marionette';

require('./SearchLimitWarningView.css');

export default Marionette.ItemView.extend({
  template: () => '<div class="alert alert-danger">Narrow down search to show all results</div>',
});
