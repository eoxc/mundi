import Marionette from 'backbone.marionette';


export default Marionette.LayoutView.extend({
  template: () => `
    <div id="header"></div>

    <div id="content" style="width: 100%; height:100%; margin: 0; padding-top: 51px;"></div>
    

    <div id="windows">
      <div id="layers"></div>
      <div id="tools"></div>
      <div id="layerOptions"></div>
      <div id="searchResults"></div>
    </div>
  `,
  regions: {
    header: '#header',

    content: '#content',


    layers: '#layers',
    tools: '#tools',
    map: '#map',
    timeSlider: '#timeSlider',
    layerOptions: '#layerOptions',
    searchResults: '#searchResults',
  },
});
