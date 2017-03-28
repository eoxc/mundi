import Backbone from 'backbone';

const WarningModel = Backbone.Model.extend({
  idAttribute: 'message',
});

export default Backbone.Collection.extend({
  model: WarningModel,
  initialize() {
    this.dismissedWarnings = new Set([]);
  },
  setWarning(message, doShow = true) {
    if (doShow && !this.dismissedWarnings.has(message)) {
      this.add({ message });
    } else {
      this.unsetWarning(message);
    }
  },
  unsetWarning(message) {
    this.remove(message);
  },
  dismiss(message) {
    this.unsetWarning(message);
    this.dismissedWarnings.add(message);
  }
});
