import RecordItemView from 'eoxc/src/core/views/RecordItemView';
import { isRecordDownloadable } from 'eoxc/src/download';
import template from './SearchResultItemView.hbs';

// eslint-disable-next-line max-len
const SearchResultItemView = RecordItemView.extend({
  template,
  className: 'result-list-item record-item',

  events: Object.assign({}, RecordItemView.prototype.events, {
    'click a': 'onChecked',
  }),

  initialize(options) {
    const searchModel = options.searchModel;
    this.layerModel = searchModel.get('layerModel');
    RecordItemView.prototype.initialize.call(this, Object.assign({}, options, {
      thumbnailUrlPattern: this.layerModel.get('search.thumbnailUrlPattern'),
      collection: options.model.collection,
    }));
    const downloadSelectionCollection = searchModel.get('downloadSelection');
    this.listenTo(downloadSelectionCollection, 'reset update', this.onSelectedForDownloadChange);
  },

  onRender() {
    RecordItemView.prototype.onRender.call(this);
    this.onSelectedForDownloadChange();
  },

  onChecked(event) {
    event.preventDefault();
    if (isRecordDownloadable(this.layerModel, this.model)) {
      this.model.selectForDownload(!this.model.isSelectedForDownload());
    }
  },

  onSelectedForDownloadChange() {
    this.$el.toggleClass('selected-for-download', this.model.isSelectedForDownload());
  },
});

export default SearchResultItemView;
