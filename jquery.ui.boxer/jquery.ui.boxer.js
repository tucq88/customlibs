/**
 * jquery.ui.boxer
 *
 * @author hoatle
 * @since Apr 8, 2015
 *
 * inspired by http://jsbin.com/azare/988/edit?js,output
 */

$.widget('ui.boxer', $.ui.mouse, {
  options: {
    version: '0.1.0',
    disabled: true, //disabled by default
    appendTo: 'body',  //TODO(hoatle): support "parent" and relative positioned parent
    helperBorder: '1px dotted black',
    helperClass: '',
    cursor: 'crosshair'
  },
  _init: function() {
    this.element.addClass('ui-boxer');
    this.originalCursor = this.element.css('cursor');
    this.dragged = false;
    this._mouseInit();
    this.helper = $(document.createElement('div'))
        .css({border: this.options.helperBorder})
        .addClass(this.options.helperClass)
        .addClass('ui-boxer-helper');

    this.appendToElement = this.options.appendTo == 'parent' ?
      this.element.parent() : $(this.options.appendTo);
  },
  _destroy: function() {
    this.element
        .removeClass('ui-boxer ui-boxer-disabled')
        .removeData('boxer')
        .unbind('.boxer')
        .css('cursor', this.originalCursor);
    this._mouseDestroy();
    return this;
  },
  _setOption: function(key, value) {
    if (key === 'disabled') {
      this.element.css('cursor', value ? this.originalCursor: this.options.cursor);
    }
    this._super(key, value);
  },
  _mouseStart: function(event) {

    this.startedPosition = {
      x: event.pageX,
      y: event.pageY
    };

    if (this.options.disabled) {
      return
    }

    var options = this.options;

    this.helper
        .css({border: this.options.helperBorder})
        .addClass(this.options.helperClass);

    this._trigger('start', event);

    this.appendToElement.append(this.helper);

    var coords = this._calculateCoords({ left: event.clientX, top: event.clientY });

    this.helper.css({
      'z-index': 100,
      'position': 'absolute',
      'left': coords.left,
      'top': coords.top,
      'width': 0,
      'height': 0
    });
  },
  _mouseDrag: function(event) {
    this.dragged = true;

    if (this.options.disabled) {
      return;
    }

    var x1 = this.startedPosition['x'], y1 = this.startedPosition['y'], x2 = event.pageX, y2 = event.pageY;
    if (x1 > x2) { var tmp = x2; x2 = x1; x1 = tmp; }
    if (y1 > y2) { tmp = y2; y2 = y1; y1 = tmp; }

    var coords = this._calculateCoords({ left: x1, top: y1 });

    this.helper.css({left: coords.left, top: coords.top, width: x2-x1, height: y2-y1});

    this._trigger('drag', event);

    return false;
  },
  _mouseStop: function(event) {
    this.dragged = false;
    if (this.options.disabled) {
      return;
    }

    var cloneBox = this.helper.clone();

    this._trigger('stop', event, cloneBox);

    this.helper.remove();

    return false;
  },

  _calculateCoords: function(originalCoords) {
    var leftCoord = originalCoords.left;
    var topCoord = originalCoords.top;

    if(this.appendToElement.css('position') == "relative") {
      leftCoord -= this.appendToElement.offset().left;
      topCoord -= this.appendToElement.offset().top;
    }

    return { left: leftCoord, top: topCoord };
  }
});
