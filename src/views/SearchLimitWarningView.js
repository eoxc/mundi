import Marionette from 'backbone.marionette';

export default Marionette.ItemView.extend({
  template: () => '<div class="alert alert-danger">Search hit more records than are actually shown</div>',
});
