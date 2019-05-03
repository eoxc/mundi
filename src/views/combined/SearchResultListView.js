import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

import SearchResultItemView from './SearchResultItemView';
import template from './SearchResultListView.hbs';
import './SearchResultListView.css';

// eslint-disable-next-line max-len
const SearchResultListView = Marionette.CompositeView.extend({
  template,
  templateHelpers() {
    return {
      hasError: this.searchModel.get('hasError'),
    };
  },
  tagName: 'ul',
  className: 'search-result-list list-unstyled list-inline',

  childView: SearchResultItemView,
  childViewContainer: 'ul.result-list',

  buildChildView(child, ChildViewClass) {
    return new ChildViewClass({
      model: child,
      searchModel: this.searchModel,
      highlightModel: this.highlightModel,
      fallbackThumbnailUrl: this.fallbackThumbnailUrl,
    });
  },

  events: {
    render: 'onRender',
  },

  childEvents: {
    'item:clicked': 'onItemClicked',
    'item:info': 'onItemInfo',
    'item:hover': 'onItemHover',
    'item:hover:end': 'onItemHoverEnd',
  },

  constructor(options) {
    Marionette.CompositeView.prototype.constructor.call(this, Object.assign({}, options, {
      collection: new Backbone.Collection(),
    }));
  },

  initialize(options) {
    this.searchModel = options.searchModel;
    this.highlightModel = options.highlightModel;
    this.fallbackThumbnailUrl = options.fallbackThumbnailUrl;
    this.referenceCollection = options.referenceCollection;
    this.listenTo(this.model, 'change', this.render, this);
  },

  onRender() {
    this.triggerMethod('list:render');
  },

  onItemClicked(childView) {
    this.trigger('item:clicked', childView.model);
  },

  onItemInfo(childView) {
    this.trigger('item:info', {
      record: childView.model, searchModel: this.searchModel,
    });
  },

  onItemHover(childView) {
    this.highlightModel.highlight(childView.model.attributes);
  },

  onItemHoverEnd(childView) {
    this.highlightModel.unHighlight(childView.model.attributes);
  },

  setSlice(offset, sliceHeight) {
    const size = this.calculateSize();
    const headerHeight = 0;
    const itemHeight = 153;
    const numItems = this.referenceCollection.length;
    let first = 0;
    let last = 0;
    if (offset + size < 0 // this view is completely above the current window
        || offset > sliceHeight) { // this view is completely below the current window
      first = last = numItems;
    } else {
      const firstOffset = offset + headerHeight;
      if (firstOffset < -itemHeight) {
        const firstRow = Math.floor(Math.abs(firstOffset) / itemHeight);
        first = firstRow * 3;
      }
      const lastRow = Math.ceil(Math.abs(-firstOffset + sliceHeight) / itemHeight);
      last = lastRow * 3;
    }
    this.collection.set(this.referenceCollection.slice(first, last));
    this.$('.spacer-top').css('height', Math.ceil(first / 3) * itemHeight);
    this.$('.spacer-bottom').css('height', Math.ceil((numItems - last) / 3) * itemHeight);
  },

  calculateItemsSize(numItems) {
    const itemHeight = 153;
    return Math.ceil(numItems / 3) * itemHeight;
  },

  calculateSize() {
    const headerHeight = 0;
    const footerHeight = 0;
    return this.calculateItemsSize(this.referenceCollection.length)
      + headerHeight + footerHeight;
  },
});

export default SearchResultListView;
