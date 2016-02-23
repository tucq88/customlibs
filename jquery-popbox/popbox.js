(function(){

	$.fn.popbox = function(options){
		var settings = $.extend({
			selector		: this.selector,
			open			: '.open',
			box			: '.box',
			arrow			: '.arrow',
			arrow_border		: '.arrow-border',
			close			: '.close',
			direction		: 'top'
		}, options);

		var methods = {
			open: function(event){
				event.preventDefault();

				var pop = $(this);
				var box = $(this).parent().find(settings['box']);

				box.find(settings['arrow']).addClass('arrow' + settings['direction']);
				box.find(settings['arrow_border']).addClass('arrow' + settings['direction'] + '-border');

				if(settings['direction'] == 'top' || settings['direction'] == 'bottom'){
					box.find(settings['arrow']).css({'left': box.width()/2 - 10});
					box.find(settings['arrow_border']).css({'left': box.width()/2 - 10});
				}else{
					box.find(settings['arrow']).css({'top': box.height()/2 - 10});
					box.find(settings['arrow_border']).css({'top': box.height()/2 - 10});
				}

				if(box.css('display') == 'block'){
					methods.close();
				} else {
					if(settings['direction'] == 'top'){
						box.css({'display': 'block', 'top': 10, 'left': ((pop.parent().width()/2) - box.width()/2 )});
					}
					if(settings['direction'] == 'left'){
						console.log(((pop.parent().width())));
						box.css({'display': 'block', 'left': ((pop.parent().width()/2) + box.width()/4) - 10, 'bottom': ((pop.parent().height()/2) - box.height()/2 )});
					}
					if(settings['direction'] == 'right'){
						box.css({'display': 'block', 'right': ((pop.parent().width()/2) + box.width()/4) - 10, 'bottom': ((pop.parent().height()/2) - box.height()/2 )});
					}
					if(settings['direction'] == 'bottom'){
						box.css({'display': 'block', 'bottom': 10 + pop.parent().height(), 'right': ((pop.parent().width()/2) - box.width()/2 )});
					}
				}
			},

			close: function(){
				$(settings['box']).fadeOut("fast");
			}
		};

		$(document).bind('keyup', function(event){
			if(event.keyCode == 27){
				methods.close();
			}
		});

		$(document).bind('click', function(event){
			if(!$(event.target).closest(settings['selector']).length){
				methods.close();
			}
		});

		return this.each(function(){
			// Width needs to be set otherwise popbox will not move when window resized.
			$(this).css({'width': $(settings['box']).width()});
			$(settings['open'], this).bind('click', methods.open);
			$(settings['open'], this).parent().find(settings['close']).bind('click', function(event){
				event.preventDefault();
				methods.close();
			});
		});
	}

}).call(this);