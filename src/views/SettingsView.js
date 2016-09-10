import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import $ from 'jquery';
import shp from 'shpjs';

import { readFileAsArraybuffer } from '../utils';

//
// require('expose?jQuery!jquery');

const template = require('./SettingsView.hbs');
require('./SettingsView.less');

require('bootstrap-datetimepicker/src/js/bootstrap-datetimepicker.js');
// require('bootstrap-datetimepicker/src/less/bootstrap-datetimepicker.less');
// require('bootstrap-datepicker/dist/css/bootstrap-datepicker.css');
// require('imports?window=>{jQuery: jquery}!bootstrap-filestyle');

//
// require('bootstrap-filestyle');

const FeatureView = Marionette.ItemView.extend({
  tagName: 'li',
  template: (attrs) => `<a href="#">${attrs.properties.NAME}</a>`,

  triggers: {
    'click a': 'item:clicked',
    mouseover: 'item:hover',
    mouseout: 'item:hover:end',
  },
});

const FeatureListView = Marionette.CollectionView.extend({
  tagName: 'ul',
  className: 'list-unstyled',
  childView: FeatureView,

  initialize(options) {
    this.mapModel = options.mapModel;
  },

  childEvents: {
    'item:clicked': 'onItemClicked',
    'item:hover': 'onItemHover',
    'item:hover:end': 'onItemHoverEnd',
  },

  onItemClicked(childView) {
    this.trigger('item:clicked', childView.model);
  },

  onItemHover(childView) {
    this.mapModel.highlight(childView.model.attributes);
  },

  onItemHoverEnd(childView) {
    this.mapModel.unHighlight(childView.model.attributes);
  },
});

export default Marionette.LayoutView.extend({
  template,
  regions: {
    featureList: '.feature-list',
  },
  events: {
    'change :file': 'onFileChanged',
    'click .select-feature': 'onSelectFeatureClicked',
  },

  initialize(options) {
    this.mapModel = options.mapModel;
    this.filtersModel = options.filtersModel;
    this.featureListCollection = new Backbone.Collection;
  },

  onBeforeShow() {
    this.showChildView('featureList', new FeatureListView({
      mapModel: this.mapModel,
      collection: this.featureListCollection,
    }));
    // this.$('[data-provide="datepicker"]').datetimepicker();
  },
  onFileChanged(event) {
    const $input = $(event.target).parents('.input-group').find(':text');
    if (event.currentTarget.files) {
      const name = event.currentTarget.files[0].name;
      $input.val(name);


      readFileAsArraybuffer(event.currentTarget.files[0])
        .then(data => shp(data))
        .then(features => {
          this.featureListCollection.reset(features.features);
          this.$('.select-feature').prop('disabled', false);
          this.$('.panel-features').fadeIn('fast');
        });
    } else {
      $input.val('');
    }
  },
  onSelectFeatureClicked(event) {
    event.preventDefault();
    alert("");
  },
});
