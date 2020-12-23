define(["jquery"], function($) {
	"use strict";

	$(document).ready(function() {

		var colourSelect = document.querySelector('select[name="super_attribute[409]"]');

		if (colourSelect) {

			var hideColourSelect = function(element) {
				var colourSelectParent = element.parentNode.parentNode;
				colourSelectParent.style.position = 'absolute';
				colourSelectParent.style.opacity = '0.01';
				colourSelectParent.style.overflow = 'hidden';
				colourSelectParent.style.width = '1px';
				colourSelectParent.style.height = '1px';
			};

			// create an observer object or a crude fallback
			var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || function() {
				this.observe = function() {
					this.interval = setInterval(this.promise.bind(this, null, this), 500);
				};
				this.disconnect = function() {
					clearInterval(this.interval);
				};
				this.promise = arguments[0];
			};

			// add a handler to the observer
			var observer = new MutationObserver(function(mutations, observer) {
				// select the first colour
				colourSelect.selectedIndex = 1;
				// hide the field
				hideColourSelect(colourSelect);
			});

			// start observing changes to the document
			observer.observe(colourSelect, {
				'childList': true,
				'attributes': true,
				'attributeFilter': [
					'id', 'class', 'disabled'
				],
				'characterData': false,
				'subtree': true,
				'attributeOldValue': false,
				'characterDataOldValue': false
			});

			hideColourSelect(colourSelect);

		}

	});

});
