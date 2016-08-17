import Marionette from 'backbone.marionette';



//
// export default Marionette.LayoutView.extend({
//   template: () => `
//     <div id="header"></div>
//
//     <div id="content" style="width: 100%; height:100%; margin: 0; padding-top: 51px;"></div>
//
//
//     <div id="windows">
//       <div id="layers"></div>
//       <div id="tools"></div>
//       <div id="layerOptions"></div>
//       <div id="searchResults"></div>
//     </div>
//   `,
//   regions: {
//     header: '#header',
//
//     content: '#content',
//
//
//     layers: '#layers',
//     tools: '#tools',
//     map: '#map',
//     timeSlider: '#timeSlider',
//     layerOptions: '#layerOptions',
//     searchResults: '#searchResults',
//   },
// });

export default Marionette.LayoutView.extend({
  template: () => `
    <div id="content" style="width: 100%; height:100%; margin: 0;"></div>
    <div id="timeSlider" style="position: absolute; width: 90%; left: 5%; bottom: 30px"></div>
    <div id="leftPanel" style="margin: 0; left: 0; top: 0;position: absolute; height: 100%"></div>
    <div id="rightPanel" style="margin: 0; left: 0; top: 0; position: absolute; height: 100%"></div>
  `,
  regions: {
    content: '#content',
    leftPanel: '#leftPanel',
    rightPanel: '#rightPanel',
    timeSlider: '#timeSlider',
  },
});
