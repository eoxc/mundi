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

  childEvents: {
    'item:clicked': 'onItemClicked',
    'item:info': 'onItemInfo',
    'item:hover': 'onItemHover',
    'item:hover:end': 'onItemHoverEnd',
  },

  constructor(options) {
    const collection = new Backbone.Collection();
    collection.searchModel = options.searchModel;
    Marionette.CompositeView.prototype.constructor.call(this, Object.assign({}, options, {
      collection
    }));
  },

  initialize(options) {
    this.searchModel = options.searchModel;
    this.highlightModel = options.highlightModel;
    this.fallbackThumbnailUrl = options.fallbackThumbnailUrl;
    this.referenceCollection = options.referenceCollection;
    this.listenTo(this.searchModel, 'change', this.onSearchModelChange);
  },

  onRender() {
    this.triggerMethod('list:render');
  },

  onSearchModelChange() {
    if (this.searchModel.get('hasError')) {
      this.$('.search-error-message').html(`
        <p><h4>Search Error:</h2>
        <p>${this.searchModel.get('errorMessage')}`
      );
      this.$('.search-error-message').show();
    } else {
      this.$('.search-error-message').hide();
    }
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

});

export default SearchResultListView;
