define([
    'jquery',
    'mage/translate',
    'underscore',
    'Magento_Catalog/js/product/view/product-ids-resolver',
    'jquery-ui-modules/widget'
], function ($, $t, _, idsResolver) {
    'use strict';

    var widgetMixin = {
        options: {
            addToCartButtonAddedClass: "added",
            scrollContainer: "html,body",
            scrollTo: ".page-header"
        },

        /**
         * @param {String} form
         */
        enableAddToCartButton: function (form) {
            var addToCartButtonTextAdded = this.options.addToCartButtonTextAdded || $t('Added'),
                self = this,
                addToCartButton = $(form).find(this.options.addToCartButtonSelector);

            addToCartButton.find('span').text(addToCartButtonTextAdded);
            addToCartButton.attr('title', addToCartButtonTextAdded);
            addToCartButton.addClass(self.options.addToCartButtonAddedClass);

            setTimeout(function () {
                var addToCartButtonTextDefault = self.options.addToCartButtonTextDefault || $t('Add to Cart');
                var container = $(self.options.scrollContainer);

                addToCartButton.removeClass(self.options.addToCartButtonDisabledClass);
                addToCartButton.removeClass(self.options.addToCartButtonAddedClass);
                addToCartButton.find('span').text(addToCartButtonTextDefault);
                addToCartButton.attr('title', addToCartButtonTextDefault);

                container.animate({scrollTop: $(self.options.scrollTo).offset().top}, 300);
            }, 2000);
        }
    };

    return function (targetWidget) {
        $.widget('mage.catalogAddToCart', targetWidget, widgetMixin);
        return $.mage.catalogAddToCart;
    };

});
