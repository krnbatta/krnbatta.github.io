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

define(['jquery'], function ($) 
{
    'use strict';
    
    return function (widget) 
    {
    	return $.widget('mage.sidebar', $.mage.sidebar, 
    	{
    		_removeItemAfter:function (elem, response) 
        	{
        		if (response.hasOwnProperty('dataLayer') && 'undefined' !== typeof dataLayer)
        		{
        			if (AEC.Const.COOKIE_DIRECTIVE)
    				{
    					if (AEC.Const.COOKIE_DIRECTIVE_CONSENT_GRANTED)
    					{
    						dataLayer.push(response.dataLayer);
    					}
    				}
        			else
        			{
        				dataLayer.push(response.dataLayer);
        			}
        		}
        		
        		return this._super(elem);
            },
            _updateItemQtyAfter: function (elem, response) 
            {
            	if (response.hasOwnProperty('dataLayer') && 'undefined' !== typeof dataLayer)
        		{
                	if (AEC.Const.COOKIE_DIRECTIVE)
    				{
    					if (AEC.Const.COOKIE_DIRECTIVE_CONSENT_GRANTED)
    					{
    						dataLayer.push(response.dataLayer);
    					}
    				}
                	else 
    				{
                		dataLayer.push(response.dataLayer);
    				}
        		}
            	
            	return this._super(elem);
            }
        });
    }
});