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

  initialize(options) {
    this.highlightModel = options.highlightModel;
    this.fallbackThumbnailUrl = options.fallbackThumbnailUrl;
    this.collection = options.collection;
  },
});

export default DownloadListView;
