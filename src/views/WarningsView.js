import Marionette from 'backbone.marionette';

require('./WarningsView.css');

const WarningView = Marionette.ItemView.extend({
  template: ({ message }) => `<div class="alert alert-warning" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    ${message}
  </div>`,
  events: {
    'click .close': 'onCloseClick',
  },
  onCloseClick() {
    this.model.collection.dismiss(this.model.get('message'));
  },
});


export default Marionette.CollectionView.extend({
  childView: WarningView,
  // template: () => '<div class="alert alert-danger">Narrow down search to show all results</div>',
});
