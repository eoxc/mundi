import $ from 'jquery';
import Marionette from 'backbone.marionette';

import template from './FeatureListView.hbs';
import FeatureListItemView from './FeatureListItemView';


const FeatureListView = Marionette.CompositeView.extend({
  className: 'dropdown',
  template,

  childView: FeatureListItemView,
  childViewContainer: '.dropdown-menu',

  childEvents: {
    'item:clicked': 'onItemClicked',
    'item:hover': 'onItemHover',
    'item:hover:end': 'onItemHoverEnd',
  },

  initialize(options) {
    this.mapModel = options.mapModel;
    this.highlightModel = options.highlightModel;
    this.listenTo(this.collection, 'reset', this.onCollectionReset);
  },

  onBeforeShow() {
    // and when you show it, move it to the body
    this.$el.on('show.bs.dropdown', (e) => {
      // grab the menu
      this.dropdownMenu = $(e.target).find('.dropdown-menu');

      // detach it and append it to the body
      $('body').append(this.dropdownMenu.detach());

      // grab the new offset position
      const eOffset = $(e.target).offset();

      // make sure to place it where it would normally go (this could be improved)
      this.dropdownMenu.css({
        display: 'block',
        top: eOffset.top + $(e.target).outerHeight(),
        left: eOffset.left,
      });
    });

    // and when you hide it, reattach the drop down, and hide it normally
    this.$el.on('hide.bs.dropdown', (e) => {
      $(e.target).append(this.dropdownMenu.detach());
      this.dropdownMenu.hide();
    });
  },

  onCollectionReset() {
    this.$('button').prop('disabled', this.collection.length === 0);
  },

  onItemClicked(childView) {
    this.mapModel.set('drawnArea', null);
    this.mapModel.set('area', childView.model.attributes);
    this.dropdownMenu.hide();
  },

  onItemHover(childView) {
    this.highlightModel.highlight(childView.model.attributes);
  },

  onItemHoverEnd(childView) {
    this.highlightModel.unHighlight(childView.model.attributes);
  },
});

export default FeatureListView;
