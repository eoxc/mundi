import Marionette from 'backbone.marionette';

import template from './FeatureListItemView.hbs';

const nameAttributes = ['NAME', 'name', 'ID', 'id'];

const FeatureListItemView = Marionette.ItemView.extend({
  tagName: 'li',
  template,
  templateHelpers() {
    let name;
    let hasName = false;
    const properties = this.model.get('properties');

    if (properties) {
      for (let i = 0; i < nameAttributes.length; ++i) {
        name = properties[nameAttributes[i]];
        if (name) {
          hasName = true;
          break;
        }
      }
    }

    return { hasName, name };
  },
  triggers: {
    'click a': 'item:clicked',
    mouseover: 'item:hover',
    mouseout: 'item:hover:end',
  },
});

export default FeatureListItemView;
