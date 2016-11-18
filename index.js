'use strict';

const path = require('path');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');

/*
 * BIG THANK YOU TO:
 * ivy-codemirror (https://github.com/IvyApp/ivy-codemirror)
 * ember-cli-moment-shim (https://github.com/jasonmit/ember-cli-moment-shim/blob/master/addon/index.js)
 *
 * Their repos were incredibly helpful figuring out how to cast all of these
 * spells. This file utilizes two of the Addon hooks:
 * - treeForVendor
 * - included
 *
 * `treeForVendor` Pulls the required files from the node_modules directory into
 * the consuming applications /vendor dir. The `included` hook then calls
 * `app.import` on behalf of the parent application to pull those files into
 * the consuming app.
 */
module.exports = {
  name: 'ember-cli-codemirror-shim',

  // Utility Methods
  // ---------------------------------------------------------------------------

  /**
   * Handle getting the codemirror configs from the consuming app and merging
   * in the codemirror npm module path
   * @return {Object} Application codemirror configurations
   */
  _getConfig: function() {
    let projectConfig = ((this.project.config(process.env.EMBER_ENV) || {}).codemirror || {});
    let codemirrorPath = path.dirname(require.resolve('codemirror')); // MAGIC!

    let config = Object.assign(projectConfig, {
      codemirrorPath: codemirrorPath
    });

    return config;
  },

  /**
   * Handle calling app imports for codemirror assets
   * @param {Object} app Parent application
   * @return {undefined}
   */
  _importBrowserDependencies: function(app) {
    if (arguments.length < 1) {
      throw new Error('Application instance must be passed to import');
    }

    const vendor = this.treePaths.vendor;
    const options = this.codemirrorOptions;
    const modes = options.modes || [];
    const keyMaps = options.keyMaps || [];
    const themes = options.themes || [];

    // Import Dependencies
    app.import(`${vendor}/codemirror/codemirror.js`);
    app.import(`${vendor}/codemirror/codemirror.css`);

    app.import(`${vendor}/codemirror/addon/mode/simple.js`);
    app.import(`${vendor}/codemirror/addon/mode/multiplex.js`);

    modes.forEach(function(mode) {
      app.import(`${vendor}/codemirror/mode/${mode}/${mode}.js`);
    });

    keyMaps.forEach(function(keyMap) {
      app.import(`${vendor}/codemirror/keymap/${keyMap}.js`);
    });

    themes.forEach(function(theme) {
      app.import(`${vendor}/codemirror/keymap/${theme}.css`);
    });

    // Super important magic
    app.import(`${vendor}/ember-cli-codemirror-shim/shim.js`, {
      exports: {
        codemirror: ['default']
      }
    });
  },

  // Addon Hooks
  // ---------------------------------------------------------------------------

  /**
   * Set correct references to consuming application by crawling tree. Call and
   * set codemirror configurations. Call to import dependecies.
   * @param {Object} app Parent app or addon
   * @return {Object} Parent application
   */
  included: function(app) {
    this._super.included.apply(this, arguments);

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    while (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    // Set resources on Addon instances
    this.app = app;
    this.codemirrorOptions = this._getConfig();

    // Import Dependencies
    this._importBrowserDependencies(app);

    return app;
  },

  /**
   * Addon treeFor[*] hook to merge codemirror into vendor tree. CLI will bundle
   * the asset into the build from there.
   * @param {Array} vendorTree Broccoli tree of vendor file probably
   * @return {Array} Whatever mergeTrees returns
   */
  treeForVendor: function(vendorTree) {
    const trees = [];
    const options = this.codemirrorOptions;
    let modes, keyMaps, themes;

    if (options.modes) { modes = options.modes.map(function(mode) { return `${mode}/${mode}.js`; }); }
    if (options.keyMaps) { keyMaps = options.keyMaps.map(function(keyMap) { return `${keyMap}.js`; }); }
    if (options.themes) { themes = options.themes.map(function(theme) { return `${theme}.css`; }); }

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(new Funnel(options.codemirrorPath, {
      destDir: 'codemirror',
      include: [new RegExp(/\.js$/), new RegExp(/\.css$/)]
    }));

    trees.push(new Funnel(path.join(options.codemirrorPath, '..', 'addon', 'mode'), {
      destDir: 'codemirror/addon/mode',
      include: ['simple.js', 'multiplex.js']
    }));

    if (modes) {
      trees.push(new Funnel(path.join(options.codemirrorPath, '..', 'mode'), {
        destDir: 'codemirror/mode',
        include: modes
      }));
    }

    if (keyMaps) {
      trees.push(new Funnel(path.join(options.codemirrorPath, '..', 'keymap'), {
        destDir: 'codemirror/keymap',
        include: keyMaps
      }));
    }

    if (themes) {
      trees.push(new Funnel(path.join(options.codemirrorPath, '..', 'theme'), {
        destDir: 'codemirror/theme',
        include: themes
      }));
    }

    return mergeTrees(trees);
  }
};
