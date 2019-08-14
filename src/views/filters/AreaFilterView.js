import $ from 'jquery';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import i18next from 'i18next';

import template from './AreaFilterView.hbs';
import './AreaFilterView.css';
import FeatureListView from './FeatureListView';
import { parseFeaturesFromFiles } from '../../utils';

const AreaFilterView = Marionette.LayoutView.extend({
  template,
  templateHelpers() {
    return {
      uploadEnabled: this.uploadEnabled,
      collapsed: this.collapsed,
    };
  },
  className: 'panel panel-default',
  events: {
    'change .show-point input': 'onPointInputChange',
    'change .show-bbox input': 'onBBoxInputChange',
    'click .tool-point': 'onToolPointClicked',
    'click .tool-bbox': 'onToolBBoxClicked',
    'click .tool-polygon': 'onToolPolygonClicked',
    'click .tool-clear': 'onToolClearClicked',
    'click .tool-show-feature': 'onToolShowFeatureClicked',
    'change :file': 'onFileChanged',
  },

  initialize(options) {
    this.mapModel = options.mapModel;
    this.highlightModel = options.highlightModel;
    this.uploadEnabled = options.uploadEnabled;
    this.featureListCollection = new Backbone.Collection();

    this.listenTo(this.mapModel, 'change:area', this.onMapAreaChanged);
    this.listenTo(this.mapModel, 'change:tool', this.onMapToolChanged);
    this.listenTo(this.mapModel, 'change:bbox', this.onMapBBOXChanged);

    // set according to configured filter
    if (options.settings) {
      this.collapsed = options.settings.collapsed;
      this.settings = options.settings.settings;
    } else {
      this.collapsed = false;
      this.settings = null;
    }
  },

  // Marionette event listeners

  onBeforeShow() {
    if (this.uploadEnabled) {
      this.addRegion('featureList', '.feature-list');
      this.showChildView('featureList', new FeatureListView({
        mapModel: this.mapModel,
        highlightModel: this.highlightModel,
        collection: this.featureListCollection,
      }));

      $(this.el).find('[data-toggle="tooltip"]').tooltip();
    }

    if (this.settings && this.settings.type && this.settings.coordinates) {
      // delegate feature creation to eoxc because of OL dependency
      this.mapModel.trigger('manual:filterFromConfig', this.settings.type, this.settings.coordinates);
    }
  },

  // DOM event listeners

  onPointInputChange() {
    const coordinates = this.$('.show-point input[type=number]')
      .map((index, elem) => $(elem).val())
      .get()
      .map(parseFloat);

    if (coordinates.reduce((prev, current) => prev && !isNaN(current), true)) {
      this.mapModel.set('drawnArea', null);
      this.mapModel.set('area', {
        geometry: { type: 'Point', coordinates },
        type: 'Feature',
      });
    }
  },

  onBBoxInputChange() {
    const bbox = this.$('.show-bbox input[type=number]')
      .map((index, elem) => $(elem).val())
      .get()
      .map(parseFloat);

    if (bbox.reduce((prev, current) => prev && !isNaN(current), true)) {
      this.mapModel.set('drawnArea', null);
      this.mapModel.set('area', bbox);
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
    this.mapModel.set('drawnArea', null);
    this.mapModel.set('area', null);
  },

  onToolShowFeatureClicked(event) {
    event.preventDefault();
    const area = this.mapModel.get('drawnArea') || this.mapModel.get('area');
    this.mapModel.show(area);
  },

  onFileChanged(event) {
    const currentTarget = event.currentTarget;
    const $input = $(event.target).parents('.input-group').find(':text');
    if (currentTarget.files && currentTarget.files.length) {
      const files = Array.from(currentTarget.files);
      const names = files.map(file => file.name).join(', ');

      $input.val(names);

      parseFeaturesFromFiles(files)
        .then((features) => {
          this.featureListCollection.reset(features);
          this.$('.select-feature').prop('disabled', false);
          this.$('.panel-features').fadeIn('fast');
        })
        .catch((error) => {
          $input.val('');
          currentTarget.value = '';
          this.featureListCollection.reset([]);
          throw error;
        });
    } else {
      $input.val('');
      this.featureListCollection.reset([]);
    }
  },

  // model event listeners

  onMapAreaChanged(mapModel) {
    const area = mapModel.get('area');

    if (Array.isArray(area) && area.length === 4) {
      const [minx, miny, maxx, maxy] = area;
      this.$('.show-bbox input[type=number]:eq(0)').val(minx);
      this.$('.show-bbox input[type=number]:eq(1)')
        .attr('max', maxy)
        .val(miny);
      this.$('.show-bbox input[type=number]:eq(2)').val(maxx);
      this.$('.show-bbox input[type=number]:eq(3)')
        .attr('min', miny)
        .val(maxy);
      this.$('.show-bbox:hidden').slideDown();
      this.$('.show-geometry').not('.show-bbox').slideUp();
    } else if (area && area.geometry && area.geometry.type === 'Point') {
      this.$('.show-point input[type=number]:eq(0)').val(area.geometry.coordinates[0]);
      this.$('.show-point input[type=number]:eq(1)').val(area.geometry.coordinates[1]);
      this.$('.show-point:hidden').slideDown();
      this.$('.show-geometry').not('.show-point').slideUp();
    } else if (area && area.geometry) {
      let name = i18next.t('Drawn Shape');
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
      this.$('.show-polygon:hidden').slideDown();
      this.$('.show-geometry').not('.show-polygon').slideUp();
    }

    if (area) {
      this.$('#selection-wrapper').show();
      this.$('#map-bbox-wrapper').slideUp();
    } else {
      this.$('#selection-wrapper').slideUp();
      this.$('#map-bbox-wrapper').slideDown();
    }
  },

  onMapToolChanged(mapModel, tool) {
    this.$('.tool').removeClass('active');
    if (tool) {
      this.$(`.tool-${tool}`).addClass('active');
    }
  },

  onMapBBOXChanged() {
    const bbox = this.mapModel.get('bbox');
    this.$('#map-bbox-wrapper input:eq(0)').val(bbox[0].toFixed(2));
    this.$('#map-bbox-wrapper input:eq(1)').val(bbox[1].toFixed(2));
    this.$('#map-bbox-wrapper input:eq(2)').val(bbox[2].toFixed(2));
    this.$('#map-bbox-wrapper input:eq(3)').val(bbox[3].toFixed(2));
  },
});

export default AreaFilterView;
