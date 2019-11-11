import $ from 'jquery';
import ModalView from 'eoxc/src/core/views/ModalView';
import OpenLayersMapView from 'eoxc/src/contrib/OpenLayers/OpenLayersMapView';
import RecordDetailsView from 'eoxc/src/search/views/RecordDetailsView';

import FiltersModel from 'eoxc/src/core/models/FiltersModel';
import HighlightModel from 'eoxc/src/core/models/HighlightModel';
import MapModel from 'eoxc/src/core/models/MapModel';
import LayersCollection from 'eoxc/src/core/models/LayersCollection';
import { isRecordDownloadable } from 'eoxc/src/download';
import LayerOptionsCoreView from 'eoxc/src/core/views/layers/LayerOptionsCoreView';

import template from './RecordsDetailsModalView.hbs';
import './RecordsDetailsModalView.css';

const RecordsDetailsModalView = ModalView.extend({
  template,

  className: 'record-details-modal-view modal fade',

  templateHelpers() {
    return {
      title: '',
      hasNext: this.currentRecordIndex < this.records.length - 1,
      hasPrev: this.currentRecordIndex > 0,
      hasMore: this.records.length > 1,
    };
  },

  events: {
    'click .records-next': 'onRecordsNextClicked',
    'click .records-prev': 'onRecordsPrevClicked',
    'shown.bs.modal': 'onModalShown',
    'change .is-selected': 'onDownloadSelectionChange',
  },

  regions: {
    content: '.modal-body',
    'layer-options': '.layer-options',
  },

  initialize(options) {
    this.records = options.records;
    this.currentRecordIndex = 0;

    this.baseLayersCollection = options.baseLayersCollection;
    this.overlayLayersCollection = options.overlayLayersCollection;
    this.layersCollection = options.layersCollection;
    this.highlightFillColor = options.highlightFillColor;
    this.highlightStrokeColor = options.highlightStrokeColor;

    this.filterFillColor = options.filterFillColor;
    this.filterStrokeColor = options.filterStrokeColor;
    this.filterOutsideColor = options.filterOutsideColor;
    this.projection = options.projection;

    this.mapModel = new MapModel({ center: [0, 0], zoom: 5, noclick: true, projection: this.projection });
    this.highlightModel = new HighlightModel();
    this.filtersModel = new FiltersModel();

    this.$el.sizeChanged(() => {
      this.updateResultsPanelSize();
    });
  },

  onModalShown() {
    this.updateRecord(...this.records[this.currentRecordIndex]);
    this.updateResultsPanelSize();
  },

  updateResultsPanelSize() {
    // resize results holding div based on variable footer and header sizes
    const restHeightCombined = $('.modal-header').outerHeight(true) + $('.modal-footer').outerHeight(true);
    $('.modal-body').height(`calc(100% - ${restHeightCombined}px)`);
  },

  updateRecord(recordModel, searchModel) {
    let time = recordModel.get('properties').time;
    if (time instanceof Date) {
      time = [time, time];
    }
    const layerModel = searchModel.get('layerModel');
    const displayParams = layerModel.get('detailsDisplay') || layerModel.get('display');
    this.mapModel.set('time', time);
    this.mapView = new OpenLayersMapView({
      mapModel: this.mapModel,
      filtersModel: this.filtersModel,
      highlightModel: this.highlightModel,
      baseLayersCollection: this.baseLayersCollection,
      overlayLayersCollection: this.overlayLayersCollection,
      layersCollection: new LayersCollection([layerModel]),
      highlightFillColor: this.highlightFillColor,
      highlightStrokeColor: this.highlightStrokeColor,
      filterFillColor: this.filterFillColor,
      filterStrokeColor: this.filterStrokeColor,
      filterOutsideColor: this.filterOutsideColor,
      staticHighlight: true,
      useDetailsDisplay: true,
    });
    const detailsView = new RecordDetailsView({
      model: recordModel,
      mapModel: this.mapModel,
      mapView: this.mapView,
      descriptionTemplate: layerModel.get('search.descriptionTemplate'),
      headerText: 'Description of',
    });
    this.showChildView('content', detailsView);

    this.filtersModel.set('area', recordModel.attributes.geometry);

    this.mapModel.show(recordModel.attributes);
    this.highlightModel.highlight(recordModel.attributes);

    this.$('.modal-title').text(`${layerModel.get('displayName')} - ${time[0].toISOString()}`);
    this.$('.records-prev').toggleClass('disabled', !(this.currentRecordIndex > 0));
    this.$('.records-next').toggleClass('disabled', !(this.currentRecordIndex < this.records.length - 1));
    this.$('.current-record').text(this.currentRecordIndex + 1);
    this.$('.record-count').text(this.records.length);

    const downloadSelection = searchModel.get('downloadSelection');
    const isSelectedForDownload = downloadSelection.findIndex(model => (
      model.get('id') === recordModel.get('id')
    )) !== -1;
    this.$('.is-selected').prop('checked', isSelectedForDownload);
    this.$('.is-selected').parent().toggle(!!isRecordDownloadable(layerModel, recordModel));

    this.$('.layer-options-dropdown').toggle(!!displayParams.options);
    this.showChildView('layer-options', new LayerOptionsCoreView({
      model: layerModel, useDetailsDisplay: true
    }));
  },

  onRecordsPrevClicked() {
    if (this.currentRecordIndex > 0) {
      this.currentRecordIndex -= 1;
      this.updateRecord(...this.records[this.currentRecordIndex]);
    }
  },

  onRecordsNextClicked() {
    if (this.currentRecordIndex < this.records.length - 1) {
      this.currentRecordIndex += 1;
      this.updateRecord(...this.records[this.currentRecordIndex]);
    }
  },

  onDownloadSelectionChange() {
    const [recordModel, searchModel] = this.records[this.currentRecordIndex];
    const downloadSelection = searchModel.get('downloadSelection');
    if (this.$('.is-selected').is(':checked')) {
      downloadSelection.add(recordModel);
    } else {
      downloadSelection.remove(recordModel);
    }
  },
});

export default RecordsDetailsModalView;
