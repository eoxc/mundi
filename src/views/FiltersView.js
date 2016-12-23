import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import $ from 'jquery';
import shp from 'shpjs';
import moment from 'moment';
import 'moment-timezone';
import 'eonasdan-bootstrap-datetimepicker';
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';
import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.css';

import 'eoxc/src/core/base.css';

import { readFileAsArraybuffer } from '../utils';

//
// require('expose?jQuery!jquery');

const template = require('./FiltersView.hbs');
require('./FiltersView.less');


const FeatureView = Marionette.ItemView.extend({
  tagName: 'li',
  template: attrs => `
    <a href='#'>${attrs.properties.NAME} <small class="text-right">(${attrs.geometry.type})</small></a>
  `,
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
    <button type="button" class="btn btn-default btn-sm btn-block dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled>
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
    let dropdownMenu;

    // and when you show it, move it to the body
    this.$el.on('show.bs.dropdown', (e) => {
      // grab the menu
      dropdownMenu = $(e.target).find('.dropdown-menu');

      // detach it and append it to the body
      $('body').append(dropdownMenu.detach());

      // grab the new offset position
      const eOffset = $(e.target).offset();

      // make sure to place it where it would normally go (this could be improved)
      dropdownMenu.css({
        display: 'block',
        top: eOffset.top + $(e.target).outerHeight(),
        left: eOffset.left,
      });
    });

    // and when you hide it, reattach the drop down, and hide it normally
    this.$el.on('hide.bs.dropdown', (e) => {
      $(e.target).append(dropdownMenu.detach());
      dropdownMenu.hide();
    });
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
      extraParameters: this.extraParameters.map((param) => {
        const result = param.name.replace(/([A-Z])/g, ' $1');
        const displayName = result.charAt(0).toUpperCase() + result.slice(1);
        // return Object.assign({ displayName }, param);
        return { ...param, displayName };
      }),
    };
  },
  regions: {
    featureList: '.feature-list',
  },
  events: {
    'dp.change .datetime': 'onDateInputChange',
    'click .tool-show-time': 'onShowTimeClicked',
    'change .show-point input': 'onPointInputChange',
    'change .show-bbox input': 'onBBoxInputChange',
    'click .tool-point': 'onToolPointClicked',
    'click .tool-bbox': 'onToolBBoxClicked',
    'click .tool-polygon': 'onToolPolygonClicked',
    'click .tool-clear': 'onToolClearClicked',
    'click .tool-show-feature': 'onToolShowFeatureClicked',
    'change :file': 'onFileChanged',
    'change .extra-parameter input[type="text"]': 'onExtraParameterChanged',
    'change .extra-parameter select': 'onExtraParameterChanged',
    'slideStop .extra-parameter input[data-provide="slider"]': 'onExtraParameterChanged',
  },

  initialize(options) {
    this.mapModel = options.mapModel;
    this.filtersModel = options.filtersModel;
    this.featureListCollection = new Backbone.Collection();
    this.extraParameters = options.extraParameters;

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

    this.$('.datetime').datetimepicker({
      locale: 'en',
      format: 'YYYY-MM-DD HH:mm:ss',
      dayViewHeaderFormat: 'YYYY-MM',
      useCurrent: false,
      showTodayButton: true,
      showClose: true,
      timeZone: 'UTC',
      // minDate, maxDate
      // useCurrent oder defaultDate???
      // sideBySide ???
      // , showClear, showClose, ...
    });

    this.$('[data-provide="slider"]').slider({
      tooltip_position: 'top',
    });
  },

  onShow() {
    this.onFiltersTimeChanged(this.filtersModel);
  },

  onDateInputChange() {
    const start = this.$('.datetime.start').data('DateTimePicker').date();
    const end = this.$('.datetime.end').data('DateTimePicker').date();

    if (!this.updatingTime && start && end) {
      const startDate = start.toDate();
      const endDate = end.toDate();
      this.filtersModel.set('time',
        (startDate < endDate) ? [startDate, endDate] : [endDate, startDate]
      );
    }
  },

  onShowTimeClicked() {
    this.filtersModel.show(this.filtersModel.get('time'));
  },

  onPointInputChange() {
    const coordinates = this.$('.show-point input[type=number]')
      .map((index, elem) => $(elem).val())
      .get()
      .map(parseFloat);

    if (coordinates.reduce((prev, current) => prev & !isNaN(current), true)) {
      this.filtersModel.set('area', { geometry: { type: 'Point', coordinates } });
    }
  },

  onBBoxInputChange() {
    const bbox = this.$('.show-bbox input[type=number]')
      .map((index, elem) => $(elem).val())
      .get()
      .map(parseFloat);

    if (bbox.reduce((prev, current) => prev & !isNaN(current), true)) {
      this.filtersModel.set('area', bbox);
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
    const time = filtersModel.get('time');
    this.updatingTime = true;
    this.$('.datetime.start').data('DateTimePicker').date(moment(time[0]));
    this.$('.datetime.end').data('DateTimePicker').date(moment(time[1]));

    this.$('.datetime.start').data('DateTimePicker').viewDate(moment(time[0]));
    this.$('.datetime.end').data('DateTimePicker').viewDate(moment(time[1]));
    this.updatingTime = false;
  },

  onFiltersAreaChanged(filtersModel) {
    const area = filtersModel.get('area');

    this.$('.show-geometry').hide();
    if (Array.isArray(area) && area.length === 4) {
      this.$('.show-bbox input[type=number]:eq(0)').val(area[0]);
      this.$('.show-bbox input[type=number]:eq(1)').val(area[1]);
      this.$('.show-bbox input[type=number]:eq(2)').val(area[2]);
      this.$('.show-bbox input[type=number]:eq(3)').val(area[3]);
      this.$('.show-bbox').show();
    } else if (area && area.geometry && area.geometry.type === 'Point') {
      this.$('.show-point input[type=number]:eq(0)').val(area.geometry.coordinates[0]);
      this.$('.show-point input[type=number]:eq(1)').val(area.geometry.coordinates[1]);
      this.$('.show-point').show();
    } else if (area && area.geometry) {
      let name = 'Drawn Shape';
      if (area.properties) {
        const keys = ['name', 'NAME']; // TODO: more
        for (let i = 0; i < keys.length; ++i) {
          if (area.properties.hasOwnProperty(keys[i])) {
            name = area.properties[keys[i]];
            break;
          }
        }
      }
      this.$('.show-polygon input[type=text]').val(name);
      this.$('.show-polygon').show();
    }

    if (area) {
      this.$('#selection-wrapper').show();
    } else {
      this.$('#selection-wrapper').hide();
    }
  },

  onMapToolChanged(mapModel, tool) {
    this.$('.tool').removeClass('active');
    if (tool) {
      this.$(`.tool-${tool}`).addClass('active');
    }
  },

  onExtraParameterChanged(event) {
    const $target = $(event.target);

    if (event.value) {
      // in case of slider change. Check if the value is min/max
      const [low, high] = event.value;
      if ($target.data('slider-min') === low && $target.data('slider-max') === high) {
        this.filtersModel.unset($target.data('type'));
      } else {
        this.filtersModel.set($target.data('type'), { min: low, max: high });
      }
    } else {
      const value = $target.val();
      if (!value || value === '') {
        this.filtersModel.unset($target.data('type'));
      } else {
        this.filtersModel.set($target.data('type'), value);
      }
    }
  },
});
