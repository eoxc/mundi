import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

import SelectionListItemView from 'eoxc/src/download/views/SelectionListItemView';
import template from './DownloadListView.hbs';

const DownloadListView = Marionette.CompositeView.extend({
  template,
  childView: SelectionListItemView,
  childViewContainer: '.selection-items',
  buildChildView(child, ChildViewClass) {
    return new ChildViewClass({
      model: child,
      highlightModel: this.highlightModel,
      fallbackThumbnailUrl: this.fallbackThumbnailUrl,
      collection: this.collection,
    });
  },

  constructor(options) {
    Marionette.CompositeView.prototype.constructor.call(this, Object.assign({}, options, {
      collection: new Backbone.Collection(),
    }));
  },

  initialize(options) {
    this.highlightModel = options.highlightModel;
    this.fallbackThumbnailUrl = options.fallbackThumbnailUrl;
    this.searchModel = options.searchModel;
    this.listenTo(this.model, 'change', this.render, this);
    this.listenTo(this.searchModel.get('downloadSelection'), 'update', this.onDownloadListItemRemoved);
  },

  onDownloadListItemRemoved() {
    // passing event up to parent
    this.triggerMethod('downloadlist:itemRemoved');
  },
});

export default DownloadListView;
