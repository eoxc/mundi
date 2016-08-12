import Backbone from 'backbone';
import Marionette from 'backbone.marionette';


export default Marionette.LayoutView.extend({
  template: () => `
    <div class="navbar navbar-default navbar-inverse navbar-fixed-top" role="navigation">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand">EOxC - Example Application</a>
        </div>

        <div class="navbar-collapse collapse navbar-right">
          <ul class="nav navbar-nav">
            <li class="divider-vertical"></li>
            <li>
              <a href="#" class="map" data-route="map"><i class="fa fa-globe"></i> Map</a>
            </li>
            <li>
              <a href="#" class="search" data-route="search"><i class="fa fa-wrench"></i> Search</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  events: {
    'click a': 'onRouteClick',
    // 'click .layers': 'onLayersClick',
    // 'click .tools': 'onToolsClick',
  },

  initialize(options) {
    this.router = options.router;

    this.router.on('route', () => {
      const fragment = Backbone.history.getFragment();
      this.$('[data-route]').parent().removeClass('active');
      this.$(`[data-route='${fragment}']`).parent().addClass('active');
    });
  },

  onRouteClick(event) {
    event.preventDefault();
    this.router.navigate(event.currentTarget.dataset.route, { trigger: true });
  },
});
