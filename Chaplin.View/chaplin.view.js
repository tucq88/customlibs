// Chaplin.View.js 0.1.5
// ---------------

//     (c) 2014 Adam Krebs, Chaplin.js contributors
//     Chaplin.View may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://github.com/akre54/Chaplin.View

(function (factory) {
  if (typeof define === 'function' && define.amd) { define(['underscore', 'backbone'], factory);
  } else if (typeof exports === 'object') { factory(require('underscore'), require('backbone'));
  } else { factory(_, Backbone); }
}(function (_, Backbone) {
  Backbone.Chaplin = Backbone.Chaplin || {};

  // Chaplin's View class gives many powerful additions over a basic Backbone View,
  // including auto-rendering, auto-attachment, subviews, and memory managment.

  Backbone.Chaplin.View = Backbone.View.extend({

    // Automatic rendering
    // -------------------

    // Flag whether to render the view automatically on initialization.
    // As an alternative you might pass a `render` option to the constructor.
    autoRender: false,

    // Flag whether to attach the view automatically on render.
    autoAttach: true,

    // Automatic inserting into DOM
    // ----------------------------

    // View container element.
    // Set this property in a derived class to specify the container element.
    // Normally this is a selector string but it might also be an element or
    // jQuery object.
    // The view is automatically inserted into the container when it’s rendered.
    // As an alternative you might pass a `container` option to the constructor.
    container: null,

    // Method which is used for adding the view to the DOM
    // Like jQuery’s `html`, `prepend`, `append`, `after`, `before` etc.
    containerMethod: 'append',

    // Subviews
    // --------

    // List of subviews.
    subviews: null,
    subviewsByName: null,

    // Initialization
    // --------------

    // List of options that will be picked from constructor.
    // Easy to extend: `optionNames: View.prototype.optionNames.concat('template')`
    optionNames: [
      'autoAttach', 'autoRender',
      'container', 'containerMethod',
      'region', 'regions',
      'noWrap'
    ],

    constructor: function (options) {
      // Copy some options to instance properties.
      options && _.extend(this, _.pick(options, this.optionNames));

      // Wrap `render` so `attach` is called afterwards.
      // Enclose the original function.
      var render = this.render;

      // Create the wrapper method.
      this.render = function() {
        // Stop if the instance was already disposed.
        if (this.disposed) return false;

        // Call the original method.
        render.apply(this, arguments);

        // Attach to DOM.
        if (this.autoAttach) this.attach.apply(this, arguments);

        // Return the view.
        return this;
      }

      // Initialize subviews collections.
      this.subviews = [];
      this.subviewsByName = {};

      // Call Backbone’s constructor.
      Backbone.View.apply(this, arguments);

      // Listen for disposal of the model or collection.
      // If the model is disposed, automatically dispose the associated view.
      if (this.model) {
        this.listenTo(this.model, 'dispose', this.dispose);
      }
      if (this.collection) {
        this.listenTo(this.collection, 'dispose', function (subject) {
          if (!subject || subject === this.collection) this.dispose();
        });
      }

      // Render automatically if set by options or instance property.
      if (this.autoRender) this.render();

    },

    // Subviews
    // --------

    // Getting or adding a subview.
    subview: function (name, view) {
      // Initialize subviews collections if they don’t exist yet.
      var subviews = this.subviews;
      var byName = this.subviewsByName;

      if (name && view) {
        // Add the subview, ensure it’s unique.
        this.removeSubview(name);
        subviews.push(view);
        byName[name] = view;
        return view;
      } else if (name) {
        // Get and return the subview by the given name.
        return byName[name];
      }
    },

    // Removing a subview.
    removeSubview: function (nameOrView) {
      if (!nameOrView) return;

      var subviews = this.subviews, byName = this.subviewsByName, name, view;

      if (typeof nameOrView === 'string') {
        // Name given, search for a subview by name.
        name = nameOrView;
        view = byName[name];
      } else {
        // View instance given, search for the corresponding name.
        view = nameOrView;
        for (var otherName in byName) {
          var otherView = byName[otherName];
          if (!(otherView === view)) continue;
          name = otherName;
          break;
        }
      }

      // Break if no view and name were found.
      if (!(name && view && view.dispose)) return;

      // Dispose the view.
      view.dispose();

      // Remove the subview from the lists.
      var index = _.indexOf(subviews, view);
      if (index !== -1) subviews.splice(index, 1);
      delete byName[name];
    },

    // Rendering
    // ---------

    // Get the model/collection data for the templating function
    // Uses optimized Chaplin serialization if available.
    getTemplateData: function() {
      var data;

      if (this.model) {
        // utils.serialize(this.model);
        data = _.clone(this.model.attributes);
      } else if (this.collection) {
        data = {
          //items: utils.serialize(this.collection),
          items: this.collection.map(function(model) { return _.clone(model.attributes); }),
          length: this.collection.length
        };
      } else {
        data = {};
      }

      var source = this.model || this.collection;
      if (source) {
        // If the model/collection is a SyncMachine, add a `synced` flag,
        // but only if it’s not present yet.
        if (typeof source.isSynced === 'function' && !('synced' in data)) {
          data.synced = source.isSynced();
        }
      }

      return data;
    },

    // Returns the compiled template function.
    getTemplateFunction: function() {
      // Chaplin doesn’t define how you load and compile templates in order to
      // render views. The example application uses Handlebars and RequireJS
      // to load and compile templates on the client side. See the derived
      // View class in the
      // [example application](https://github.com/chaplinjs/facebook-example).
      //
      // If you precompile templates to JavaScript functions on the server,
      // you might just return a reference to that function.
      // Several precompilers create a global `JST` hash which stores the
      // template functions. You can get the function by the template name:
      // JST[@templateName]
      throw new Error('View#getTemplateFunction must be overridden');
    },

    // Main render function.
    // This method is bound to the instance in the constructor (see above)
    render: function() {
      // Do not render if the object was disposed
      // (render might be called as an event handler which wasn’t
      // removed correctly).
      if (this.disposed) return false;

      var templateFunc = this.getTemplateFunction();

      if (typeof templateFunc === 'function') {
        // Call the template function passing the template data.
        var html = templateFunc(this.getTemplateData());
        this.$el.html(html);
      }

      // Return the view.
      return this;
    },

    // This method is called after a specific `render` of a derived class.
    attach: function() {

      // Automatically append to DOM if the container element is set.
      if (this.container && !document.body.contains(this.el)) {
        var $container = $(this.container);
        if (typeof this.containerMethod == 'function') {
          this.containerMethod($container, this.el);
        } else {
          $container[this.containerMethod](this.el);
        }
        // Trigger an event.
        this.trigger('addedToDOM');
      }
    },

    // Disposal
    // --------

    disposed: false,

    dispose: function() {
      if (this.disposed) return;

      // Unregister all regions.
      this.unregisterAllRegions();

      // Dispose subviews.
      _.invoke(this.subviews, 'dispose');

      // Remove all event handlers on this module.
      this.off();

      // Remove the topmost element from DOM. This also removes all event
      // handlers from the element and all its children.
      this.remove();

      // Remove element references, options,
      // model/collection references and subview lists.
      var properties = [
        'el', '$el',
        'options', 'model', 'collection',
        'subviews', 'subviewsByName',
        '_callbacks'
      ];
      _.each(properties, function(prop) {
        delete this[prop];
      }, this);

      // Finished.
      this.disposed = true;

      // You’re frozen when your heart’s not open.
      if (typeof Object.freeze === 'function') Object.freeze(this);
    }
  });


  return Backbone.Chaplin.View;
}));
