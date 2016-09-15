import Marionette from 'backbone.marionette';

export default Marionette.ItemView.extend({
  template: () => '<button class="btn btn-danger">Stop Selection</button>',
  events: {
    'click button': 'onStopSelectionClicked',
  },
  initialize(options) {
    this.mapModel = options.mapModel;
  },
  onStopSelectionClicked() {
    this.mapModel.set('tool', null);
  },
});
