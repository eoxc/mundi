import $ from 'jquery';
import Marionette from 'backbone.marionette';
import ModalView from 'eoxc/src/core/views/ModalView';
import { downloadCustom, getDownloadInfos } from 'eoxc/src/download/';
import metalinkTemplate from 'eoxc/src/download/Metalink.hbs';

import template from './SelectFilesModalView.hbs';
import './SelectFilesModalView.css';


const FileStructureView = Marionette.ItemView.extend({
  template: ({ infos }) => `${infos.map(({ displayName, id, recordsAndFileInfos }) => `
    <h2>${displayName}</h2>
    <ul class="list-unstyled">
      ${recordsAndFileInfos.map(({ recordId, timestamp, fileInfos }) => `
        <li class="record-list-item checkbox">
          <label>
            <input type="checkbox" checked="true" class="record-checkbox">
            <a href="#select-files-${id}-${recordId}" class="collapsed" data-toggle="collapse"><b>${timestamp}: ${recordId}</b><span class="caret"></span></a>
          </label>
          <ul class="collapse" id="select-files-${id}-${recordId}">
            ${fileInfos.map(({ name, href }) => `
              <li class="checkbox">
                <label>
                  <input type="checkbox" class="record-file-checkbox" checked="checked" data-name="${name}" data-href="${href}">${name}
                </label>
                <a href="${href}" target="_blank"> <i class="fa fa-external-link"></i></a>
              </li>
            `).join('')}
          </ul>
        </li>
      `).join('')}
    </ul>`)}`,
  templateHelpers() {
    return {
      infos: this.infoStructure
        .filter(({ recordsAndFileInfos }) => recordsAndFileInfos.length > 0)
        .map(({ searchModel, recordsAndFileInfos }) => ({
          displayName: searchModel.get('layerModel').get('displayName'),
          recordsAndFileInfos: recordsAndFileInfos
            .filter(({ fileInfos }) => fileInfos.length > 0)
            .map(({ recordModel, fileInfos }) => ({
              recordId: recordModel.get('id'),
              timestamp: Array.isArray(recordModel.get('properties').time)
                ? recordModel.get('properties').time[0].toISOString()
                : recordModel.get('properties').time.toISOString(),
              fileInfos,
            })),
        }))
    };
  },

  events: {
    'change .record-checkbox': 'onRecordCheckboxChange',
    'change .record-file-checkbox': 'onRecordFileCheckboxChange',
  },

  initialize(options) {
    this.infoStructure = options.infoStructure;
  },

  onRecordCheckboxChange(event) {
    const $target = $(event.target);
    $target.closest('.record-list-item')
      .find('.record-file-checkbox')
      .prop('checked', $target.is(':checked'))
      .trigger('change');
  },

  onRecordFileCheckboxChange(event) {
    const $target = $(event.target);
    const $li = $target.closest('.record-list-item');
    const all = $li.find('.record-file-checkbox').length;
    const checked = $li.find('.record-file-checkbox:checked').length;

    $li.find('.record-checkbox').prop('checked', all === checked);
  },
});


const SelectFilesModalView = ModalView.extend({
  template,
  templateHelpers() { },
  events: {
    'click .start-download': 'onStartDownloadClicked',
    'click .download-as-metalink': 'onDownloadAsMetalinkClicked',
    'click .download-as-url-list': 'onDownloadAsUrlListClicked',
    'change .record-file-checkbox': 'checkButtons',
  },

  regions: {
    content: '.modal-body'
  },

  initialize(options) {
    this.searchCollection = options.searchCollection;
    this.onStartDownload = options.onStartDownload;
    this.$el.sizeChanged(() => {
      this.updateResultsPanelSize();
    });
  },

  onRender() {
    this._getDownloadInfoStructure({})
      .then((infoStructure) => {
        this.showChildView('content', new FileStructureView({ infoStructure }));
        this.$('.spinner').fadeOut();
        this.checkButtons();
      });
  },

  onModalShown() {
  },

  onStartDownloadClicked() {
    // NOT easy... :(
    // this.close();
    // const items = this._getSelectedDownloadInfos();
    // this.onStartDownload(items);
  },

  onDownloadAsMetalinkClicked() {
    this.close();
    const items = this._getSelectedDownloadInfos();
    let content = metalinkTemplate({
      date: (new Date()).toISOString(),
      items,
    });
    content = content.replace(/[\n]/g, '\r\n');
    downloadCustom('download-files.meta4', 'application/metalink4+xml', content);
  },

  onDownloadAsUrlListClicked() {
    this.close();
    const infos = this._getSelectedDownloadInfos();
    downloadCustom('url-list.txt', 'text/plain',
      infos.map(info => info.href).join('\r\n')
    );
  },

  checkButtons() {
    this.$('.start-download,.dropdown-toggle,.download-as-metalink,.download-as-url-list')
      .prop('disabled', this.$('.record-file-checkbox:checked').length === 0);
  },

  _getDownloadInfoStructure(options) {
    return Promise.all(this.collection
      .map(searchModel => (
        Promise.all(
          searchModel.get('downloadSelection').map(recordModel => (
            getDownloadInfos(
              searchModel.get('layerModel'), this.filtersModel, recordModel, options
            ).then(fileInfos => ({
              recordModel,
              fileInfos,
            }))
          ))
        ).then(recordsAndFileInfos => ({
          searchModel,
          recordsAndFileInfos,
        }))
      )));
  },

  updateResultsPanelSize() {
    // resize results holding div based on variable footer and header sizes
    const restHeightCombined = $('.modal-header').outerHeight(true) + $('.modal-footer').outerHeight(true);
    $('.modal-body').height(`calc(100% - ${restHeightCombined}px)`);
  },

  _getSelectedDownloadInfos() {
    return this.$('[type="checkbox"]:checked').toArray().map(elem => ({
      name: elem.dataset.name,
      href: elem.dataset.href,
    }));
  }
});

export default SelectFilesModalView;
