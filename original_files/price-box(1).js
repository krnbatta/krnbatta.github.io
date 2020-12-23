/**
 * Anowave Magento 2 Google Tag Manager Enhanced Ecommerce (UA) Tracking
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Anowave license that is
 * available through the world-wide-web at this URL:
 * http://www.anowave.com/license-agreement/
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category 	Anowave
 * @package 	Anowave_Ec
 * @copyright 	Copyright (c) 2020 Anowave (http://www.anowave.com/)
 * @license  	http://www.anowave.com/license-agreement/
 */

define(['jquery','Magento_Catalog/js/price-utils','underscore','mage/template'], function ($, utils, _, mageTemplate) 
{
	'use strict';
	
	return function (widget) 
	{
		$.widget('mage.priceBox', widget, 
		{
			reloadPrice: function reDrawPrices() 
			{
				_.each(this.cache.displayPrices, function (price, priceCode) 
				{
	                price.final = _.reduce(price.adjustments, function (memo, amount) 
	                {
	                    return memo + amount;
	                    
	                }, price.amount);
	                
	                $('[id=product-addtocart-button]').attr('data-price',price.final).data('price',price.final);
	                
	            }, this);
				
				return this._super();
			}
		});
		
		return $.mage.priceBox;
	}
});