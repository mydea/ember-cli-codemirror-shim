# Ember-cli-codemirror-shim

ES6 accessible module for importing `codemirror` from npm.

## Usage:

#### Install
```
# From the command line:
ember install ember-cli-codemirror-shim
```

#### Configure
Create a `codemirror` configuration object in your `ember-cli-build.js` file to specify what codemirror assets you would like to include in your project:
```javascript
var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  var app = new EmberAddon(defaults, {

    codemirror: {
      addons: ['mode/simple.js', 'mode/multiplex.js', 'comment/comment.js'],
      modes: ['xml', 'javascript', 'handlebars', 'htmlmixed', 'css'],
      themes: ['panda-syntax'],
      keymaps: ['sublime']
    }
  });

  return app.toTree();
};
```
**IMPORTANT:** The CodeMirror source repository keymaps, modes and theme files follow a consistent structure, so you only need to pass the name for each of these configs. The CodeMirror addons are organized differently and do not have a uniform file structure. Because of this you have to pass in the file path to the addon you would like to import relative to the CodeMirror addons directory: [CodeMirror Github Addons Dir](https://github.com/codemirror/CodeMirror/tree/master/addon).

Eg, to import the markdown fold addon, you would pass:
```javascript
codemirror: {
  addons: ['fold/markdown-fold.js']
}
```

_The [CodeMirror Manual](https://codemirror.net/doc/manual.html) has details on modes, themes, keymaps, etc._

#### Import
```javascript
// Some Awesome Component
import Ember from 'ember';
import CodeMirror from 'codemirror';

// Do amazing things!
```

## Thank You:

BIG THANK YOU TO:
* [ivy-codemirror](https://github.com/IvyApp/ivy-codemirror) for a codemirror reference.
* [ember-cli-moment-shim](https://github.com/jasonmit/ember-cli-moment-shim/blob/master/addon/index.js) for a reference to creating a shim for an npm package.

**This shim wouldn't be possible without the work they have done.**

### TODO

- [x] Configurable themes, keymaps && modes
- [] Fastboot compatability
- [x] Allow for importing from addons dir
