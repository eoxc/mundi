import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import $ from 'jquery';
import shp from 'shpjs';

import { readFileAsArraybuffer } from '../utils';

//
// require('expose?jQuery!jquery');

const template = require('./FiltersView.hbs');
require('./FiltersView.less');

// require('eonasdan-bootstrap-datetimepicker');
// require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css');
// require('bootstrap-datepicker/dist/css/bootstrap-datepicker.css');
// require('imports?window=>{jQuery: jquery}!bootstrap-filestyle');


import 'bootstrap-datepicker';

//
// require('bootstrap-filestyle');

const FeatureView = Marionette.ItemView.extend({
  tagName: 'li',
  template: (attrs) => `<a href='#'>${attrs.properties.NAME} <small class="text-right">(${attrs.geometry.type})</small></a>`,
  triggers: {
    'click a': 'item:clicked',
    mouseover: 'item:hover',
    mouseout: 'item:hover:end',
  },
});

const FeatureListView = Marionette.CompositeView.extend({
  // tagName: 'ul',
  className: 'dropdown',
  childView: FeatureView,

  template: () => `
    <button type="button" class="btn btn-default btn-block dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled>
      Select Feature
      <span class="caret"></span>
    </button>
    <ul class="dropdown-menu" style="max-height: 300px; overflow-y: scroll"></ul>
  `,

  childViewContainer: '.dropdown-menu',

  initialize(options) {
    this.mapModel = options.mapModel;
    this.filtersModel = options.filtersModel;
    this.listenTo(this.collection, 'reset', this.onCollectionReset);
  },

  onBeforeShow() {
    // hold onto the drop down menu
    // var dropdownMenu;
    //
    // // and when you show it, move it to the body
    // $(window).on('show.bs.dropdown', function (e) {
    //
    //     // grab the menu
    //     dropdownMenu = $(e.target).find('.dropdown-menu');
    //
    //     // detach it and append it to the body
    //     $('body').append(dropdownMenu.detach());
    //
    //     // grab the new offset position
    //     var eOffset = $(e.target).offset();
    //
    //     // make sure to place it where it would normally go (this could be improved)
    //     dropdownMenu.css({
    //       'display': 'block',
    //       'top': eOffset.top + $(e.target).outerHeight(),
    //       'left': eOffset.left
    //     });
    // });
    //
    // // and when you hide it, reattach the drop down, and hide it normally
    // $(window).on('hide.bs.dropdown', function (e) {
    //     $(e.target).append(dropdownMenu.detach());
    //     dropdownMenu.hide();
    // });
  },

  onCollectionReset() {
    this.$('button').prop('disabled', this.collection.length === 0);
  },

  childEvents: {
    'item:clicked': 'onItemClicked',
    'item:hover': 'onItemHover',
    'item:hover:end': 'onItemHoverEnd',
  },

  onItemClicked(childView) {
    this.filtersModel.set('area', childView.model.attributes);
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
  templateHelpers() {
    return {
      startTime: this.filtersModel.get('time')[0].toISOString().slice(0, 10),
      endTime: this.filtersModel.get('time')[1].toISOString().slice(0, 10),
      area: this.filtersModel.get('area'),
    };
  },
  regions: {
    featureList: '.feature-list',
  },
  events: {
    'change .datetime input': 'onDateInputChange',
    'click .tool-point': 'onToolPointClicked',
    'click .tool-bbox': 'onToolBBoxClicked',
    'click .tool-polygon': 'onToolPolygonClicked',
    'click .tool-clear': 'onToolClearClicked',
    'click .tool-show-feature': 'onToolShowFeatureClicked',
    'change :file': 'onFileChanged',
  },

  initialize(options) {
    this.mapModel = options.mapModel;
    this.filtersModel = options.filtersModel;
    this.featureListCollection = new Backbone.Collection;

    this.listenTo(this.filtersModel, 'change:time', this.onFiltersTimeChanged);
    this.listenTo(this.filtersModel, 'change:area', this.onFiltersAreaChanged);
    this.listenTo(this.mapModel, 'change:tool', this.onMapToolChanged);
  },

  onBeforeShow() {
    this.showChildView('featureList', new FeatureListView({
      mapModel: this.mapModel,
      filtersModel: this.filtersModel,
      collection: this.featureListCollection,
    }));
    // this.$('.date:eq(0)').datepicker({
    //   inputs: this.$('.date:eq(0) input:eq(0)'),
    // });
    // this.$('.date:eq(1)').datepicker({
    //   inputs: this.$('.date:eq(1) input:eq(0)'),
    // });

    // this.$('[data-provide="datepicker"]').datetimepicker();


    this.onFiltersTimeChanged(this.filtersModel);
  },

  // UI event handlers
  onDateInputChange() {
    const startDate = this.$('.datetime:eq(0) input[type=date]')[0].valueAsDate;
    const startTime = this.$('.datetime:eq(0) input[type=time]')[0].valueAsDate;
    const endDate = this.$('.datetime:eq(1) input[type=date]')[0].valueAsDate;
    const endTime = this.$('.datetime:eq(1) input[type=time]')[0].valueAsDate;
    if (startDate && startTime && endDate && endTime) {
      startDate.setUTCHours(startTime.getUTCHours());
      startDate.setUTCMinutes(startTime.getUTCMinutes());
      endDate.setUTCHours(endTime.getUTCHours());
      endDate.setUTCMinutes(endTime.getUTCMinutes());
      this.filtersModel.set('time',
        (startDate < endDate) ? [startDate, endDate] : [endDate, startDate]
      );
    }
  },

  onToolPointClicked() {
    this.mapModel.set('tool', 'point');
  },

  onToolBBoxClicked() {
    this.mapModel.set('tool', 'bbox');
  },

  onToolPolygonClicked() {
    this.mapModel.set('tool', 'polygon');
  },

  onToolClearClicked(event) {
    event.preventDefault();
    this.mapModel.set('tool', null);
    this.filtersModel.set('area', null);
  },

  onToolShowFeatureClicked(event) {
    event.preventDefault();
    const area = this.filtersModel.get('area');
    this.mapModel.show(area);
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

  // Model event handlers
  onFiltersTimeChanged(filtersModel) {
    // this.$('[data-provide="datepicker"]:eq(0)').data('DateTimePicker').date(value[0]);
    // this.$('[data-provide="datepicker"]:eq(1)').data('DateTimePicker').date(value[1]);
    // this.$('.date:eq(0)').datepicker('update', value[0]);
    // this.$('.date:eq(1)').datepicker('update', value[1]);

    const time = filtersModel.get('time').map(date => {
      const newDate = new Date(date);
      newDate.setUTCMilliseconds(0);
      return newDate;
    });

    this.$('.datetime:eq(0) input[type=date]')[0].valueAsDate = time[0];
    this.$('.datetime:eq(0) input[type=time]')[0].valueAsDate = time[0];
    this.$('.datetime:eq(1) input[type=date]')[0].valueAsDate = time[1];
    this.$('.datetime:eq(1) input[type=time]')[0].valueAsDate = time[1];
  },

  onFiltersAreaChanged(filtersModel) {
    const area = filtersModel.get('area');
    if (Array.isArray(area) && area.length === 4) {
      this.$('#tab-bbox input[type=number]:eq(0)').val(area[0]);
      this.$('#tab-bbox input[type=number]:eq(1)').val(area[1]);
      this.$('#tab-bbox input[type=number]:eq(2)').val(area[2]);
      this.$('#tab-bbox input[type=number]:eq(3)').val(area[3]);
    } else if (area && area.geometry && area.geometry.type === 'Point') {
      this.$('#tab-point input[type=number]:eq(0)').val(area.geometry.coordinates[0]);
      this.$('#tab-point input[type=number]:eq(1)').val(area.geometry.coordinates[1]);
    } else if (area && area.geometry && area.geometry.type === 'Polygon') {
      let name = 'Polygon';
      if (area.properties) {
        const keys = ['name', 'NAME']; // TODO: more
        for (let i = 0; i < keys.length; ++i) {
          if (area.properties.hasOwnProperty(keys[i])) {
            name = area.properties[keys[i]];
            break;
          }
        }
      }
      this.$('#tab-point input[type=text]').val(name);
    }

    if (area) {
      this.$('.tool-show-feature,.tool-clear').removeClass('disabled');
    } else {
      this.$('.tool-show-feature,.tool-clear').addClass('disabled');
    }
  },

  onMapToolChanged(mapModel, tool) {
    this.$('.tool').removeClass('active');
    if (tool) {
      this.$(`.tool-${tool}`).addClass('active');
    }
  },
});
