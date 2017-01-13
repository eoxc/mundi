import Marionette from 'backbone.marionette';

require('./TimeSliderView.css');
require('./MapView.css');

export default Marionette.LayoutView.extend({
  template: () => `
    <div id="content" style="width: 100%; height:100%; margin: 0;"></div>
    <div id="timeSlider"></div>
    <div id="leftPanel" style="margin: 0; left: 0; top: 0;position: absolute; height: 100%"></div>
    <div id="rightPanel" style="margin: 0; right: 0; top: 0; position: absolute; height: 100%"></div>
    <div id="bottomPanel" style="position: absolute; left: 50%; bottom: 20px; display: none;"></div>
    <div id="topPanel" style="position: absolute; left: 50%; top: 20px; display: none;"></div>
    <div id="modals" style="margin: 0; left: 0; top: 0;position: absolute;"></div>
  `,
  regions: {
    content: '#content',
    leftPanel: '#leftPanel',
    rightPanel: '#rightPanel',
    bottomPanel: '#bottomPanel',
    topPanel: '#topPanel',
    timeSlider: '#timeSlider',
    modals: '#modals',
  },

  initialize(options) {
    this.listenTo(options.mapModel, 'change:tool', (model, tool) => {
      if (tool) {
        this.$('#timeSlider,#leftPanel,#rightPanel').fadeOut('fast');
        this.$('#bottomPanel').fadeIn('fast').css('display', 'flex');
      } else {
        this.$('#timeSlider,#leftPanel,#rightPanel').fadeIn('fast');
        this.$('#bottomPanel').fadeOut('fast');
      }
    });
    this.searchCollection = options.searchCollection;
    this.searchCollection.forEach((searchModel) => {
      this.listenTo(searchModel, 'change:isSearching', this.onIsSearchingChange);
    });
  },

  onIsSearchingChange() {
    const show = this.searchCollection
      .filter(searchModel => (
        !searchModel.get('isSearching') && !searchModel.get('hasError')
      ))
      .reduce((acc, searchModel) => (
        acc || searchModel.get('totalResults') > searchModel.get('hasLoaded')
      ), false);

    if (show) {
      this.$('#topPanel').fadeIn('fast').css('display', 'flex');
    } else {
      this.$('#topPanel').fadeOut('fast');
    }
  },
});
