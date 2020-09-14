/*
* Copyright (C) 2009 Joel Sutherland
* Licenced under the MIT license
* https://www.newmediacampaigns.com/page/jquery-flickr-plugin
*
* Available tags for templates:
* title, link, date_taken, description, published, author, author_id, tags, image*
*/
(function($){$.fn.jflickrfeed=function(settings,callback){settings=$.extend(true,{flickrbase:'https://api.flickr.com/services/feeds/',feedapi:'photos_public.gne',limit:20,qstrings:{lang:'en-us',format:'json',jsoncallback:'?'},cleanDescription:true,useTemplate:true,itemTemplate:'',itemCallback:function(){}},settings);var url=settings.flickrbase+settings.feedapi+'?';var first=true;for(var key in settings.qstrings){if(!first)
url+='&';url+=key+'='+settings.qstrings[key];first=false;}
return $(this).each(function(){var $container=$(this);var container=this;$.getJSON(url,function(data){$.each(data.items,function(i,item){if(i<settings.limit){if(settings.cleanDescription){var regex=/<p>(.*?)<\/p>/g;var input=item.description;if(regex.test(input)){item.description=input.match(regex)[2]
if(item.description!=undefined)
item.description=item.description.replace('<p>','').replace('</p>','');}}
item['image_s']=item.media.m.replace('_m','_s');item['image_t']=item.media.m.replace('_m','_t');item['image_m']=item.media.m.replace('_m','_m');item['image']=item.media.m.replace('_m','');item['image_b']=item.media.m.replace('_m','_b');delete item.media;if(settings.useTemplate){var template=settings.itemTemplate;for(var key in item){var rgx=new RegExp('{{'+key+'}}','g');template=template.replace(rgx,item[key]);}
$container.append(template)}
settings.itemCallback.call(container,item);}});if($.isFunction(callback)){callback.call(container,data);}});});}})(jQuery);

/* User agent detect --> Begin */

var original_bg_image_width, original_bg_image_height;


/* Footer image color change --> Begin */

    var original_footer_image_bg_color;
    var original_footer_image_border_color;
    var setFooterImageColors = function($footer_image_wrapper) {
        $footer_image_wrapper.css({
            backgroundColor : '',
            borderColor : ''
        });
        original_footer_image_bg_color = $footer_image_wrapper.css('backgroundColor');
        original_footer_image_border_color = $footer_image_wrapper.css('border-left-color');
    }

/* Footer image color change --> End */

