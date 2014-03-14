// Chaplin.View.js 0.1.5
// ---------------

//     (c) 2014 Adam Krebs, Chaplin.js contributors
//     Chaplin.View may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://github.com/akre54/Chaplin.View

(function (factory) {
  if (typeof define === 'function' && define.amd) { define(['underscore', 'chaplin.view'], factory);
  } else if (typeof exports === 'object') { factory(require('underscore'), require('./chaplin.view'));
  } else { factory(_, Backbone.Chaplin.View); }
}(function (_, ChaplinView) {

  // Chaplin's CollectionView class allows for easy display of all items in a
  // Collection-backed View. It handles automatic insertion and removal.

  // Derive this class and override the `itemView` property.

  Backbone.Chaplin.CollectionView = ChaplinView.extend({

  // Configuration options
  // =====================

  // These options may be overwritten in derived classes.

  // A class of item in collection.
  // This property has to be overridden by a derived class.
  itemView: null,

  // Automatic rendering
  // -------------------

  // Per default, render the view itself and all items on creation.
  autoRender: true,
  renderItems: true,

  // Animation
  // ---------

  // When new items are added, their views are faded in.
  // Animation duration in milliseconds (set to 0 to disable fade in)
  animationDuration: 500,

  // By default, fading in is done by javascript function which can be
  // slow on mobile devices. CSS animations are faster,
  // but require user’s manual definitions.
  useCssAnimation: false,

  // CSS classes that will be used when hiding / showing child views.
  animationStartClass: 'animated-item-view',
  animationEndClass: 'animated-item-view-end',

  // Selectors and elements
  // ----------------------

  // A collection view may have a template and use one of its child elements
  // as the container of the item views. If you specify `listSelector`, the
  // item views will be appended to this element. If empty, $el is used.
  listSelector: null,

  // The actual element which is fetched using `listSelector`
  $list: null,

  // Selector for a fallback element which is shown if the collection is empty.
  fallbackSelector: null,

  // The actual element which is fetched using `fallbackSelector`
  $fallback: null,

  // Selector for a loading indicator element which is shown
  // while the collection is syncing.
  loadingSelector: null,

  // The actual element which is fetched using `loadingSelector`
  $loading: null,

  // Selector which identifies child elements belonging to collection
  // If empty, all children of $list are considered.
  itemSelector: null,

  // Filtering
  // ---------

  // The filter function, if any.
  filterer: null,

  // A function that will be executed after each filter.
  // Hides excluded items by default.
  filterCallback: function (view, included) {
    view.$el.stop(true, true);
    view.$el.toggle(included);
  },

  // View lists
  // ----------

  // Track a list of the visible views.
  visibleItems: null,

  // Constructor
  // -----------

  optionNames: ChaplinView.prototype.optionNames.concat(['renderItems', 'itemView']),

  constructor: function (options) {
    // Initialize list for visible items.
    this.visibleItems = [];

    ChaplinView.apply(this, arguments);
  },

  // Initialization
  // --------------

  initialize: function (options) {
    // Don't call super; the base view's initialize is a no-op.

    options || (options = {});

    // Start observing the collection.
    this.addCollectionListeners();

    // Apply a filter if one provided.
    if (options.filterer) this.filter(options.filterer);
  },

  // Binding of collection listeners.
  addCollectionListeners: function() {
    this.listenTo(this.collection, 'add', this.itemAdded);
    this.listenTo(this.collection, 'remove', this.itemRemoved);
    this.listenTo(this.collection, 'reset sort', this.itemsReset);
  },

  // Rendering
  // ---------

  // Override View#getTemplateData, don’t serialize collection items here.
  getTemplateData: function() {
    var data = { length: this.collection.length };

    // If the collection is a SyncMachine, add a `synced` flag.
    if (typeof this.collection.isSynced === 'function') {
      data.synced = this.collection.isSynced();
    }

    return data;
  },

  // In contrast to normal views, a template is not mandatory
  // for CollectionViews. Provide an empty `getTemplateFunction`.
  getTemplateFunction: function() { },

  // Main render method (should be called only once)
  render: function() {
    ChaplinView.prototype.render.apply(this, arguments);

    // Set the $list property with the actual list container.
    var listSelector = _.result(this, 'listSelector');
    this.$list = listSelector ? this.$(listSelector) : this.$el;

    this.initFallback();
    this.initLoadingIndicator();

    // Render all items.
    if (this.renderItems) this.renderAllItems();
  },

  // Adding / Removing
  // -----------------

  // When an item is added, create a new view and insert it.
  itemAdded: function (item, collection, options) {
    this.insertView(item, this.renderItem(item), options.at);
  },

  // When an item is removed, remove the corresponding view from DOM and caches.
  itemRemoved: function (item) {
    this.removeViewForItem(item);
  },

  // When all items are resetted, render all anew.
  itemsReset: function() {
    this.renderAllItems()
  },

  // Fallback message when the collection is empty
  // ---------------------------------------------

  initFallback: function() {
    if (!this.fallbackSelector) return;

    // Set the $fallback property.
    this.$fallback = this.$(this.fallbackSelector);

    // Listen for visible items changes.
    this.on('visibilityChange', this.toggleFallback);

    // Listen for sync events on the collection.
    this.listenTo(this.collection, 'syncStateChange', this.toggleFallback);

    // Set visibility initially.
    this.toggleFallback();
  },

  // Show fallback if no item is visible and the collection is synced.
  toggleFallback: function() {
    // if the Collection is a SyncMachine, check that it's synced, otherwise assume true
    var visible = this.visibleItems.length === 0 &&
      (typeof this.collection.isSynced === 'function' ? this.collection.isSynced() : true);
    this.$fallback.toggle(visible);
  },

  // Loading indicator
  // -----------------

  initLoadingIndicator: function() {
    // The loading indicator only works for Collections
    // which are SyncMachines.
    if (!(this.loadingSelector && typeof this.collection.isSyncing === 'function')) return;

    // Set the $loading property.
    this.$loading = this.$(this.loadingSelector);

    // Listen for sync events on the collection.
    this.listenTo(this.collection, 'syncStateChange', this.toggleLoadingIndicator);

    // Set visibility initially.
    this.toggleLoadingIndicator();
  },

  toggleLoadingIndicator: function() {
    // Only show the loading indicator if the collection is empty.
    // Otherwise loading more items in order to append them would
    // show the loading indicator. If you want the indicator to
    // show up in this case, you need to overwrite this method to
    // disable the check.
    var visible = this.collection.length === 0 && this.collection.isSyncing();
    $loading.toggle(visible);
  },

  // Filtering
  // ---------

  // Filters only child item views from all current subviews.
  getItemViews: function() {
    var itemViews = {};
    if (this.subviews.length > 0) {
      for(var name in this.subviewsByName) {
        var view = this.subviewsByName[name];
        if (name.slice(0, 9) === 'itemView:') itemViews[name.slice(9)] = view;
      }
    }
    return itemViews;
  },

  // Applies a filter to the collection view.
  // Expects an iterator function as first parameter
  // which needs to return true or false.
  // Optional filter callback which is called to
  // show/hide the view or mark it otherwise as filtered.
  filter: function (filterer, filterCallback) {
    // Save the filterer and filterCallback functions.
    if (typeof filterer === 'function' || filterer === null) {
      this.filterer = filterer;
    }

    if (typeof filterCallback === 'function' || filterCallback === null) {
      this.filterCallback = filterCallback;
    }

    var hasItemViews = _.any(this.subviewsByName, function(subview, name) {
      return name.slice(0, 9) === 'itemView:';
    });

    // Show/hide existing views.
    if (hasItemViews) {
      _.each(this.collection.models, function(item, index) {

        // Apply filter to the item.
        var included = typeof this.filterer === 'function' ?
          this.filterer(item, index) : true;

        // Show/hide the view accordingly.
        var view = this.subview("itemView:" + item.cid);

        // A view has not been created for this item yet.
        if (!view) throw new Error('CollectionView#filter: ' +
            "no view found for " + item.cid);

        // Show/hide or mark the view accordingly.
        this.filterCallback(view, included);

        // Update visibleItems list, but do not trigger an event immediately.
        this.updateVisibleItems(view.model, included, false);
      }, this);
    }

    // Trigger a combined `visibilityChange` event.
    this.trigger('visibilityChange', this.visibleItems);
  },

  // Item view rendering
  // -------------------

  // Render and insert all items.
  renderAllItems: function() {
    // Reset visible items.
    this.visibleItems = [];

    // Collect remaining views.
    var remainingViewsByCid = {};
    this.collection.each(function(item) {
      var view = this.subview("itemView:" + item.cid);
      if (view) remainingViewsByCid[item.cid] = view;
    }, this);

    // Remove old views of items not longer in the list.
    var itemViews = this.getItemViews();
    _.each(itemViews, function(view, cid) {
      if (!_.has(itemViews, cid)) return;
      if (!(cid in remainingViewsByCid)) this.removeSubview("itemView:" + cid);
    }, this);

    // Re-insert remaining items; render and insert new items.
    this.collection.each(function(item, index) {
      var view = this.subview("itemView:" + item.cid);

      if (view) {
        // Re-insert the view.
        this.insertView(item, view, index, false);
      } else {
        // Create a new view, render and insert it.
        this.insertView(item, this.renderItem(item), index)
      }
    }, this);

    // If no view was created, trigger `visibilityChange` event manually.
    if (this.collection.length === 0) this.trigger('visibilityChange', this.visibleItems);
  },

  // Instantiate and render an item using the `viewsByCid` hash as a cache.
  renderItem: function (item) {
    // Get the existing view.
    var view = this.subview("itemView:" + item.cid);

    // Instantiate a new view if necessary.
    if (!view) {
      view = this.initItemView(item);
      // Save the view in the subviews.
      this.subview("itemView:" + item.cid, view);
    }

    // Render in any case.
    view.render();

    return view;
  },

  // Returns an instance of the view class. Override this
  // method to use several item view constructors depending
  // on the model type or data.
  initItemView: function (model) {
    if (this.itemView) {
      return new this.itemView({autoRender: false, model: model});
    } else {
      throw new Error('The CollectionView#itemView property ' +
        'must be defined or the initItemView() must be overridden.');
    }
  },

  // Inserts a view into the list at the proper position.
  insertView: function (item, view, position, enableAnimation) {
    enableAnimation || (enableAnimation = true);
    if (this.animationDuration === 0) enableAnimation = false;

    // Get the insertion offset if not given.
    if (typeof position !== 'number') position = this.collection.indexOf(item);

    // Is the item included in the filter?
    var included = typeof this.filterer === 'function' ?
      this.filterer(item, position) : true;

    // Start animation.
    if (included && enableAnimation) {
      if (this.useCssAnimation) {
        view.$el.addClass(this.animationStartClass);
      } else {
        view.$el.css('opacity', 0);
      }
    }

    // Hide or mark the view if it’s filtered.
    if (this.filterer) this.filterCallback(view, included);

    var length = this.collection.length;

    // Insert the view into the list.
    var insertInMiddle = (0 < position && position < length);
    var isEnd = function (length) { return length === 0 || position === length; };
    var elem = view.$el;

    if (insertInMiddle || this.itemSelector) {
      // Get the children which originate from item views.
      var children = this.$list.children(this.itemSelector);
      var childrenLength = children.length;

      // Check if it needs to be inserted.
      if (children[position] !== elem) {
        if (isEnd(childrenLength)) {
          // Insert at the end.
          this.$list.append(elem);
        } else {
          // Insert at the right position.
          if (position === 0)  {
            children.eq(position).before(elem);
          } else {
            children.eq(position - 1).after(elem);
          }
        }
      }
    } else {
      var method = isEnd(length) ? 'append' : 'prepend';
      this.$list[method](elem);
    }

    // Tell the view that it was added to its parent.
    view.trigger('addedToParent');

    // Update the list of visible items, trigger a `visibilityChange` event.
    this.updateVisibleItems(item, included);

    // End animation.
    if (included && enableAnimation) {
      if (this.useCssAnimation) {
        // Wait for DOM state change.
        setTimeout(_.bind(function() {
          elem.addClass(this.animationEndClass);
        }, this), 0);
      } else {
        // Fade the view in if it was made transparent before.
        elem.animate({opacity: 1}, this.animationDuration);
      }
    }

    return view;
  },

  // Remove the view for an item.
  removeViewForItem: function (item) {
    // Remove item from visibleItems list, trigger a `visibilityChange` event.
    this.updateVisibleItems(item, false);
    this.removeSubview("itemView:" + item.cid);
  },

  // List of visible items
  // ---------------------

  // Update visibleItems list and trigger a `visibilityChanged` event
  // if an item changed its visibility.
  updateVisibleItems: function (item, includedInFilter, triggerEvent) {
    triggerEvent || (triggerEvent = true);
    var visibilityChanged = false;

    var visibleItemsIndex = _.indexOf(this.visibleItems, item);
    var includedInVisibleItems = visibleItemsIndex !== -1;

    if (includedInFilter && !includedInVisibleItems) {
      // Add item to the visible items list.
      this.visibleItems.push(item);
      visibilityChanged = true;
    } else if (!includedInFilter && includedInVisibleItems) {
      // Remove item from the visible items list.
      this.visibleItems.splice(visibleItemsIndex, 1);
      visibilityChanged = true;
    }

    // Trigger a `visibilityChange` event if the visible items changed.
    if (visibilityChanged && triggerEvent) {
      this.trigger('visibilityChange', this.visibleItems);
    }

    return visibilityChanged;
  },

  // Disposal
  // --------

  dispose: function() {
    if (this.disposed) return;

    // Remove jQuery objects, item view cache and visible items list.
    var properties = ['$list', '$fallback', '$loading', 'visibleItems'];
    _.each(properties, function(prop) {
      delete this[prop];
    }, this);

    // Self-disposal.
    ChaplinView.prototype.disposed.apply(this, arguments);

  }
  });


  return Backbone.Chaplin.CollectionView;
}));
