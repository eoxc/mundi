import Marionette from 'backbone.marionette';
import moment from 'moment';
import 'moment-timezone';
import 'eonasdan-bootstrap-datetimepicker';
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';

import template from './TimeFilterView.hbs';


const TimeFilterView = Marionette.ItemView.extend({
  template,
  templateHelpers() {
    return {
      maxMapInterval: this.maxMapInterval,
    };
  },
  className: 'panel panel-default',
  events: {
    'dp.change .datetime': 'onDateInputChange',
    'click .tool-show-time': 'onShowTimeClicked',
    'click .tool-clear-time': 'onClearTimeClicked',
  },

  initialize(options) {
    this.mapModel = options.mapModel;
    this.maxMapInterval = options.maxMapInterval;
    this.domain = options.domain;
    this.constrainTimeDomain = options.constrainTimeDomain;
    this.listenTo(this.mapModel, 'change:time', this.onMapTimeChanged);
    this.listenTo(this.mapModel, 'change:extendedTime', this.onMapExtendedTimeChanged);
    this.listenTo(this.mapModel,
    'exceed:maxMapInterval', this.onMapIntervalExceeded);
  },

  // Marionette event listeners

  onBeforeShow() {
    if (!this.maxMapInterval) {
      this.$('.time-buttons').hide();
    }
    const minDate = this.constrainTimeDomain ? this.domain.start : false;
    const maxDate = this.constrainTimeDomain ? this.domain.end : false;
    ['start', 'end'].forEach((label) => {
      const $elem = this.$(`input.${label}`);
      $elem.datetimepicker({
        locale: 'en',
        format: 'YYYY-MM-DD HH:mm:ss',
        dayViewHeaderFormat: 'YYYY-MM',
        useCurrent: false,
        showTodayButton: true,
        showClose: true,
        timeZone: 'UTC',
        widgetPositioning: {
          horizontal: 'right',
          vertical: 'auto',
        },
        keyBinds: {
          enter() {
            const value = $elem.find('input').val();
            this.date(value);
            this.viewDate(value);
            this.hide();
          },
          left: null,
          right: null,
          delete: null,
        },
        icons: {
          close: 'glyphicon glyphicon-ok'
        },
        minDate,
        maxDate,
      });
    });
  },

  onAttach() {
    this.onMapExtendedTimeChanged(this.mapModel);
    this.onMapTimeChanged();
  },

  // DOM event listeners

  onDateInputChange() {
    const start = this.$('.datetime.start').data('DateTimePicker').date();
    const end = this.$('.datetime.end').data('DateTimePicker').date();

    if (!this.updatingTime && start && end) {
      const startDate = start.toDate();
      const endDate = end.toDate();
      const time = (startDate < endDate) ? [startDate, endDate] : [endDate, startDate];
      this.mapModel.set('extendedTime', time);
      if (this.maxMapInterval) {
        this.mapModel.set('time', time);
        this.onShowTimeClicked();
      }
    }
  },

  onShowTimeClicked() {
    this.mapModel.showTime(this.mapModel.get('extendedTime'));
  },

  onClearTimeClicked() {
    this.mapModel.unset('extendedTime');
    this.onMapTimeChanged();
  },

  // model event listeners

  onMapTimeChanged() {
    const time = this.mapModel.get('time');

    // if a filter is set explicitly, do not update the text
    if (!this.maxMapInterval && this.mapModel.get('extendedTime')) {
      return;
    }

    this.updatingTime = true;
    this.$('.start').data('DateTimePicker').date(moment.utc(time[0]));
    this.$('.end').data('DateTimePicker').date(moment.utc(time[1]));
    this.$('.start').data('DateTimePicker').viewDate(moment.utc(time[0]));
    this.$('.end').data('DateTimePicker').viewDate(moment.utc(time[1]));
    this.updatingTime = false;
  },

  onMapExtendedTimeChanged(mapModel) {
    const time = mapModel.get('extendedTime') || this.mapModel.get('time');
    this.updatingTime = true;
    this.$('.start').data('DateTimePicker').date(moment.utc(time[0]));
    this.$('.end').data('DateTimePicker').date(moment.utc(time[1]));
    this.$('.start').data('DateTimePicker').viewDate(moment.utc(time[0]));
    this.$('.end').data('DateTimePicker').viewDate(moment.utc(time[1]));

    if (mapModel.get('extendedTime') || this.maxMapInterval) {
      this.$('.time-buttons').slideDown();
    } else {
      this.$('.time-buttons').slideUp();
    }
    this.updatingTime = false;
  },

  onMapIntervalExceeded(newInterval) {
    if (this.maxMapInterval && newInterval) {
      const formattedStart = moment.utc(newInterval[0]).format('YYYY-MM-DD HH:mm:ss');
      const formattedEnd = moment.utc(newInterval[1]).format('YYYY-MM-DD HH:mm:ss');
      this.$('#map-time-limit-exceeded').slideDown();
      this.$('#map-time-limit-exceeded').html(`Product map tiles display is limited to <br> <b>${formattedStart} - ${formattedEnd}</b>`);
    } else {
      this.$('#map-time-limit-exceeded').slideUp();
    }
  },
});

export default TimeFilterView;
