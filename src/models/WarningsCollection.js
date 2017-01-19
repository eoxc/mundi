import Backbone from 'backbone';

const WarningModel = Backbone.Model.extend({
  idAttribute: 'message',
});

export default Backbone.Collection.extend({
  model: WarningModel,
  setWarning(message, doShow = true) {
    if (doShow) {
      this.add({ message });
    } else {
      this.unsetWarning(message);
    }
  },
  unsetWarning(message) {
    this.remove(message);
  },
});
