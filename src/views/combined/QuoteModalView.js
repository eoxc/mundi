import ModalView from 'eoxc/src/core/views/ModalView';

import { copyToClipboard } from '../../utils';
import template from './QuoteModalView.hbs';
import './QuoteModalView.css';

const QuoteModalView = ModalView.extend({
  template,
  templateHelpers() {
    return {
      records: this.records.models,
      productIds: this.productIds,
      url: this.layerModel.get('download.url'),
      quoteModalIntro: this.layerModel.get('download.quoteModalIntro'),
      area: this.area,
    };
  },

  onRender() {
  },

  events: {
    'click .copy-clipboard': 'onCopyClipboardClicked',
    'click .copy-clipboard-area': 'onCopyClipboardAreaClicked',
  },

  initialize(options) {
    this.records = options.records;
    this.productIds = this.records.models.map(item => item.get('id'));
    this.layerModel = this.records.searchModel.get('layerModel');
    let actualWindowObject = window;
    if (window.self !== window.top) { // checking if it is an iframe
      actualWindowObject = window.top;
    }
    // extracts search area from url
    const params = new URLSearchParams(actualWindowObject.location.search);
    this.area = params.get('area');
  },

  onCopyClipboardClicked() {
    const toCopy = this.productIds.join(', ');
    const copied = copyToClipboard(toCopy);
    if (copied) {
      this.$('.copy-successful').show().delay(5000).fadeOut();
    } else {
      this.$('.copy-unsuccessful').show().delay(8000).fadeOut();
    }
  },

  onCopyClipboardAreaClicked() {
    const copied = copyToClipboard(this.area);
    if (copied) {
      this.$('.copy-successful').show().delay(5000).fadeOut();
    } else {
      this.$('.copy-unsuccessful').show().delay(8000).fadeOut();
    }
  }
});

export default QuoteModalView;
