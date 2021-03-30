import $ from 'jquery';
import ModalView from 'eoxc/src/core/views/ModalView';

import { copyToClipboard } from '../../utils';
import template from './QuoteModalView.hbs';
import './QuoteModalView.css';

const QuoteModalView = ModalView.extend({
  template,
  templateHelpers() {
    return {
      records: this.records,
      moreThanOne: this.records.length > 1,
      productIds: this.productIds,
      url: this.searchCollection.models[0].get('layerModel').get('download.url'),
    };
  },

  onRender() {
  },

  events: {
    'click .copy-clipboard': 'onCopyClipboardClicked',
  },

  initialize(options) {
    this.records = options.records;
    this.productIds = this.records.models.map(item => item.get('id'));
    this.searchCollection = options.searchCollection;
  },

  onCopyClipboardClicked() {
    const toCopy = this.productIds.join(', ');
    const copied = copyToClipboard(toCopy);
    if (copied) {
      this.$('.copy-successful').show().delay(5000).fadeOut();
    } else {
      this.$('.copy-unsuccessful').show().delay(8000).fadeOut();
    }
  }
});

export default QuoteModalView;
