define(["jquery"], function($) {
	"use strict";

	$(document).ready(function() {

		document.body.addEventListener('touchstart', function(evt) {

			// BMB-676: product tabs

			if (evt.target.className && /data switch/.test(evt.target.className) && document.body.offsetWidth < 768) {
				var parent = evt.target.parentNode;
				if (parent && parent.className && / active/.test(parent.className)) {
					setTimeout(function() {
						parent.className = parent.className.replace(/ active/, '');
						var targetId = evt.target.getAttribute('href').replace(/#/g, '');
						if (targetId) {
							var target = document.getElementById(targetId);
							if (target) {
								target.style.display = 'none';
							}
						}
					}, 300);
				}
			}

		});

	});

});
