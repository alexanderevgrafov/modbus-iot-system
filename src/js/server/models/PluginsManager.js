const _ = require('lodash');
const fs = require('fs');
const MODULES_PATH = '../modules/';

const list = ['pump', 'buttons', 'timer', 'distributor'];

class PluginsManager {
  application = null;
  plugins = {}

  constructor(state, app) {
    this.application = app;

    _.each(list, name => {
      const modulePath = __dirname + '/' + MODULES_PATH + name + '.js';

      if (fs.existsSync(modulePath)) {
        const {Class, title, defaultConfig} = require(modulePath);
        if (Class) {
          const plugin = {name, Class, title, isActive: false, config: defaultConfig};

          if (state.plugins && state.plugins[name]) {
            Object.assign( plugin, state.plugins[ name ] ); // ToDo: dangerous assigment, need to filter only actual attrs
          }

          this.plugins[name] = plugin;
        }
      } else {
        app.log('Plugin file "' + modulePath + '" not found');
      }
    });
  }

  initAll() {
    _.each(this.plugins, (plugin, name) => {
      this.initPlugin(plugin)
    })
  }

  initPlugin(plugin) {
    if (!plugin.instance) {
      plugin.instance = new plugin.Class();
    }

    if (!plugin.isActive) {
      return;
    }

    try {
      plugin.instance.init(plugin, this.application);
    } catch(e) {
      console.error('Plugin init fail', plugin.name, e.message || e);
    }
  }

  togglePlugin(name, activate) {
    const plug = this.getPlugin(name);

    if (activate && !plug.isActive) {
      plug.isActive = true;
      this.initPlugin(plug);
    } else if (!activate && plug.isActive) {
      plug.isActive = false;
      this.stopPlugin(plug);
    }

    this.application.saveSystemState();
  }

  stopPlugin(plugin) {
    plugin.instance.stop();
  }

  getPluginsList() {
    return _.mapValues(this.plugins, ({title, isActive}) => ({title, isActive}));
  }

  setPluginsList(list) {
    _.each(list, (state, name) => this.togglePlugin(name, state));
    this.application.emit('stateReload');
  }

  getPlugin(name) {
    return this.plugins[name];
  }

  getPluginConfig(name) {
    console.log('Check', this.plugins, name, this.plugins[name])

    return this.getPlugin(name).config;
  }

  setPluginConfig(name, config) {
    const plug = this.getPlugin(name);

    this.stopPlugin(plug)
    Object.assign(plug.config, config);
    this.initPlugin(plug);

    this.application.saveSystemState();
    this.application.emit('stateReload');
  }

  getPluginsJson() {
    const ret = {};

    _.each(this.plugins, (plug, name) => {
      ret[name] = _.pick(plug, ['isActive', 'config']);
    })

    return ret;
  }

  getFullLayout() {
    let layout = {};

    _.each(this.plugins, (plug, name) => {
      if (plug.isActive) {
        const lay = plug.instance.getLayout();
        const transformedLayout = _.mapKeys(lay, (val, key) => this.getLayoutControlId(name, key));

        _.merge(layout, transformedLayout);
      }
    })

    return layout;
  }

  setLayoutChange(json) {
    _.each(json, (change, path) => {
      const [plugName, controlPath] = path.split('#');
      const plug = this.getPlugin(plugName);

      plug && plug.instance && plug.instance.onLayoutChange && plug.instance.onLayoutChange(controlPath, change);
    });
  }

  emitLayoutChange(plugName, controlName, state) {
    const data = {
      id: this.getLayoutControlId(plugName, controlName),
      data: {state}
    };

    console.log('Emit layout change with', data);

    this.application.emit('lc', data);
  }

  getLayoutControlId(plugName, controlName) {
    return plugName + '#' + controlName;
  }
}

module.exports = PluginsManager
