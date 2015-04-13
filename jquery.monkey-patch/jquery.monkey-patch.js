/**
 * monkey patching the jquery lib
 */

// from http://stackoverflow.com/questions/10045423/determine-whether-user-clicking-scrollbar-or-content-onclick-for-native-scroll
(function ($) {

  $(function () {
    $.fn.hasScroll = function (axis) {
      var overflow = this.css('overflow'),
          overflowAxis;

      if (typeof axis == 'undefined' || axis == 'y') overflowAxis = this.css('overflow-y');
      else overflowAxis = this.css('overflow-x');

      var bShouldScclearoll = this.get(0).scrollHeight > this.innerHeight();

      var bAllowedScroll = (overflow == 'auto' || overflow == 'visible') ||
          (overflowAxis == 'auto' || overflowAxis == 'visible');

      var bOverrideScroll = overflow == 'scroll' || overflowAxis == 'scroll';

      return (bShouldScroll && bAllowedScroll) || bOverrideScroll;
    };

    $.fn.mousedown = function (data, fn) {
      if (fn == null) {
        fn = data;
        data = null;
      }
      var o = fn;
      fn = function (e) {
        if (!inScrollRange(e)) {
          return o.apply(this, arguments);
        }
        return;
      };
      if (arguments.length > 0) {
        return this.bind('mousedown', data, fn);
      }
      return this.trigger('mousedown');
    };

    $.fn.mouseup = function (data, fn) {
      if (fn == null) {
        fn = data;
        data = null;
      }
      var o = fn;
      fn = function (e) {
        if (!inScrollRange(e)) {
          return o.apply(this, arguments);
        }
        return;
      };
      if (arguments.length > 0) {
        return this.bind('mouseup', data, fn);
      }
      return this.trigger('mouseup');
    };

    $.fn.mousedownScroll = function (data, fn) {
      if (fn == null) {
        fn = data;
        data = null;
      }
      var o = fn;
      fn = function (e) {
        if (inScrollRange(e)) {
          e.type = 'mousedownscroll';
          return o.apply(this, arguments);
        }
        return;
      };
      if (arguments.length > 0) {
        return this.bind('mousedown', data, fn);
      }
      return this.trigger('mousedown');
    };

    $.fn.mouseupScroll = function (data, fn) {
      if (fn == null) {
        fn = data;
        data = null;
      }
      var o = fn;
      fn = function (e) {
        if (inScrollRange(e)) {
          e.type = 'mouseupscroll';
          return o.apply(this, arguments);
        }
        return;
      };
      if (arguments.length > 0) {
        return this.bind('mouseup', data, fn);
      }
      return this.trigger('mouseup');
    };

    var RECT = function () {
      this.top = 0;
      this.left = 0;
      this.bottom = 0;
      this.right = 0;
    };

    function inRect(rect, x, y) {
      return (y >= rect.top && y <= rect.bottom) &&
          (x >= rect.left && x <= rect.right)
    }


    var scrollSize = measureScrollWidth();

    function inScrollRange(event) {
      var x = event.pageX,
          y = event.pageY,
          e = $(event.target),
          hasY = e.hasScroll(),
          hasX = e.hasScroll('x'),
          rX = null,
          rY = null,
          bInX = false,
          bInY = false;

      if (hasY) {
        rY = new RECT();
        rY.top = e.offset().top;
        rY.right = e.offset().left + e.width();
        rY.bottom = rY.top + e.height();
        rY.left = rY.right - scrollSize;

        //if(hasX) rY.bottom -= scrollSize;
        bInY = inRect(rY, x, y);
      }

      if (hasX) {
        rX = new RECT();
        rX.bottom = e.offset().top + e.height();
        rX.left = e.offset().left;
        rX.top = rX.bottom - scrollSize;
        rX.right = rX.left + e.width();

        //if(hasY) rX.right -= scrollSize;
        bInX = inRect(rX, x, y);
      }

      return bInX || bInY;
    }

    $(document).on('mousedown', function (e) {
      //Determine if has scrollbar(s)
      if (inScrollRange(e)) {
        $(e.target).trigger('mousedownScroll');
      }
    });

    $(document).on('mouseup', function (e) {
      if (inScrollRange(e)) {
        $(e.target).trigger('mouseupScroll');
      }
    });
  });

  function measureScrollWidth() {
    var scrollBarMeasure = $('<div />');
    $('body').append(scrollBarMeasure);
    scrollBarMeasure.width(50).height(50)
        .css({
          overflow: 'scroll',
          visibility: 'hidden',
          position: 'absolute'
        });

    var scrollBarMeasureContent = $('<div />').height(1);
    scrollBarMeasure.append(scrollBarMeasureContent);

    var insideWidth = scrollBarMeasureContent.width();
    var outsideWitdh = scrollBarMeasure.width();
    scrollBarMeasure.remove();

    return outsideWitdh - insideWidth;
  }

})(jQuery);
