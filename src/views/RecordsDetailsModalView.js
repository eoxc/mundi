import ModalView from 'eoxc/src/core/views/ModalView';
import OpenLayersMapView from 'eoxc/src/contrib/OpenLayers/OpenLayersMapView';
import RecordDetailsView from 'eoxc/src/search/views/RecordDetailsView';

import FiltersModel from 'eoxc/src/core/models/FiltersModel';
import HighlightModel from 'eoxc/src/core/models/HighlightModel';
import MapModel from 'eoxc/src/core/models/MapModel';

import template from './RecordsDetailsModalView.hbs';

const RecordsDetailsModalView = ModalView.extend({
  template,
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
  },

  initialize(options) {
    this.records = options.records;
    this.currentRecordIndex = 0;

    this.baseLayersCollection = options.baseLayersCollection;
    this.overlayLayersCollection = options.overlayLayersCollection;
    this.layersCollection = options.layersCollection;
    this.highlightStrokeColor = options.highlightStrokeColor;
  },

  onModalShown() {
    this.updateRecord(this.records[this.currentRecordIndex]);
  },

  updateRecord(record) {
    const time = record.get('properties').time;
    const mapModel = new MapModel({ center: [0, 0], zoom: 5 });
    const highlightModel = new HighlightModel();
    const detailsView = new RecordDetailsView({
      model: record,
      mapModel,
      mapView: new OpenLayersMapView({
        mapModel,
        filtersModel: new FiltersModel({ time }),
        highlightModel,
        baseLayersCollection: this.baseLayersCollection,
        overlayLayersCollection: this.overlayLayersCollection,
        layersCollection: this.layersCollection,
        highlightFillColor: 'rgba(0, 0, 0, 0)',
        highlightStrokeColor: this.highlightStrokeColor,
      }),
    });
    this.showChildView('content', detailsView);

    mapModel.show(record.attributes);
    highlightModel.highlight(record.attributes);

    // this.$('.modal-title').text(`${layerModel.get('displayName')} - ${time[0].toISOString()}`);
    this.$('.modal-title').text(`- ${time[0].toISOString()}`);
    this.$('.records-prev').toggleClass('disabled', !(this.currentRecordIndex > 0));
    this.$('.records-next').toggleClass('disabled', !(this.currentRecordIndex < this.records.length - 1));
  },

  onRecordsPrevClicked() {
    if (this.currentRecordIndex > 0) {
      this.currentRecordIndex -= 1;
      const record = this.records[this.currentRecordIndex];
      this.updateRecord(record);
    }
  },

  onRecordsNextClicked() {
    if (this.currentRecordIndex < this.records.length - 1) {
      this.currentRecordIndex += 1;
      const record = this.records[this.currentRecordIndex];
      this.updateRecord(record);
    }
  },
});

export default RecordsDetailsModalView;
