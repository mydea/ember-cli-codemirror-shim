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
 * the consuming applications `/vendor` dir. The `included` hook then calls
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
   * @method _getConfig
   * @return {Object} Application codemirror configurations
   */
  _getConfig: function() {
    let codemirrorConfig = ((this.project.config(process.env.EMBER_ENV) || {}).codemirror || {});
    let codemirrorPath = path.dirname(require.resolve('codemirror')); // MAGIC!

    codemirrorConfig.codemirrorPath = codemirrorPath;

    return codemirrorConfig;
  },

  /**
   * Each theme/mode/etc needs to be imported into the consuming application
   * to be bundled into the vendor file. This method will call `app.import` for
   * each configured option.
   * @method _importBrowserDependencies
   * @param {Object} app Parent application
   * @return {undefined}
   */
  _importBrowserDependencies: function(app) {
    if (arguments.length < 1) {
      throw new Error('Application instance must be passed to import');
    }

    const vendor = this.treePaths.vendor;
    const options = app.options ? app.options.codemirror : {};
    const modes = options.modes || [];
    const keyMaps = options.keyMaps || [];
    const themes = options.themes || [];
    const addons = options.addons || [];

    // Import Dependencies
    // ---------------------------------------------------------------------------

    // CodeMirror Base Files
    app.import(`${vendor}/codemirror/codemirror.js`);
    app.import(`${vendor}/codemirror/codemirror.css`);

    // Configured addons
    addons.forEach(function(addon) {
      app.import(`${vendor}/codemirror/addon/${addon}`);
    });

    // Configured modes
    modes.forEach(function(mode) {
      app.import(`${vendor}/codemirror/mode/${mode}/${mode}.js`);
    });

    // Configured keymaps
    keyMaps.forEach(function(keyMap) {
      app.import(`${vendor}/codemirror/keymap/${keyMap}.js`);
    });

    // Configured themes
    themes.forEach(function(theme) {
      app.import(`${vendor}/codemirror/theme/${theme}.css`);
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
   *
   * Thanks to https://github.com/jasonmit/ember-cli-moment-shim for providing
   * a working example of shimming.
   * @method included
   * @param {Object} app Parent app or addon
   * @return {Object} Parent application
   */
  included: function(app) {
    this._super.included.apply(this, arguments);
    // this.ui.writeLine('Shimming codemirror');

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    while (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    // Set resources on addon instance
    this.app = app;
    this.codemirrorConfig = this._getConfig(app);
    this.codemirrorOptions = this.app.options ? this.app.options.codemirror : {};

    // Import Dependencies
    this._importBrowserDependencies(app);

    return app;
  },

  /**
   * Addon treeFor[*] hook to merge codemirror into vendor tree. CLI will bundle
   * the asset into the build from there.
   * @method treeForVendor
   * @param {Array} vendorTree Broccoli tree of vendor file probably
   * @return {Array} Whatever mergeTrees returns
   */
  treeForVendor: function(vendorTree) {
    const trees = [];
    const config = this.codemirrorConfig;
    const options = this.codemirrorOptions;
    let modes, keyMaps, themes;

    // Pull in existing vendor tree
    if (vendorTree) {
      trees.push(vendorTree);
    }

    // For each configuration, map it to match file type
    if (options.modes) { modes = options.modes.map(function(mode) { return `${mode}/${mode}.js`; }); }
    if (options.keyMaps) { keyMaps = options.keyMaps.map(function(keyMap) { return `${keyMap}.js`; }); }
    if (options.themes) { themes = options.themes.map(function(theme) { return `${theme}.css`; }); }

    // Don't map modes b/c the file structure is not standard, modes must be an array of filepaths

    // Pull in required base files
    // ---------------------------------------------------------------------------
    trees.push(new Funnel(config.codemirrorPath, {
      destDir: 'codemirror',
      include: [new RegExp(/\.js$/), new RegExp(/\.css$/)]
    }));

    // Pull in configured assets to vendor tree
    // ---------------------------------------------------------------------------
    if (options.addons) {
      trees.push(new Funnel(path.join(config.codemirrorPath, '..', 'addon'), {
        destDir: 'codemirror/addon',
        include: options.addons
      }));
    }

    if (modes) {
      trees.push(new Funnel(path.join(config.codemirrorPath, '..', 'mode'), {
        destDir: 'codemirror/mode',
        include: modes
      }));
    }

    if (keyMaps) {
      trees.push(new Funnel(path.join(config.codemirrorPath, '..', 'keymap'), {
        destDir: 'codemirror/keymap',
        include: keyMaps
      }));
    }

    if (themes) {
      trees.push(new Funnel(path.join(config.codemirrorPath, '..', 'theme'), {
        destDir: 'codemirror/theme',
        include: themes
      }));
    }

    return mergeTrees(trees);
  }
};
