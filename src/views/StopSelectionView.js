import Marionette from 'backbone.marionette';

export default Marionette.ItemView.extend({
  template: () => '<button class="btn btn-danger" style="box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.39); border: 1px solid black;">Stop Selection</button>',
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
