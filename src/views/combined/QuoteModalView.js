import { featureFromExtent } from 'eoxc/src/contrib/OpenLayers/utils';
import ModalView from 'eoxc/src/core/views/ModalView';

import { copyToClipboard } from '../../utils';
import template from './QuoteModalView.hbs';
import './QuoteModalView.css';

const QuoteModalView = ModalView.extend({
  template,
  templateHelpers() {
    return {
      url: this.layerModel.get('download.url'),
      quoteModalIntro: this.layerModel.get('download.quoteModalIntro'),
      productIds: this.productIds,
      area: this.area,
      time: this.time,
      otherFilters: this.otherFilters.map((param) => {
        return {
          name: param.name,
          value: JSON.stringify(param.value),
        };
      }),
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
    this.layerModel = this.records.searchModel.get('layerModel');
    this.filtersModel = this.records.searchModel.get('filtersModel');
    this.mapModel = this.records.searchModel.get('mapModel');

    let actualWindowObject = window;
    if (window.self !== window.top) { // checking if it is an iframe
      actualWindowObject = window.top;
    }
    // extracts search area and time from url
    const params = new URLSearchParams(actualWindowObject.location.search);
    this.currentUrl = decodeURIComponent(actualWindowObject.location.href);
    this.area = params.get('area') || JSON.stringify(featureFromExtent(this.mapModel.get('bbox')).geometry);
    this.time = `${params.get('start')}/${params.get('end')}`;

    // all extract additional filters from model
    const filters = [];
    for (const [key, value] of Object.entries(this.filtersModel.attributes)) {
      if (key !== 'area' && key !== 'time') {
        filters.push({ name: key, value });
      }
    }
    this.otherFilters = filters;
  },

  onCopyClipboardClicked() {
    const toCopy = JSON.stringify({
      products: this.productIds.join(', '),
      contextInformation: this.currentUrl,
    });
    const copied = copyToClipboard(toCopy);
    if (copied) {
      this.$('.copy-successful').show().delay(5000).fadeOut();
    } else {
      this.$('.copy-unsuccessful').show().delay(8000).fadeOut();
    }
  },
});

export default QuoteModalView;
