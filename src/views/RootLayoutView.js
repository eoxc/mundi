import Marionette from 'backbone.marionette';

export default Marionette.LayoutView.extend({
  template: () => `
    <div id="content" style="width: 100%; height:100%; margin: 0;"></div>
    <div id="timeSlider" style="position: absolute; width: 90%; left: 20px; bottom: 39px"></div>
    <div id="leftPanel" style="margin: 0; left: 0; top: 0;position: absolute; height: 100%"></div>
    <div id="rightPanel" style="margin: 0; right: 0; top: 0; position: absolute; height: 100%"></div>
    <div id="bottomPanel" style="position: absolute; left: 0; bottom: 0; width: 100%; display: none; justify-content: center;"></div>
    <div id="modals" style="margin: 0; left: 0; top: 0;position: absolute;"></div>
  `,
  regions: {
    content: '#content',
    leftPanel: '#leftPanel',
    rightPanel: '#rightPanel',
    bottomPanel: '#bottomPanel',
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
  },
});
