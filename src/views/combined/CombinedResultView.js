import Marionette from 'backbone.marionette';
import _ from 'underscore'; // eslint-disable-line import/no-extraneous-dependencies
import $ from 'jquery';

import { isRecordDownloadable, downloadCustom, getDownloadInfos } from 'eoxc/src/download';
import metalinkTemplate from 'eoxc/src/download/Metalink.hbs';
import { setSlice } from 'eoxc/src/search/utils';
import SearchResultHeaderView from './SearchResultHeaderView';
import SearchResultListView from './SearchResultListView';
import DownloadListView from './DownloadListView';
import './CombinedResultView.css';
import template from './CombinedResultView.hbs';
import NoProductTemplate from './NoProductSelected.hbs';

// eslint-disable-next-line max-len
const CombinedResultView = Marionette.LayoutView.extend({
  template,
  templateHelpers() {
    const id = this.layerModel.get('id');
    const enableFullResolutionDownload = this.layerModel.get('fullResolution.protocol');
    const enableProcessing = this.layerModel.get('processing.url');
    const isValidDisplay = typeof this.layerModel.get('display').urls !== 'undefined' ? this.layerModel.get('display').urls[0] !== '' : this.layerModel.get('display').url !== '';
    const selectFilesEnabled = typeof this.onSelectFiles !== 'undefined';
    const automaticSearch = this.singleModel.get('automaticSearch');
    const anySelectedToDisplay = this.singleModel.get('downloadSelection').length > 0 || automaticSearch;
    const initialDisplay = this.layerModel.get('display').visible;
    return {
      id,
      enableFullResolutionDownload,
      enableProcessing,
      selectFilesEnabled,
      anySelectedToDisplay,
      isValidDisplay,
      automaticSearch,
      downloadEnabled: this.downloadEnabled,
      initialDisplay
    };
  },

  EmptyView: Marionette.ItemView.extend({
    template: NoProductTemplate,
  }),

  regions: {
    results: '.result-contents',
    header: '.search-results-header',
  },

  className: 'search-result-view',

  events: {
    'change input[data-layer].search-toggle': 'onSearchToggled',
    'change input[data-layer].display-toggle': 'onDisplayToggled',
    'click .deselect-all': 'onDeselectAllClicked',
    'click .select-files': 'onSelectFilesClicked',
    'click .start-download': 'onStartDownloadClicked',
    'click .download-as-metalink': 'onDownloadAsMetalinkClicked',
    'click .download-as-url-list': 'onDownloadAsUrlListClicked',
    'click .download-full-res': 'onDownloadFullResolutionClick',
    'click .start-processing': 'onProcessingClick',
  },

  childEvents: {
    'click:selected-count': 'onSelectedCountClick',
    'change:terms-and-conditions': 'onTermsAndAndConditionsChange',
    'list:render': 'onSearchListRender',
    'downloadlist:itemRemoved': 'downloadListItemRemoved',
  },

  initialize(options) {
    this.singleModel = this.collection.models[0];
    this.layerModel = this.singleModel.get('layerModel');
    this.filtersModel = options.filtersModel;
    this.highlightModel = options.highlightModel;
    this.fallbackThumbnailUrl = options.fallbackThumbnailUrl;
    this.termsAndConditionsUrl = options.termsAndConditionsUrl;
    this.downloadEnabled = options.downloadEnabled;
    this.onStartDownload = options.onStartDownload;
    this.onSelectFiles = options.onSelectFiles;

    this.hasAcceptedTerms = false;
    this.displaySelected = false;

    this.listenTo(this.collection, 'change', this.onSearchModelsChange);

    this.listenTo(this.singleModel.get('downloadSelection'), 'reset update', this.onDownloadSelectionChange);
  },

  onAttach() {
    this.updateHeaderArea();
    this.updateResultsPanelSize();
  },

  onShown() {
    this.updateViews();
  },

  onRender() {
    this.renderResultContent();
    this.checkButtons();
  },

  saveScrollPosition() {
    // save the scrolling position for later to get around bug in FF and other
    // browsers. Prevent additional updates to scrolling position.
    if (typeof this.savedScrollTop === 'undefined') {
      const scrolledElement = this.$('.result-contents');
      this.savedScrollTop = scrolledElement.scrollTop();
    }
  },

  onSearchListRender() {
    // scroll position update from previous state
    this.$('.result-contents').off('scroll resize');
    this.$('.result-contents').on('scroll resize', _.throttle((...args) => {
      this.updateViews(...args);
    }, 1000 / 60));
    if (typeof this.savedScrollTop !== 'undefined') {
      const scrolledElement = this.$('.result-contents')[0];
      if (typeof scrolledElement !== 'undefined') {
        setTimeout(() => {
          this.$('.result-contents').scrollTop(this.savedScrollTop);
          this.savedScrollTop = undefined;
        });
      }
    }
  },

  downloadListItemRemoved() {
    this.updateViews();
  },

  renderResultContent() {
    // create a child view in results region
    const searchEnabled = this.singleModel.get('automaticSearch');
    const anySelectedToDisplay = this.singleModel.get('downloadSelection').length > 0;

    if (!searchEnabled && !anySelectedToDisplay) {
      // display empty template
      this.showChildView('results', new this.EmptyView(), {});
    } else if ((!searchEnabled && anySelectedToDisplay) || this.displaySelected) {
      // display only selected products
      const options = {
        referenceCollection: this.singleModel.get('downloadSelection'),
        highlightModel: this.highlightModel,
        fallbackThumbnailUrl: this.fallbackThumbnailUrl,
        searchModel: this.singleModel,
      };
      this.showChildView('results', new DownloadListView(options));
    } else {
      // display search results
      const options = {
        searchModel: this.singleModel,
        referenceCollection: this.singleModel.get('results'),
        highlightModel: this.highlightModel,
        fallbackThumbnailUrl: this.fallbackThumbnailUrl,
      };
      this.showChildView('results', new SearchResultListView(options));
    }
    this.checkButtons();
  },

  updateViews() {
    // handle showing of only those products, which are in current scroll area
    const elem = this.$('.result-contents')[0];
    const scrollTop = elem.scrollTop;
    const height = elem.clientHeight;
    const view = this.getRegion('results').currentView;
    if (typeof view !== 'undefined' && typeof view.referenceCollection !== 'undefined') {
      const headerSize = 0;
      const footerSize = 0;
      const itemHeight = 153;
      setSlice(-scrollTop, height, view, headerSize, footerSize, itemHeight);
    }
    elem.scrollTop = scrollTop;
  },

  updateHeaderArea() {
    // create a child view in header region
    const options = {
      collection: this.collection,
      singleModel: this.singleModel,
      termsAndConditionsUrl: this.termsAndConditionsUrl,
      displaySelected: this.displaySelected,
      hasAcceptedTerms: this.hasAcceptedTerms,
    };
    this.showChildView('header', new SearchResultHeaderView(options));
  },

  updateResultsPanelSize() {
    // resize results holding div based on variable footer and header sizes
    const restHeightCombined = this.$('.checbox-switch').outerHeight(true) + this.$('.search-results-header').outerHeight(true) + this.$('.download-disabled-warning').outerHeight(true) + this.$('.search-results-footer').outerHeight(true) + parseInt(this.$('.result-contents').css('marginBottom'), 10) + parseInt(this.$('.result-contents').css('marginTop'), 10);
    this.$('.result-contents').height(`calc(100% - ${restHeightCombined}px)`);
  },

  onSearchModelsChange() {
    // update the global status
    const isSearching = this.singleModel.get('isSearching');
    const hasError = this.singleModel.get('hasError');

    // update the tab header
    if (hasError) {
      this.triggerMethod('update:status', '<i class="fa fa-exclamation"></i>');
    } else if (isSearching) {
      this.triggerMethod('update:status', '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>');
    } else {
      this.triggerMethod('update:status', '');
    }
    this.updateViews();
    this.updateHeaderArea();
    this.updateResultsPanelSize();
  },

  onSearchToggled(event) {
    if (event) {
      const $changed = $(event.target);
      this.singleModel.set('automaticSearch', $changed.is(':checked'));
      this.saveScrollPosition();
      this.render();
    }
    this.onSearchModelsChange();
  },

  onDisplayToggled(event) {
    if (event) {
      const $changed = $(event.target);
      this.layerModel.set('display.visible', $changed.is(':checked'));
    }
  },

  onTermsAndAndConditionsChange(childView, status) {
    this.hasAcceptedTerms = status;
    this.checkButtons();
  },

  onDeselectAllClicked() {
    this.singleModel.get('downloadSelection').reset([]);
  },

  onDownloadFullResolutionClick() {
    this.layerModel.trigger('download-full-resolution', this.layerModel);
  },

  onProcessingClick() {
    this.singleModel.trigger('start-processing', this.singleModel);
  },

  onStartDownloadClicked() {
    this.onStartDownload();
  },

  onSelectFilesClicked() {
    this.onSelectFiles();
  },

  onDownloadAsMetalinkClicked() {
    this.getDownloadInfos()
    .then((items) => {
      let content = metalinkTemplate({
        date: (new Date()).toISOString(),
        items,
      });
      content = content.replace(/[\n]/g, '\r\n');
      downloadCustom('download-files.meta4', 'application/metalink4+xml', content);
    });
  },

  onDownloadAsUrlListClicked() {
    this.getDownloadInfos()
    .then((infos) => {
      downloadCustom('url-list.txt', 'text/plain',
        infos.map(info => info.href).join('\r\n')
      );
    });
  },

  onSelectAllClick() {
    this.singleModel.get('results')
      .filter(recordModel => isRecordDownloadable(this.singleModel.get('layerModel'), recordModel))
      .forEach(recordModel => recordModel.selectForDownload());
  },

  onDownloadSelectionChange() {
    const downloadSelection = this.singleModel.get('downloadSelection');
    if (typeof downloadSelection !== 'undefined' && downloadSelection.length === 0) {
      if (!this.singleModel.get('automaticSearch') || this.displaySelected) {
        this.displaySelected = false;
        this.renderResultContent();
        this.onSearchModelsChange();
      }
      this.displaySelected = false;
    }
    this.checkButtons();
  },

  onSelectedCountClick() {
    this.saveScrollPosition();
    this.displaySelected = !this.displaySelected;
    this.render();
    this.onSearchModelsChange();
  },

  checkButtons() {
    const totalCountNotS3 = this.collection
      .filter(searchModel => searchModel.get('layerModel').get('download.protocol') !== 'S3')
      .reduce((count, searchModel) => (
        count + searchModel.get('downloadSelection').length
      ), 0);

    const totalCount = this.collection
      .reduce((count, searchModel) => (
        count + searchModel.get('downloadSelection').length
      ), 0);

    let fullDownloadEnabled = totalCountNotS3 > 0 && this.downloadEnabled;
    let textDownloadEnabled = totalCount > 0 && this.downloadEnabled;
    if (this.termsAndConditionsUrl) {
      fullDownloadEnabled = fullDownloadEnabled && this.hasAcceptedTerms;
      textDownloadEnabled = textDownloadEnabled && this.hasAcceptedTerms;
    }

    this.$('.start-download')
      .prop('disabled', !fullDownloadEnabled);

    this.$('.dropdown-toggle')
      .prop('disabled', !textDownloadEnabled);

    this.$('.select-files')
      .prop('disabled', !textDownloadEnabled);

    this.$('.deselect-all')
      .prop('disabled', totalCount === 0);
  },

  getDownloadInfos(options) {
    function flatten(arr) {
      return arr.reduce((acc, val) => acc.concat(val), []);
    }

    const chunks = this.collection
          .map(searchModel =>
            searchModel.get('downloadSelection')
              .map(recordModel => getDownloadInfos(
                searchModel.get('layerModel'), this.filtersModel, recordModel, options)
              )
          );

    return Promise.all(flatten(chunks))
      .then(received => flatten(received));
  },
});

export default CombinedResultView;
