import Marionette from 'backbone.marionette';


const FeatureListItemView = Marionette.ItemView.extend({
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

export default FeatureListItemView;
