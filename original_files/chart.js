require([
    'jquery',
    'jquery/ui',
    'domReady!'
], function($) {
    var waitForFinalEvent = (function () {
        var timers = {};
        return function (callback, ms, uniqueId) {
            if (!uniqueId) {
              uniqueId = "Don't call this twice without a uniqueId";
            }
            if (timers[uniqueId]) {
              clearTimeout (timers[uniqueId]);
            }
            timers[uniqueId] = setTimeout(callback, ms);
        };
    })();

    function sizeChart() {
        $(".height-col").each(function( index ) {
          //Block width
          var blockWidth = ($(".height-col").outerWidth() / ($(".row-head .size-col").length - 1));
          var blockMultiplier = $(this).find(".size-bar").data("blocks");
          //Block offset
          var blockOffset = $(this).find(".size-bar").data("offset");
          //Make the changes
          $(this).find(".size-bar").css("width", (blockWidth * blockMultiplier) + "px").css("margin-left", (blockWidth * blockOffset) + "px");
        });
    };
    
    sizeChart();

    $(window).resize(function () {
        waitForFinalEvent(function(){
            sizeChart();
        }, 100);
    });

    $("a[id='tab-label-sizing.guide-title']").on('click', function() {
        waitForFinalEvent(function(){
            sizeChart();
        }, 100);
    });
});
