import Marionette from 'backbone.marionette';

import { isRecordDownloadable } from 'eoxc/src/download';
import './SearchResultHeaderView.css';
import template from './SearchResultHeaderView.hbs';

const SearchResultHeaderView = Marionette.ItemView.extend({
  template,
  templateHelpers() {
    const hasLoaded = this.singleModel.get('hasLoaded');
    const hasMore = this.hasMore();
    const hasError = this.singleModel.get('hasError');
    const loadMore = this.singleModel.get('loadMore');
    const totalResults = this.singleModel.get('totalResults');
    const layerModel = this.singleModel.get('layerModel');
    const downloadSelection = this.singleModel.get('downloadSelection');
    const downloadSelectionSize = typeof downloadSelection !== 'undefined' ? downloadSelection.length : 0;
    const downloadableCount = this.collection
      .map(searchModel =>
        searchModel.get('results')
          .filter(recordModel => isRecordDownloadable(searchModel.get('layerModel'), recordModel))
          .length
      )
      .reduce((count, modelCount) => (
        count + modelCount
      ), 0);
    return {
      termsAndConditionsUrl: this.termsAndConditionsUrl,
      hasMore,
      totalResults,
      hasLoaded,
      hasError,
      loadMore,
      countLoadMore: hasMore ? Math.min(totalResults - hasLoaded, loadMore) : 0,
      automaticSearch: this.singleModel.get('automaticSearch'),
      layerName: layerModel.get('displayName'),
      anySelectedToDisplay: downloadSelectionSize > 0 || this.singleModel.get('automaticSearch'),
      isSearching: this.singleModel.get('isSearching'),
      downloadableListEmpty: downloadableCount === 0,
      searchRequest: this.searchRequest,
      displaySelected: this.displaySelected,
      hasAcceptedTerms: this.hasAcceptedTerms,
    };
  },

  events: {
    'click .btn-load-more': 'onLoadMoreClicked',
    'click .select-all-combined': 'onSelectAllClick',
    'click .btn-selected-count': 'onSelectedCountClick',
    'change .terms-and-conditions': 'onTermsAndAndConditionsChange',
  },

  initialize(options) {
    this.singleModel = options.singleModel;
    this.termsAndConditionsUrl = options.termsAndConditionsUrl;
    this.searchRequest = this.singleModel.get('searchRequest');
    this.displaySelected = options.displaySelected;
    this.hasAcceptedTerms = options.hasAcceptedTerms;

    this.listenTo(this.singleModel.get('downloadSelection'), 'reset update', this.onDownloadSelectionChange);
  },

  onRender() {
    this.refreshSelectedButton();
  },

  onSelectedCountClick() {
    // change handled at parent view through event listener
    this.triggerMethod('click:selected-count');
  },

  onDownloadSelectionChange() {
    this.refreshSelectedButton();
  },

  onSelectAllClick() {
    this.singleModel.get('results')
      .filter(recordModel => isRecordDownloadable(this.singleModel.get('layerModel'), recordModel))
      .forEach(recordModel => recordModel.selectForDownload());
  },

  onLoadMoreClicked() {
    this.singleModel.searchMore();
  },

  onTermsAndAndConditionsChange() {
    // change handled at parent view through event listener
    this.hasAcceptedTerms = this.$('.terms-and-conditions').is(':checked');
    this.triggerMethod('change:terms-and-conditions', this.hasAcceptedTerms);
  },

  hasMore() {
    if (this.singleModel.get('hasError')) {
      return false;
    }
    const totalResults = this.singleModel.get('totalResults');
    const hasLoaded = this.singleModel.get('hasLoaded');
    return (
      typeof totalResults !== 'undefined'
      && typeof hasLoaded !== 'undefined' ? totalResults > hasLoaded : false
    );
  },

  refreshSelectedButton() {
    const selectedProducts = this.singleModel.get('downloadSelection');
    const selectedCount = typeof selectedProducts !== 'undefined' ? selectedProducts.length : 0;
    this.$('.btn-selected-count').prop('disabled',
    selectedCount === 0 || this.singleModel.get('automaticSearch') === false);
    if (this.displaySelected && this.singleModel.get('automaticSearch') === true) {
      this.$('.btn-selected-count').html(`<span class="caret selected-count-caret"></span>
 Show all products`);
    } else {
      this.$('.btn-selected-count').html(`Selected (${selectedCount})`);
    }
  },
});

export default SearchResultHeaderView;