jQuery(document).ready(function($) {
	
/* ######################### DOM READY - Begin ######################### */

	if($('#nav').length) {
		
		$('#nav').lavaLamp({
			target: 'li > a',
			container: 'li',
			fx: 'easeOutCubic',
			speed: 400
		});	
		
	}

/* Social Icons --> Begin */ 
	
    $('.kids_social li').not('li:first, li:last', this).append('<span></span>').hover(function() {
        $(this).find('span').stop(true,false).animate({
            height: "100%",
            opacity: "1"
        }, 'normal');
    }, function() {
        $(this).find('span').stop(true,false).animate({
            height: "0",
            opacity: "0"
        }, 'normal');
    });
	
/* Social Icons --> End */ 
	
/* Top Panel --> Begin */ 
	
	var $panel = $(".top-panel .l-page-width");
			
	$('.openbtn').on('click','a',function(e) {
		
		var $target = $(e.target);
		
		if($target.hasClass('hide')) {
			$panel.stop(true,false).animate({
				opacity: '0'
			},200);
			$target.blur();
		}
			
		$panel.slideToggle(600, function(){
			
			$target.toggleClass('hide');
			
			if($(this).css('display') == 'block') {
				$(this).stop(true,false).animate({
					opacity:'1'
				},200);
			} else {
				$(this).stop(true,false).animate({
					opacity:'0'
				},200);
			}
		});
				
		e.preventDefault();
	});
	
/* Top Panel --> End */ 	
	
/* Search Form --> Begin */ 
	
	var $sform = $('#search-form');
	
	$('li.search').on('click', 'a', function(e) {
		
		var $target = $(e.target);
		
		if($target.hasClass('hide')) {
		
				$sform.stop(true,false).animate({
				width : 0,
				opacity : 0
			}, 'normal');
			$target.removeClass('hide');	
			
		} else {
		
			$sform.stop(true,false).animate({
				width : '130px',
				opacity : 1
			}, 'normal').show();	
			
			$target.addClass('hide');
			$sform.find('input[type="text"]').focus();
		}
		
		e.preventDefault();
	});
	
/* Search Form --> End */ 	
	  
/* Twitter --> Begin */  	

 $(".top-panel .tweets").tweet({
	join_text: "auto",
	username: "Creative_WS",
	avatar_size: 0,
	count: 1,
	auto_join_text_default: "", 
	auto_join_text_ed: "",
	auto_join_text_ing: "",
	auto_join_text_reply: "",
	auto_join_text_url: "",
	loading_text: "loading tweets..."
  });

  $(".kids_bottom_container .tweets").tweet({
	join_text: "auto",
	username: "Creative_WS",
	avatar_size: 0,
	count: 2,
	auto_join_text_default: "", 
	auto_join_text_ed: "",
	auto_join_text_ing: "",
	auto_join_text_reply: "",
	auto_join_text_url: "",
	loading_text: "loading tweets..."
  });

  $("#sidebar .tweets").tweet({
	join_text: "auto",
	username: "Creative_WS",
	avatar_size: 0,
	count: 3,
	auto_join_text_default: "", 
	auto_join_text_ed: "",
	auto_join_text_ing: "",
	auto_join_text_reply: "",
	auto_join_text_url: "",
	loading_text: "loading tweets..."
  });
	  
/* Twitter --> End */  	  

/* Pattern bg --> Begin */

$leftPatternBgTop = $('#bg-level-1-left');
$rightPatternBgTop = $('#bg-level-1-right');

$lpage = $('.l-page-width-after');

$leftPatternBg = $('#bg-level-2-left');
$rightPatternBg = $('#bg-level-2-right');

function setLpage(size) {
	$patternWidth = ($('body').width() - size) / 2;
	$lpage.css({
		width : $patternWidth,
		right : 0 - $patternWidth + 10
	})
}

function setPatternsSize(size) {
    $patternWidth = ($('body').width() - size) / 2;
    $leftPatternBg.css({
        width : $patternWidth,
        left : 0 - $patternWidth + 10
    });
    $rightPatternBg.css({
        width : $patternWidth,
        right : 0 - $patternWidth + 10
    });
}

function setPatternsSizeTop(size) {
    $patternWidth = ($('body').width() - size) / 2;
    $leftPatternBgTop.css({
        width : $patternWidth,
        left : 0 - $patternWidth + 10
    });
    $rightPatternBgTop.css({
        width : $patternWidth,
        right : 0 - $patternWidth + 10
    });
}

var bodySize;
if ($('body').hasClass('kids-front-page')) {
    bodySize = 940;
} else {
    bodySize = 950;
}
setLpage(bodySize);
setPatternsSize(bodySize);
setPatternsSizeTop(940);

$(window).resize(function() {setLpage(bodySize)});
$(window).resize(function() {setPatternsSize(bodySize)});
$(window).resize(function() {setPatternsSizeTop(940)});

/* Pattern bg --> End */

/* Slider control fade --> Begin */

    function fadeInControl($controlGroup) {
        $controlGroup.stop(true,true).animate({opacity : 1}, 400);
    }
    function fadeOutControl($controlGroup) {
        $controlGroup.stop(true,true).animate({opacity : 0.3}, 400);
    }

/* Slider control fade --> End */


/* Camera --> Begin */ 
	

	
	if ($("#camera_wrap").length) {
		$('#camera_wrap').camera({
			height: '43.7%',
			loader: 'bar',
			pagination: true,
			thumbnails: false,
			barDirection:false,
			mobileAutoAdvance: true,
			hover:false,
			navigation:true,
			opacityOnGrid:false,
			playPause:false,
			navigationHover:false
		});
	}

	
	
/* Camera --> End */ 

/* Skitter --> Begin */ 
	
(function(){
	
	if ($(".border_box").length) {
		$('.box_skitter_large').skitter({
			thumbs: false, 
 			focus_position: "rightTop", 
 			numbers: false, 
 			show_randomly: true
		});	
	}

})();	
	
/* Skitter --> End */ 

/* NivoSlider --> Begin */
    
    if ($('#kids-slider.nivoSlider').length) {
        $('#kids-slider.nivoSlider').nivoSlider({
            controlNav: true,
            pauseTime:10000,
            directionNav: true,
            directionNavHide: false,
            prevText: '',
            nextText: ''
        });
        var $nivoControlGroup = $('.nivo-prevNav, .nivo-nextNav, .nivo-controlNavWrapperLeftBg');
        $nivoControlGroup.hover(function() {fadeInControl($nivoControlGroup)}, function() {fadeOutControl($nivoControlGroup)});
    }

/* NivoSlider --> End */

/* AnythingSlider --> Begin */

if ($('.flexslider').length) {
  $('.flexslider').flexslider({
    animation: "slide",
	controlNav: true
  });

}

/* AnythingSlider --> End */


/* Lofslidernews --> Begin */

if ($('#kids-slider.lofSliderNews').length) {

    var buttons = {
        previous : $('#kids-slider.lofSliderNews .lof-previous'),
        next : $('#kids-slider.lofSliderNews .lof-next')
    };

    $('#kids-slider.lofSliderNews').lofJSidernews({
        interval        : 4000,
        direction		: 'opacitys',
        easing			: 'easeInOutExpo',
        duration		: 1200,
        auto		 	: false,
        maxItemDisplay  : 4,
        navPosition     : 'horizontal',
        navigatorHeight : 32,
        navigatorWidth  : 80,
        mainWidth       : 916,
        buttons			: buttons
    });
    
    var $lofControlGroup = $('#kids-slider.lofSliderNews .lof-previous, #kids-slider.lofSliderNews .lof-next');
    $lofControlGroup.hover(function() {fadeInControl($lofControlGroup)}, function() {fadeOutControl($lofControlGroup)});

}

/* Lofslidernews --> End */

/* jCarousel --> Begin */

	(function() {

		var $carousel = $('.projects_carousel');
		if($carousel.length) {
			
			$carousel.jcarousel({
				animation : 600,
				easing    : 'easeOutCubic',
				scroll    : 1
			});
		}
		
	})();


  if($('.minigallery-list .minigallery').length) {
	$(".minigallery-list .minigallery").jCarouselLite({
		btnNext: ".next",
		btnPrev: ".prev",
		scroll: 2,
		visible: 9,
		speed: 400,
		mouseWheel: true,
		circular:false,
		easing: "easeInOutCubic"
	});	  
  }

  if($('.minigallery-list2 .minigallery').length) {	
	$(".minigallery-list2 .minigallery").jCarouselLite({
		btnNext: ".next2",
		btnPrev: ".prev2",
		scroll: 2,
		visible: 9,
		speed: 400,
		mouseWheel: true,
		circular:false,
		easing: "easeInOutCubic"
	});
  }
  
/* jCarousel --> End */		

/* VideoJS --> Begin */
    
    VideoJS.setupAllWhenReady();
	
/* VideoJS --> End */

/* Search form --> Begin */

    var $search_form = $('#kids_search_form');
    var $search_wrapper = $search_form.find('.kids_search_wrapper');
    var $search_input = $search_form.find('input');

    $search_form.hover(function() {
        $search_wrapper.stop(true,true).fadeIn(600);
		$search_wrapper.find('input[type=text]').focus();
    },function() {
        if ($search_input.is(":focus")) {
            $search_wrapper.stop(true,true).fadeOut(400);
        } else {
            $search_input.blur(function() {
                $search_wrapper.stop(true,true).fadeOut(400);
                $search_input.unbind('blur');
            });
        }
    });
    
/* Search form --> End */


/* Main navigation --> Begin */
    
    (function() {
        $.fn.menuSlide = function(options) {
            
            options = $.extend({fx: "linear", speed: 200}, options);
            
            var $main_menu = $(this);
            var $main_menu_items = $main_menu.find('> li');
            var $submenus = $main_menu_items.find('> ul');
            var $menu_items = $main_menu.find('li');
                
                $menu_items.hover(function() {
                    $(this).find('> ul').css({
                    }).slideDown(options.speed,options.fx);
                },function() {
                    if ($(this).find('> ul').is(':animated')) {
                        $(this).find('> ul').stop(true, true).removeAttr('style');
                    }
                    $(this).find('> ul').hide();
                });
                
                $submenus.find('> li').hover(function() {
                    $(this).find('> ul').css({
                        left : $(this).parent().width() - 3
                    });
                },function() {});
                
        };
    })();
    
    var $main_nav = $('#kids_main_nav > ul');
	
	 $('#kids_main_nav > ul > li ul').hover( function(){
			var $el = $(this).closest('#kids_main_nav').find('.backLava');
			var $ell =	$el.css('left');
				$el.css({
					left : $ell
				});
				},function(){
					$('li.backLava').show(100) 
				}
			);

    $main_nav.menuSlide({fx:"easeOutCirc", speed: 400});

	var $ls = $("#kids_main_nav li a:contains('Left Sidebar')");
	var $rs = $("#kids_main_nav li a:contains('Right Sidebar')");
	 $ls.click(function() {
		 $('#sbr').attr('id', 'sbl');
		 return false;
	 });
	 $rs.click(function() {
		 $('#sbl').attr('id', 'sbr');
		 return false;
	 });

    
/* Main navigation --> End */

/* Pretty photo popup --> Begin */

    $("a.prettyPhoto").prettyPhoto();
	
	if($('.prettyPhoto').length) {
		
		(function() {
			$('a.prettyPhoto').prettyPhoto().each(function() {
				$(this).append('<span class="kids_curtain">&nbsp;</span>');
			});		
		})();	
		
	}
	

	$('p + blockquote').prev().css('margin-bottom','0');

/* Pretty photo popup --> End */

/* To top --> Begin */
	
	(function() {

		var extend = {
				button      : '#kids-back-top',
				text        : 'Back to Top',
				min         : 200,
				fadeIn      : 400,
				fadeOut     : 400,
				speed		: 800,
				easing		: 'easeOutQuint'
			}

		$('body').append('<div id="' + extend.button.substring(1) + '"><a href="#top" title="' + extend.text + '"><span>' + extend.text + '</span></a></div>');

		$(window).scroll(function() {
			var pos = $(window).scrollTop();

			if (pos > extend.min) {
				$(extend.button).fadeIn(extend.fadeIn);
			}
			else {
				$(extend.button).fadeOut (extend.fadeOut);
			}

		});

		$(extend.button).add(extend.backToTop).click(function(e){
			$('html, body').animate({scrollTop : 0}, extend.speed, extend.easing);
			e.preventDefault();
		});

	})();

/* end Back to Top */
	
	
/* To top --> End */


/* Bottom container images --> Begin */

    setFooterImageColors($('#kids_bottom_container .kids_image_wrapper'));

    if ($('#kids_bottom_container .kids_image_wrapper').length) {
        $('#kids_bottom_container .kids_image_wrapper').hover(function() {
            $(this).stop(true,true).animate({backgroundColor : "#ddf0f7", borderColor : "#ddf0f7"}, 600);
        },function() {
            $(this).stop(true,true).animate({backgroundColor : original_footer_image_bg_color, borderColor : original_footer_image_border_color}, 400);
        });
    }

/* Bottom container images --> End */


/* Pricing Tables --> Begin */

	(function() {

		if($('.pricing-table').length) {

			var pt = $('.pricing-table .column', this);
				pt.find('li:even:not(.footer_row):not(.header_row)').addClass('even');
				pt.first().addClass('first');
				pt.last().addClass('last');
				pt.find('li:not(.header_row):first').css('padding-top','2.2em');
				pt.find('li:not(.footer_row):last').css('padding-bottom','2.2em');
			var ptFirst = $('.pricing-table .column:first-child');
			var ptLast = $('.pricing-table .column:last-child');	
				ptFirst.find('li:not(.footer_row):not(.header_row)').css('border-left', '2px solid #98c2e1');
				ptLast.find('li:not(.footer_row):not(.header_row)').css('border-right', '2px solid #98c2e1');
				$('.pricing-table .column:last-child').find('.footer_row').addClass('footer_border');	

		}	

	})();


/* Pricing Tables --> End */

/* Google Map --> Begin */
	 
	(function() {
		
		if($('#map_canvas').length) {
			$('#map_canvas').gMap({ 
				address: 'Nirvana Society, Sector-49, Chandigarh, India',
				zoom: 13,
				markers: [
				{
					'address' : 'Nirvana Society, Chandigarh'
				}
				]
			});  
		}
		
	})();
	 
/* Google Map --> End */
	  
/* Accordion --> Begin */

   if($('ul.accordion').length) {
		$('ul.accordion').accordion({autoHeight:false,header:".opener",collapsible:true,event:"click"});
   }
   
   if($('.widget_categories ul').length) {
		$('.widget_categories ul').accordion({autoHeight:false,header:".opener",collapsible:true,event:"click"});
   }
   
   if($('ul.highlighter').length) {
		$('ul.highlighter').accordion({active:'.selected',autoHeight:false,header:"a",collapsible:true,event:"click"});
   }
   
/* Accordion --> End */

/* Tabs --> Begin */

	if($('.tabs').length) {	
		//When page loads...
		$("ul.tabs li:first").addClass("active").show(); //Activate first tab
		$(".tab_container .tab_content:first").show(); //Show first tab content
	
		//On Click Event
		$("ul.tabs li").click(function() {
	
			$("ul.tabs li").removeClass("active"); //Remove any "active" class
			$(this).addClass("active"); //Add "active" class to selected tab
			$(".tab_content").hide(); //Hide all tab content
	
			var activeTab = $(this).find("a").attr("href"); //Find the href attribute value to identify the active tab + content
			$(activeTab).fadeIn('slow'); //Fade in the active ID content
			return false;
		});
	}
	
/* Tabs --> End */

/* Toggle --> Begin */

	if($('.toggle_container').length) {	
		$(".toggle_container").hide();
	
		$("b.trigger").click(function(){
			$(this).toggleClass("active").next().slideToggle("slow");
			return false;
		});
	}
	
/* Toggle --> End */


/* Flickr Photos --> Begin */	

if($('ul#flickr-badge').length) {
	jQuery('ul#flickr-badge').jflickrfeed({
		limit: 9,
		qstrings: {
		id: '56342020@N03'
	},
	itemTemplate: '<li><a href="https://www.flickr.com/photos/56342020@N03"><img src="{{image_s}}" alt="{{title}}" /></a></li>'
	}, function() {$('#flickr-badge li:nth-child(3n)').addClass('last');});
}

/* Flickr Photos --> End */

	if (jQuery("a[data-rel]").length) {
		jQuery('a[data-rel]').each(function() {jQuery(this).attr('rel', jQuery(this).data('rel'));});
	}
	
	if($('.splitter').length) {
		$('.splitter').lavaLamp({fx: "easeOutCubic", speed: 400});
	}


/*Portfolio  --> Begin */

	(function() {

		var $cont = $('#gallery');

		if($cont.length) {

			var $itemsFilter = $('#splitter'),
				mouseOver;

			// Copy categories to item classes
			$('.gallery-item', $cont).each(function(i) {
				var $this = $(this);
				$this.addClass( $this.attr('data-categories') );
			});

			// Run Isotope when all images are fully loaded
			$(window).on('load', function() {

				$cont.isotope({
					itemSelector : 'li.gallery-item',
					layoutMode   : 'fitRows'
				});

			});
			
			// Filter projects
			$itemsFilter.on('click', 'a', function(e) {
				var $this         = $(this),
					currentOption = $this.attr('data-categories');
					
				$itemsFilter.find('a').removeClass('active');
				$this.addClass('active');

				if(currentOption) {
					if(currentOption !== '*') currentOption = currentOption.replace(currentOption, '.' + currentOption)

					$cont.isotope({filter : currentOption});
				}

				e.preventDefault();
			});

			$itemsFilter.find('a').first().addClass('active');
		}

	})();

/* end Portfolio  */


/* Tables --> Begin */

	if($('.custom-table').length) {
		
		$('.custom-table thead tr th:first-child,.custom-table2 thead tr th:first-child').addClass('radius-left');
		$('.custom-table thead tr th:last-child, .custom-table2 thead tr th:last-child').addClass('radius-right');
		$('.custom-table tbody tr td:last-child, .custom-table2 tbody tr td:last-child').addClass('noborder');	
		
	}
	
/* Tables --> End */

/* Box close --> Begin */

	function handler(event) {
		
		var $target = $(event.target);
		
		if($target.is('.close-box')) {
			var $box = $target.parent();
			$box.animate({opacity: '0'}, 500, function() {
				$(this).slideUp(500, function() {
					$(this).remove();
				});
			});	
		}
		
	}
		
	$('.custom-box-wrap').append('<span class="close-box">&times;</span>').click(handler);


/* Box close --> End */

/* Contact Form --> Begin */

	(function() {

		if($('#contactform').length) {

			var $form = $('#contactform'),
			$loader = '<img src="images/preloader.gif" alt="Loading..." />';
			$form.find("fieldset").append('<div id="contact_form_responce">');

			var $response = $('#contact_form_responce');
			$response.append('<p></p>');

			$form.submit(function(e){

				$response.find('p').html($loader);

				var data = {
					action: "contact_form_request",
					values: $("#contactform").serialize()
				};

				//send data to server
				$.post("php/contact-send.php", data, function(response) {

					response = $.parseJSON(response);
					
					$(".wrong-data").removeClass("wrong-data");
					$response.find('img').remove();

					if(response.is_errors){

						$response.find('p').removeClass().addClass("error-box");
						$.each(response.info,function(input_name, input_label) {

							$("[name="+input_name+"]").addClass("wrong-data");
							$response.find('p').append(input_label+ '</br>');
						});

					} else {

						$response.find('p').removeClass().addClass('success-box');

						if(response.info == 'success'){
							$response.find('p').append('Your message has been successfully sent!');
								$response.find('p').delay(2000).hide(500, function(){
									$(this).removeClass().text("").fadeIn(500);
								})
								$form.find('input:not(input[type="submit"], button), textarea, select').val('').attr( 'checked', false );
						}

						if(response.info == 'server_fail'){
							$response.find('p').append('Server failed. Send later!');
						}
					}

					// Scroll to bottom of the form to show respond message
					var bottomPosition = $form.offset().top + $form.outerHeight() - $(window).height();

					if($(document).scrollTop() < bottomPosition) {
						$('html, body').animate({
							scrollTop : bottomPosition
						});
					}

					if(!$('#contact_form_responce').css('display') == 'block') {
						$response.show(450);
					}

				});

				e.preventDefault();

			});				

		}

	})();

/* Contact Form --> End */
	$(".flexnav").flexNav();
	
	if($(".menu-button").length){
		$(".menu-button").click(function(){
			if($(".menu-button").hasClass("menu-button-opened")){
				$(this).removeClass("menu-button-opened");
			}
			else{
				$(this).addClass("menu-button-opened");
			}
		});
	}
	
	$(".jcarousel-prev").nextUntil('.jcarousel-prev').andSelf().wrapAll("<div class='carousel-nav'></div>");
	$(".recent_projects h3").after($(".jcarousel-container>div.carousel-nav"));
	
	$('.widget_categories>ul>li:not(:has(ul))').each(function(index){
		$(this).find('a').css({
			'background':'url("images/icons/rounded_empty.png") no-repeat',
			'background-position':'0 8px'
		});
	});
	$(".camera_pag").wrapAll('<div class="camera_pagination"></div>').wrapAll('<div class="camerapag_left"></div>').wrapAll('<div class="camerapag_right"></div>')
	$(".flex-control-nav").wrapAll('<div class="camera_pagination"></div>').wrapAll('<div class="camerapag_left"></div>').wrapAll('<div class="camerapag_right"></div>').wrapAll('<div class="camera_pag"></div>')
	
});/* ######################### DOM READY - END ######################### */