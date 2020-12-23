var activationOptions =  {
htmlWidgetElementTemplate:'<a href="javascript:void(0);" id="checkStoreBtn" onclick="stockInStore.checkStockInStore(this);" class="storeStockBtn sisIcon"> {{#IFNOTEmpty buttonImageDesktop}} {{#IFNOTEmpty buttonImageDesktopHover}} <img class="sis-desktop" onmouseout="stockInStore.swapImage(this,\'{{clientMediaURL}}{{buttonImageDesktop}}\');" onmouseover="stockInStore.swapImage(this,\'{{clientMediaURL}}{{buttonImageDesktopHover}}\');" src="{{clientMediaURL}}{{buttonImageDesktop}}"/> {{else}} <img class="sis-desktop" src="{{clientMediaURL}}{{buttonImageDesktop}}"/> {{/IFNOTEmpty}} {{else}} <span class="sis-desktop">{{{xmlMapMan}}}{{strWidgetElementText}}</span> {{/IFNOTEmpty}} {{#IFNOTEmpty buttonImageMobile}} {{#IFNOTEmpty buttonImageMobileHover}} <img class="sis-mobile-only" onmouseout="stockInStore.swapImage(this,\'{{clientMediaURL}}{{buttonImageMobile}}\');" onmouseover="stockInStore.swapImage(this,\'{{clientMediaURL}}{{buttonImageMobileHover}}\');" src="{{clientMediaURL}}{{buttonImageMobile}}"/> {{else}} <img class="sis-mobile-only" src="{{clientMediaURL}}{{buttonImageMobile}}"/> {{/IFNOTEmpty}} {{else}} {{#IFNOTEmpty strWidgetElementTextMobile}} <span class="sis-mobile-only">{{{xmlMapMan}}}{{strWidgetElementTextMobile}}</span> {{else}} <span class="sis-mobile-only">{{{xmlMapMan}}}{{strWidgetElementText}}</span> {{/IFNOTEmpty}} {{/IFNOTEmpty}} </a>',
fnSetSISButtonLocation:function(settings){
try{
var getAddtocartButton =  document.getElementById('product-addtocart-button')
if(getAddtocartButton!==null){
//return {enable:true,action:'after', target:'#product-addtocart-button',isSearchTarget:true}
return {enable:true,action:'after', target:'.box-tocart',isSearchTarget:true}
}else{
//Checks if product of out of stock
var checkBoxCart = stockInStoreGlobal.querySelect('.box-tocart');

if(checkBoxCart.length <=0){
var checkProductAddForm = stockInStoreGlobal.querySelect('.product-add-form');
if(checkProductAddForm.length >0){
return {enable:true,action:'after', target:'.product-add-form',isSearchTarget:true}
}
}else{
return {enable:true,action:'after', target:'.box-tocart',isSearchTarget:true}
}

}

}
catch(err){
}
},
objConfigPreLoaders:{general:'<span class="fa fa-spinner fa-pulse"></span>',productFeature:'<span class="fa fa-spinner fa-pulse"></span>',storeList:'<div class="loading-wrap"><span class="fa fa-spinner fa-pulse"></span><span>Loading stores. Please wait...</span></div>'},
objConfigRadius:{label:'Within',defaultValue:'30',list:[{label:'5',value:'5'},{label:'10',value:'10'},{label:'20',value:'20'},{label:'30',value:'30'},{label:'40',value:'40'},{label:'50',value:'50'},{label:'60',value:'60'},{label:'70',value:'70'},{label:'80',value:'80'}]},
fnGetProductDetails:function(settings,callback){
settings.dataProduct.name =  "";
settings.dataProduct.image = "";
settings.dataProduct.style = "";

try{
settings.dataProduct.name =  stockInStoreGlobal.querySelect('h1.page-title')[0].innerHTML;
settings.dataProduct.image = stockInStoreGlobal.querySelect('.fotorama__img')[0].getAttribute('src');
}
catch(err){
}
settings.dataProduct.style = "";

if(callback != null) return callback.call(this);
},
fnGetProductIdentifier:function(settings,callback){
try{

	requirejs(['jquery','underscore'], function(jQuery,_){

		//Check if product is configurable

		var productConf= jQuery("#product_addtocart_form").data();
		var existingProducts = new Object();
		var sizeOfExistingProducts = 0;
		var currentSimpleProductId = "";

		if(typeof(productConf.mageConfigurable)!=='undefined'){

			var prodSettings = productConf.mageConfigurable.options.settings;
			
			for(var i=prodSettings.length-1;i>=0;i--){
				var selected = prodSettings[i].options[prodSettings[i].selectedIndex];
				
				if(typeof(selected)!=='undefined'){
					if(typeof(selected.config)!=='undefined'){
						
						for (var iproducts = 0; iproducts < selected.config.products.length; iproducts++) {
							var usedAsKey = selected.config.products[iproducts] + "";
							if (existingProducts[usedAsKey] == undefined) {
								existingProducts[usedAsKey] = 1;
							} else {
								existingProducts[usedAsKey] = existingProducts[usedAsKey] + 1;
							}
						}
					}
				}
			}

			for (var keyValue in existingProducts) {
				for (var keyValueInner in existingProducts) {
					if (Number(existingProducts[keyValueInner]) < Number(existingProducts[keyValue])) {
						delete existingProducts[keyValueInner];
					}
				}
			}

			for (var keyValue in existingProducts) {
				currentSimpleProductId = keyValue;
				sizeOfExistingProducts = sizeOfExistingProducts + 1
			}
		
		
		
		
		
			var callUPI = false;
		
			if(currentSimpleProductId !=="" && sizeOfExistingProducts  == 1){

				callUPI = true;
				
			}else{
				var cntIndex = 0;
				var indexObj = productConf.mageConfigurable.options.spConfig.index;
				for (var indkeyValue in indexObj) {
					if(cntIndex <=0){
						currentSimpleProductId = indkeyValue;
							callUPI = true;
					}
					cntIndex ++;
				}
			}
			
			
			if(callUPI){
				stockInStore.getUPI(currentSimpleProductId ,function(data){
					settings.dataIdentifiers.product  = data.response;
					
					if(callback != null) return callback.call(this);
				})
			}

		}else{
			//Get the SKU from the other source
			settings.dataIdentifiers.product  = window.google_tag_params.ecomm_prodid;
			
			if(callback != null) return callback.call(this);
		}
	});
}catch(err){
	settings.dataIdentifiers.product  = "";
	if(callback != null) return callback.call(this);
}
},
fnGetVariationIdentifier:function(settings,callback){
try{

	requirejs(['jquery','underscore'], function(jQuery,_){

		//Check if product is configurable

		var productConf= jQuery("#product_addtocart_form").data();
		var existingProducts = new Object();
		var sizeOfExistingProducts = 0;
		var currentSimpleProductId = "";

		if(typeof(productConf.mageConfigurable)!=='undefined'){

			var prodSettings = productConf.mageConfigurable.options.settings;
			
			for(var i=prodSettings.length-1;i>=0;i--){
				var selected = prodSettings[i].options[prodSettings[i].selectedIndex];
				
				if(typeof(selected)!=='undefined'){
					if(typeof(selected.config)!=='undefined'){
						
						for (var iproducts = 0; iproducts < selected.config.products.length; iproducts++) {
							var usedAsKey = selected.config.products[iproducts] + "";
							if (existingProducts[usedAsKey] == undefined) {
								existingProducts[usedAsKey] = 1;
							} else {
								existingProducts[usedAsKey] = existingProducts[usedAsKey] + 1;
							}
						}
					}
				}
			}

			for (var keyValue in existingProducts) {
				for (var keyValueInner in existingProducts) {
					if (Number(existingProducts[keyValueInner]) < Number(existingProducts[keyValue])) {
						delete existingProducts[keyValueInner];
					}
				}
			}

			for (var keyValue in existingProducts) {
				currentSimpleProductId = keyValue;
				sizeOfExistingProducts = sizeOfExistingProducts + 1
			}
		
		
		
		
		
			var callUPI = false;
		
			if(currentSimpleProductId !=="" && sizeOfExistingProducts  == 1){

				callUPI = true;
				
			}else{
				var cntIndex = 0;
				var indexObj = productConf.mageConfigurable.options.spConfig.index;
				for (var indkeyValue in indexObj) {
					if(cntIndex <=0){
						currentSimpleProductId = indkeyValue;
							callUPI = true;
					}
					cntIndex ++;
				}
			}
			
			
			if(callUPI){
				stockInStore.getUPI(currentSimpleProductId ,function(data){
					settings.dataIdentifiers.variation = data.response;
					settings.dataIdentifiers.isindex=0;
					if(callback != null) return callback.call(this);
				})
			}

		}else{
			//Get the SKU from the other source
			settings.dataIdentifiers.variation = window.google_tag_params.ecomm_prodid;
			settings.dataIdentifiers.isindex=0;
			if(callback != null) return callback.call(this);
		}
	});
}catch(err){
	settings.dataIdentifiers.variation = "";
	if(callback != null) return callback.call(this);
}
},
fnStyleStoresList:function(settings){
var storeList = document.getElementById('storesList');
			var elms 		= stockInStoreGlobal.querySelect('.storeDetails');
			var elmshide 	= stockInStoreGlobal.querySelect('.storeDetails.hideElement');
			var totalelms 	= (elms.length - elmshide.length);
			var totalWidth   = totalelms * (settings.objConfigStoreListContainer.storeElemcontainer.width);
			storeList.style.width = totalWidth + 'px'; 
},
fnManageStoreNavigation:function(settings){
var storeNavigation = document.getElementById('storeNavigation')
			var elms 		= stockInStoreGlobal.querySelect('.storeDetails');
			var elmshide 	= stockInStoreGlobal.querySelect('.storeDetails.hideElement');
			
			var totalelms 	= (elms.length - elmshide.length);

			if(totalelms <=settings.objConfigStoreListContainer.storeElemcontainer.moveby)
			{
				storeNavigation.className  = 'disableNavigation';
			}else
			{
				storeNavigation.className = '';
			}
},
fnFindUPIVariation:function(settings,e){
var data = settings.dataCache.productVariations.response;

var arrVariations = settings.dataVariations.arrayVariationInfo;
var arrConditionsObject = [];
var searchKey = '';
			
for(var i=0;i<arrVariations.length;i++){
	var ind = arrVariations[i].variationIndex;
	searchKey += stockInStoreGlobal.querySelect('.sisvar_' + ind)[0].value;
}
for(var i=0;i<data.length;i++){
	var combinekey = '';
	for(var j=0;j<arrVariations.length;j++){
		var ind = arrVariations[j].variationIndex;
                var encodedStr = data[i]['variation_' + ind];
                var parser = new DOMParser;
                var dom = parser.parseFromString('<!doctype html><body>' + encodedStr,'text/html');
		combinekey += dom.body.textContent;
	}
	if(combinekey == searchKey ){
		settings.dataIdentifiers.product = data[i].upi;
	}
}
},
siteLogo:'File_5c491b526719c.png',
promotionTileImage1:'File_5c491acea7c49.jpeg',
promotionBannerImage1:'',
htmlPromotionTileTemplate:'{{#IFNOTEmpty promotionTileLink1}} <a onclick="stockInStore.sendLinkEvents(this,\'Promo Tile\');" href="{{promotionTileLink1}}" target="_blank"><img src={{clientMediaURL}}{{promotionTileImage1}} /></a> {{else}} {{#IFNOTEmpty promotionTileImage1}} <img src={{clientMediaURL}}{{promotionTileImage1}} /> {{/IFNOTEmpty}} {{/IFNOTEmpty}}',
htmlPromotionBannerTemplate:'{{#IFNOTEmpty promotionBannerLink1}} <a onclick="stockInStore.sendLinkEvents(this,\'Promo Banner\');" href="{{promotionBannerLink1}}" target="_blank"><img src={{clientMediaURL}}{{promotionBannerImage1}} /></a> {{else}} {{#IFNOTEmpty promotionBannerImage1}} <img src={{clientMediaURL}}{{promotionBannerImage1}} /> {{/IFNOTEmpty}} {{/IFNOTEmpty}}',
promotionTileLink1:'',
promotionBannerLink1:'',
fnOnChangeVariation:function(settings,e){
try{
	var checkSizeVariation = jQuery("#attribute406").is(":visible")

	if(checkSizeVariation){
			var getSISSizeSelection = jQuery("#productVariations .sisvar_1").val();
			
			//First we check if this size is available online
			var isFoundSize = false;
			
			jQuery("#attribute406 option").each(function(){
				if(jQuery(this).text() == getSISSizeSelection){
					isFoundSize = true;
				}
			})
			
			if(isFoundSize){
					document.querySelectorAll(".uiAddProductSelectionBtn")[0].disabled = false;
					document.querySelectorAll(".uiAddProductSelectionBtn")[1].disabled = false;
			}else{
				document.querySelectorAll(".uiAddProductSelectionBtn")[0].disabled = true;
				document.querySelectorAll(".uiAddProductSelectionBtn")[1].disabled = true;
			}
	}else{
		//should we check for other condition
	}


}catch(err){

}
},
strGoogleApiKey:'AIzaSyDdyCfOh01lTral1FJ9B3V_ti8mAtfCgDA',
htmlProductFeatureProductDetailsTemplate_b:'<div class="productInfoPanel" id="productInformationResults"> <div class="productDisplay"> <div class="stockProductImage"> <img src="{{{dataProduct.image}}}"/> </div> <div class="stockProductInfo"> <div class="stockProductName"> <strong> {{{dataProduct.name}}} </strong> </div> {{#IFNOTEmpty dataProduct.style}} <div class="stockProductStyle">Style # {{{dataProduct.style}}}</div> {{/IFNOTEmpty}} </div> </div>',
objConfigGlobalMessage:'3000',
isVariationSelected:'false',
isFindStockInStoreAuto:'false',
thresholdType:'stock_threshold',
sellThroughRateLowStockValue:2,
sellThroughRateSlowStockValue:0,
sellThroughRateLowSlowIndex:9999999,
showNearestStore:'true',
intMessageTimeout:5,
htmlStoreListResultTemplate:'<div id="storeListWrap"> <div class="wrap-sis-options"> <strong>Hide Stores With:</strong><label class="sisNoStock"><div class="sisCheckboxWrap"><input type="checkbox" id="sisUIHideShowNoStockStores" name="sisUIHideShowNoStockStores" value="false" onChange="javascript:stockInStore.showhideNoStockStore(this);"><span class="sisCheckbox"></span></div>{{{ strHideStoresNoStockOptLabel }}}</label><label class="sisNoCC"><div class="sisCheckboxWrap"><input type="checkbox" id="sisUIHideShowNoCCStores" name="sisUIHideShowNoCCStores" value="false" onChange="javascript:stockInStore.showhideNoStockStore(this);"><span class="sisCheckbox"></span></div>{{{ strHideStoresNoCncOptLabel }}}</label></div> <div class="sisNoStockMessages"> <div class="sisNoStockNoStoresMessage">{{{ htmlNoStockNoStoresMessageTemplate }}}</div> <div class="sisNoCCNoStoresMessage">{{{ htmlNoCncNoStoresMessageTemplate }}}</div> </div> <div id="storesList"> {{#each dataCache.stores}} <div class="storeDetails {{ isstoreselected this.info.code }}" data-storecode="{{this.info.code}}"> <ul> <li class="hideStore"> <a href="javascript:void(0);" onclick="stockInStore.hideStore(this);" class="hideStoreLink" data-storecode="{{this.info.code}}"> <span class="fal fa-times"></span> </a> </li> <li class="storeHeading"> <strong class="sis-mobile-only">{{this.info.label}}</strong> <strong class="sis-desktop">{{{format this.info.label type="ellipsis" showtitle="false" charcount="32" }}}</strong> </li> {{#if this.info.cnc}} <li class="storeStock" data-stock-value="{{this.info.stock}}" data-stock-cnc-value="{{this.info.cnc.value}}"> {{else}} <li class="storeStock" data-stock-value="{{this.info.stock}}"> {{/if}} {{#IFEMPTY this.info.fis.action}} <strong class="{{this.info.fis.class}}">{{{this.info.fis.label }}}</strong> {{else}} {{#IFE this.info.fis.action \'phone\'}} <a class="{{this.info.fis.class}} storeTel" href="tel:{{removeBlanks this.info.phone}}" onclick="stockInStore.sendLinkEvents(this, \'Stores - Telephone\');" data-storecode="{{this.info.code}}" data-indicator-label="{{this.info.fis.label}}" data-indicator-action="{{this.info.fis.action}}"> {{{this.info.fis.label}}}</a> {{/IFE}} {{/IFEMPTY}} </li> <li class="storeDistance{{#IFE ../showMapIcon \'true\'}} hasMapIcon{{/IFE}}"> {{#IFDEVICEMATCH \'CriOS\'}} <a href="{{{formatlink this maptype=\'applemap\'}}}" onclick="stockInStore.sendLinkEvents(this, \'Stores - View Map{{#IFE ../showMapIcon \'true\'}} (Icon){{/IFE}}\');" data-storecode="{{this.info.code}}"> {{else}} <a target="_blank" href="{{{formatlink this maptype=\'applemap\'}}}" onclick="stockInStore.sendLinkEvents(this, \'Stores - View Map{{#IFE ../showMapIcon \'true\'}} (Icon){{/IFE}}\');" data-storecode="{{this.info.code}}"> {{/IFDEVICEMATCH }}<span class="fas fa-map-marker"></span>View Map{{#IFE ../showMapIcon \'true\'}}<div class="sisMapIcon"></div>{{/IFE}}<small>{{format this.distance type="float" fixed="1"}} {{../dataCache.metricSearch}} away</small> </a> </li> <li class="storeAddress"> <a class="storeAddressIcon" onclick="stockInStore.showAddress(this);" href="javascript:void(0);" data-storecode="{{this.info.code}}"> <span class="fas fa-building"></span>Store Address </a> <div class="addressDetails"> {{#IFDEVICEMATCH \'CriOS\'}} <a href="{{{formatlink this maptype=\'applemap\'}}}" onclick="stockInStore.sendLinkEvents(this,\'Stores - View Map (Address)\');" data-storecode="{{this.info.code}}"> {{else}} <a target="_blank" href="{{{formatlink this maptype=\'applemap\'}}}" onclick="stockInStore.sendLinkEvents(this,\'Stores - View Map (Address)\');" data-storecode="{{this.info.code}}"> {{/IFDEVICEMATCH }} {{#each this.info.address_lines}} {{this}} <br/> {{/each}} {{this.info.city}} {{this.info.state}} {{this.info.postcode}}<br> {{this.info.country}} </a> </div> </li> <li class="storeContact"> {{#IFNOTEmpty this.info.phone}} <div class="contactLine"> <a class="storeTel" href="tel:{{removeBlanks this.info.phone}}" onclick="stockInStore.sendLinkEvents(this, \'Stores - Telephone\');" data-storecode="{{this.info.code}}"> <span class="fas fa-phone fa-flip-horizontal"></span>{{this.info.phone}} </a> </div> {{/IFNOTEmpty}} {{#IFNOTEmpty this.info.email}} <div class="contactLine"><a href="javascript:void(0);" onclick="stockInStore.emailStore(\'{{this.info.code}}\',\'{{this.info.email}}\',\'{{../strClientName}}\',\'{{escape this.info.label}}\',\'{{../dataIdentifiers.product}}\',\'\');"> <span class="fas fa-envelope"></span>Email Us</a> </div> {{/IFNOTEmpty}} <div class="contactLine"> <a class="storeHours" onclick="stockInStore.showHours(this);" href="javascript:void(0);" data-storecode="{{this.info.code}}"> <span class="far fa-clock"></span>Trading Hours <span class="tradingHoursStatus {{this.info.store_trading_status.class}}">{{this.info.store_trading_status.alias}}</span> </a> <div class="openHours"> {{{format this.info.trading_hours_json type="jsontradinghours" linecount="3"}}} <span class="fas caret-down"></span> </div> </div> </li> {{#IFE ../showStockLastUpdatedByStore \'true\'}} {{#IFE ../enableSISCNC \'true\'}} {{#IFE ../enableSISCNCProductPage \'true\'}} {{> fbhtmlCnCStoreListingSectionTemplate }} {{/IFE}} {{/IFE}} {{#IFNOTEmpty this.info.lastUpdateTime}} <li class="storeUpdated"><strong>Updated: </strong> {{format this.info.lastUpdateTime type="datelastimport" datestrformat="local"}} </li> {{/IFNOTEmpty}} {{/IFE}} </ul> </div> {{/each}} </div> </div>',
showStockLastUpdatedByStore:'true',
buttonImageDesktop:'',
buttonImageDesktopHover:'',
buttonImageMobile:'',
buttonImageMobileHover:'',
strWidgetElementText:'Check Store Stock',
strWidgetElementTextMobile:'',
useSisShowQueryString:'false',
showOnlyNearestStore:'true',
htmlNoStoreFoundTemplate:'<span>We couldn\'t find a store within {{radiusSearch}}{{metricSearch}}. Your nearest store is below. To find other stores update your search or shop online.</span>',
htmlNoStoreFoundTemplateBlock:'<span>We couldn\'t find a store within {{radiusSearch}}{{metricSearch}}. To find other stores update your search or shop online.</span>',
showStockLastUpdatedBySite:'false',
showSisButton:'true',
fnAddToBasket:function(e,settings,callback){
try{

var postdata = {};
	postdata.productid = settings.dataIdentifiers.product;
        postdata.variationid= settings.dataIdentifiers.variation;
	postdata.ecomproductid = "";

var checkSizeVariation = jQuery("#attribute406").is(":visible")

if(checkSizeVariation){
	var getSISSizeSelection = jQuery("#productVariations .sisvar_1").val();
	
	//First we check if this size is available online
	var isFoundSize = false;
	
	jQuery("#attribute406 option").each(function(){
		if(jQuery(this).text() == getSISSizeSelection){
			isFoundSize = true;
			jQuery(this).prop("selected",true)
		}
	})
	
	if(isFoundSize){
                               jQuery("#attribute406").trigger("change")
				jQuery("#qty").val(1);
                               setTimeout(function(){
				jQuery("#product_addtocart_form").trigger("submit")	},1500)
                               var _THIS= this;
				 setTimeout(function(){
					if(callback != null) return callback.call(_THIS,postdata,true);
				},1000)

				
	}
	
}else{
                              jQuery("#qty").val(1);
                               setTimeout(function(){
				jQuery("#product_addtocart_form").trigger("submit")	},1500)

                               var _THIS= this;
				 setTimeout(function(){
					if(callback != null) return callback.call(_THIS,postdata,true);
				},1000)

}


}catch(err){
	if(callback != null) return callback.call(this,true);
}
},
enableAddToBasket:'false',
strAddToBasketBtnText:'Add To Bag',
htmlCanvasTemplate:'<div class="mainTemplate"> <div id="clientLogo"> {{#IFNOTEmpty siteLogo}} <img src="{{clientMediaURL}}{{siteLogo}}"/> {{else}} {{/IFNOTEmpty}} </div> <div id="promotionArea"> {{#IFNOTEmpty promotionBannerImage1}} {{> fbhtmlPromotionBannerTemplate}} {{else}} {{/IFNOTEmpty}} </div> <div id="productFeature"> {{> fbhtmlProductFeatureProductDetailsTemplate}} <div id="productFeatureControls"> {{> fbhtmlProductFeatureControlTemplate}} </div> </div> <div id="productSelection"> <div class="productSearchWrap"> <div id="productVariations"> {{> fbhtmlProductVariationTemplate}} </div> <div id="searchLocation"> {{> fbhtmlSearchLocationTemplate}} </div> <div id="searchRadius"> {{> fbhtmlSearchRadiusTemplate}} </div> <div id="searchControls"> {{> fbhtmlSearchControlsTemplate}} </div> </div> </div> <div id="storeList"> <div id="storeListNavigation"> {{> fbhtmlStoreListNavigationTemplate}} </div> <div id="storeListResult"> {{> fbhtmlStoreListResultOnLoadTemplate}} </div> </div> <div id="footerText"> <div class="poweredBy">Powered by <a onclick="stockInStore.sendLinkEvents(this,\'Footer Logo Link\');" target="_blank" href="http://stockinstore.com?utm_source=widget&utm_medium=referral&utm_campaign={{strClientName}}" title="Find In Store solution by stockinstore"><svg version="1.1" id="stockinstore-footer-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 717.2 140.6" style="enable-background:new 0 0 717.2 140.6;" xml:space="preserve"><g><g><path d="M140.7,88.2c-1.5-1.3-3.2-2.3-5.2-3.1c-2-0.8-4.2-1.5-6.4-2c-1.2-0.2-2.6-0.5-4.2-0.8c-1.7-0.3-3.2-0.8-4.7-1.4c-1.5-0.6-2.7-1.5-3.8-2.5c-1.1-1-1.6-2.4-1.6-4c0-2,0.9-3.6,2.8-4.7c1.8-1.1,4-1.6,6.6-1.6c2.7,0,4.9,0.5,6.8,1.6c1.6,0.9,3,2,4.2,3.4c0.3,0.3,0.8,0.4,1.1,0.1l7-5.3c0.4-0.3,0.4-0.8,0.2-1.1c-2-3-4.6-5.1-7.8-6.4c-3.5-1.4-7.1-2.1-10.9-2.1c-2.6,0-5.2,0.4-7.7,1.1c-2.6,0.7-4.8,1.8-6.8,3.2c-2,1.4-3.6,3.2-4.8,5.4c-1.2,2.2-1.8,4.7-1.8,7.6c0,2.7,0.5,4.9,1.4,6.7c0.9,1.8,2.2,3.3,3.8,4.5c1.6,1.2,3.4,2.1,5.4,2.8c2,0.7,4.2,1.3,6.5,1.9c1.2,0.2,2.5,0.5,4.1,0.9c1.5,0.4,3,0.8,4.4,1.4c1.4,0.6,2.6,1.4,3.5,2.4c1,1,1.5,2.3,1.5,3.9c0,1.2-0.3,2.2-1,3.1c-0.7,0.9-1.5,1.7-2.6,2.2c-1.1,0.6-2.3,1-3.7,1.3c-1.4,0.3-2.7,0.4-4.1,0.4c-3.1,0-5.7-0.7-7.8-2c-1.9-1.2-3.7-2.6-5.3-4.1c-0.3-0.3-0.8-0.3-1.1,0l-6.8,5.6c-0.3,0.3-0.4,0.8-0.1,1.2c2.6,3.4,5.6,5.8,8.9,7.1c3.5,1.4,7.6,2.1,12.2,2.1c2.8,0,5.5-0.3,8.2-0.9c2.7-0.6,5.1-1.7,7.3-3.1c2.1-1.4,3.9-3.2,5.2-5.5c1.3-2.2,2-4.9,2-8.1c0-2.6-0.4-4.8-1.2-6.6C143.3,91,142.1,89.5,140.7,88.2z"></path><path d="M492.4,88.2c-1.5-1.3-3.2-2.3-5.2-3.1c-2-0.8-4.2-1.5-6.4-2c-1.2-0.2-2.6-0.5-4.2-0.8c-1.7-0.3-3.2-0.8-4.7-1.4c-1.5-0.6-2.7-1.5-3.8-2.5c-1.1-1-1.6-2.4-1.6-4c0-2,0.9-3.6,2.8-4.7c1.8-1.1,4-1.6,6.6-1.6c2.7,0,4.9,0.5,6.8,1.6c1.6,0.9,3,2,4.2,3.4c0.3,0.3,0.8,0.4,1.1,0.1l7-5.3c0.4-0.3,0.4-0.8,0.2-1.1c-2-3-4.6-5.1-7.8-6.4c-3.5-1.4-7.1-2.1-10.9-2.1c-2.6,0-5.2,0.4-7.7,1.1c-2.6,0.7-4.8,1.8-6.8,3.2s-3.6,3.2-4.8,5.4c-1.2,2.2-1.8,4.7-1.8,7.6c0,2.7,0.5,4.9,1.4,6.7c0.9,1.8,2.2,3.3,3.8,4.5c1.6,1.2,3.4,2.1,5.4,2.8c2,0.7,4.2,1.3,6.5,1.9c1.2,0.2,2.5,0.5,4.1,0.9c1.5,0.4,3,0.8,4.4,1.4c1.4,0.6,2.6,1.4,3.5,2.4c1,1,1.5,2.3,1.5,3.9c0,1.2-0.3,2.2-1,3.1c-0.7,0.9-1.5,1.7-2.6,2.2c-1.1,0.6-2.3,1-3.7,1.3c-1.4,0.3-2.7,0.4-4.1,0.4c-3.1,0-5.7-0.7-7.8-2c-1.9-1.2-3.7-2.6-5.3-4.1c-0.3-0.3-0.8-0.3-1.1,0l-6.8,5.6c-0.3,0.3-0.4,0.8-0.1,1.2c2.6,3.4,5.6,5.8,8.9,7.1c3.5,1.4,7.6,2.1,12.2,2.1c2.8,0,5.5-0.3,8.2-0.9c2.7-0.6,5.1-1.7,7.3-3.1s3.9-3.2,5.2-5.5c1.3-2.2,2-4.9,2-8.1c0-2.6-0.4-4.8-1.2-6.6C495,91,493.9,89.5,492.4,88.2z"></path><path d="M381.4,57.7h-10.6c-0.5,0-1,0.4-1,1V116c0,0.5,0.4,1,1,1h10.6c0.5,0,1-0.4,1-1V58.7C382.4,58.2,382,57.7,381.4,57.7z"></path><path d="M219.9,57.9c-16.4,0-29.7,13.3-29.7,29.7c0,16.4,13.3,29.7,29.7,29.7c16.4,0,29.7-13.3,29.7-29.7C249.6,71.2,236.3,57.9,219.9,57.9z M219.9,106.1c-10.2,0-18.5-8.3-18.5-18.5s8.3-18.5,18.5-18.5c10.2,0,18.5,8.3,18.5,18.5C238.4,97.8,230.1,106.1,219.9,106.1z"></path><path d="M299.9,100.7c-0.5-0.5-1.3-0.5-1.8,0c-7.2,7.2-18.9,7.2-26.1,0c-3.5-3.5-5.4-8.1-5.4-13.1c0-4.9,1.9-9.6,5.4-13.1c7.2-7.2,18.9-7.2,26.1,0c0.5,0.5,1.3,0.5,1.8,0l6.2-6.2c0.5-0.5,0.5-1.3,0-1.8c-5.6-5.6-13.1-8.7-21-8.7c-7.9,0-15.4,3.1-21,8.7c-5.6,5.6-8.7,13.1-8.7,21c0,7.9,3.1,15.4,8.7,21c5.6,5.6,13.1,8.7,21,8.7s15.4-3.1,21-8.7c0.5-0.5,0.5-1.3,0-1.8L299.9,100.7z"></path><path d="M183,105.9c-6.1,0-11.1-5-11.1-11.1l-0.1-25.5h11.1c0.5,0,1-0.4,1-1v-9.1c0-0.5-0.4-1-1-1h-11.1V42.8c0-0.5-0.4-1-1-1h-9.1c-0.5,0-1,0.4-1,1v15.4h-9.9c-0.5,0-1,0.4-1,1v9.1c0,0.5,0.4,1,1,1h9.9l0.1,25.5c0,12.2,9.9,22.2,22.2,22.2c0.5,0,1-0.4,1-1v-9.1C183.9,106.4,183.5,105.9,183,105.9z"></path><path d="M339.7,86.3l19.2-25.6c0.2-0.3,0.3-0.7,0.1-1c-0.2-0.3-0.5-0.5-0.9-0.5h-11.6c-0.3,0-0.6,0.1-0.8,0.4l-16.1,21.8h-3.4V42.8c0-0.5-0.4-1-1-1H315c-0.5,0-1,0.4-1,1V116c0,0.5,0.4,1,1,1h10.2c0.5,0,1-0.4,1-1V91.9h3.6l15.8,24.7c0.2,0.3,0.5,0.5,0.8,0.5h11.9c0.4,0,0.7-0.2,0.9-0.5c0.2-0.3,0.2-0.7,0-1L339.7,86.3z"></path><path d="M418.8,57.8c-13.8,0.5-24.5,12.3-24.5,26.1v32.3c0,0.5,0.4,0.9,0.9,0.9h10.6c0.5,0,0.9-0.4,0.9-0.9V83.7c0-7,5.2-13,12.2-13.5c7.6-0.5,14,5.5,14,13v32.9c0,0.5,0.4,0.9,0.9,0.9h10.6c0.5,0,0.9-0.4,0.9-0.9V83.2C445.2,68.9,433.3,57.2,418.8,57.8z"></path><path d="M636.5,58.3c-0.2-0.2-0.6-0.3-0.9-0.3c-13.4,1-23.9,12.6-23.9,26.4v31.4c0,0.7,0.5,1.2,1.2,1.2h10.6c0.7,0,1.2-0.5,1.2-1.2V84.2c0-6.6,4.8-12.3,11.1-13.1c0.6-0.1,1.1-0.6,1.1-1.2l-0.1-10.7C636.9,58.9,636.8,58.5,636.5,58.3z"></path><path d="M674.8,58c-7.8-0.9-14.7,1.1-21,6.1c-6.2,4.9-10.2,12.2-11.1,19.9c-1.7,15.3,8.7,29.5,23.7,32.5c1.9,0.4,3.8,0.6,5.8,0.6c5.4,0,10.8-1.5,15.4-4.2c1.6-1,3.1-2.1,4.5-3.4c0.1-0.1,0.2-0.2,0.3-0.3c0.7-0.6,1.6-1.3,0.7-2.4c-0.8-1-1.8-1.9-2.7-2.8c-0.5-0.4-0.9-0.9-1.4-1.3c-0.2-0.2-0.4-0.4-0.6-0.6c-0.4-0.4-0.8-0.8-1.2-1.2c-1-0.9-1.7-0.1-2.3,0.4c-0.1,0.1-0.3,0.3-0.4,0.4c-2.8,2.3-6.1,3.8-9.7,4.3c-7.7,1-15.5-2.9-19.2-9.7c-0.9-1.6-1.5-3.2-1.9-4.9h35.2c2.5,0,8.4,0,8.6-4.1l0.1-2v0c0-7.1-2-12.9-6.2-18.3C687.3,62,681.4,58.7,674.8,58z M653.9,82.2c1.6-5.7,5.9-10.5,11.3-12.6c6.3-2.5,11.9-1.3,17.1,3.5c2.7,2.5,4.3,5.7,4.5,9.1H653.9z"></path><circle cx="376.1" cy="41.9" r="7"></circle><path d="M572.6,57.7c-16.4,0-29.7,13.3-29.7,29.7s13.3,29.7,29.7,29.7c16.4,0,29.7-13.3,29.7-29.7S589,57.7,572.6,57.7z M572.6,105.9c-10.2,0-18.5-8.3-18.5-18.5S562.4,69,572.6,69c10.2,0,18.5,8.3,18.5,18.5C591.1,97.6,582.8,105.9,572.6,105.9z"></path><path d="M535.7,105.8c-6.1,0-11.1-5-11.1-11.1l-0.1-25.5h11.1c0.5,0,1-0.4,1-1V59c0-0.5-0.4-1-1-1h-11.1V42.7c0-0.5-0.4-1-1-1h-9.1c-0.5,0-1,0.4-1,1v15.4h-9.9c-0.5,0-1,0.4-1,1v9.1c0,0.5,0.4,1,1,1h9.9l0.1,25.5c0,12.2,9.9,22.2,22.2,22.2c0.5,0,1-0.4,1-1v-9.1C536.6,106.2,536.2,105.8,535.7,105.8z"></path><g><path d="M709.2,60.1c0,3-2.4,5.3-5.4,5.3c-3,0-5.4-2.4-5.4-5.3c0-3,2.4-5.3,5.5-5.3C706.8,54.8,709.2,57.1,709.2,60.1z M699.7,60.1c0,2.4,1.8,4.2,4.1,4.2c2.3,0,4-1.9,4-4.2c0-2.4-1.7-4.3-4.1-4.3C701.5,55.9,699.7,57.8,699.7,60.1z M703,62.8h-1.2v-5.3c0.5-0.1,1.2-0.2,2-0.2c1,0,1.4,0.2,1.8,0.4c0.3,0.2,0.5,0.6,0.5,1.1c0,0.6-0.5,1.1-1.1,1.3v0.1c0.5,0.2,0.8,0.6,0.9,1.3c0.2,0.8,0.3,1.1,0.4,1.3H705c-0.2-0.2-0.3-0.6-0.4-1.3c-0.1-0.5-0.4-0.8-1.1-0.8H703V62.8z M703,59.9h0.6c0.7,0,1.2-0.2,1.2-0.8c0-0.5-0.4-0.8-1.1-0.8c-0.3,0-0.5,0-0.7,0.1V59.9z"></path></g></g><g><path d="M37.7,42.8c10.4,0,18.8-8.2,18.8-18.4S48,6.1,37.7,6.1c-10.4,0-18.8,8.2-18.8,18.4C18.9,34.6,27.3,42.8,37.7,42.8z M37.7,16.8c4.3,0,7.8,3.4,7.8,7.6c0,4.2-3.5,7.6-7.8,7.6s-7.8-3.4-7.8-7.6C29.9,20.2,33.4,16.8,37.7,16.8z"></path><path d="M68.5,83c0-21.7-17.1-33-31.9-33S5.6,62.7,5.6,83c0,21.1,21.5,42.5,28,48.5c0.6,0.7,1.2,1.2,1.7,1.6c0.1,0.1,0.1,0.1,0.1,0.1h0c0.7,0.5,1.3,0.8,1.7,0.8c0.4,0,0.9-0.3,1.4-0.8h0c0,0,0.1-0.1,0.3-0.3c0.3-0.3,0.6-0.5,0.9-0.9h0C45.4,126.4,68.5,102.1,68.5,83z M17,81.9C17,67.1,31,61.7,36.8,61.7s20.1,4.1,20.1,20.1s-19.8,36.5-19.8,36.5S17,97.8,17,81.9z"></path></g></g></svg></a> </div> {{#IFE showStockLastUpdatedBySite \'true\'}} <div class="lastUpdated"> <strong>Last Updated:</strong> {{format dataCache.storeConfig.stock_updated_at type="datelastimport" datestrformat="DDDD, ddd MMMM yyyy"}} </div> {{/IFE}} <div id="mobileSearch"> {{#IFE showStockLastUpdatedBySite \'true\'}} <div class="lastUpdated"> <strong>Last Updated:</strong> {{format dataCache.storeConfig.stock_updated_at type="datelastimport" datestrformat="DDDD, ddd MMMM yyyy"}} </div> {{/IFE}} <button class="uiShowProductSelectionBtn" type="button" onclick="stockInStore.showProductSelection(this,\'#productSelection\');">Update Search</button> <button class="uiViewBagItemsBtn sis-mobile-only" type="button" onclick="stockInStore.viewBagItems(this);">View Bag</button> <button class="uiCloseBagItemsBtn sis-mobile-only" type="button" onclick="stockInStore.closeBagItems(this);">Close Bag</button> {{#IFE enableAddToBasket \'true\'}} {{#IFE hideAddToBasket \'false\'}} <button class="uiAddProductSelectionBtn" type="button" onclick="stockInStore.addToBasket(this);">{{strAddToBasketBtnText}}</button> {{else}} <div style="display:none;"><button class="uiAddProductSelectionBtn" type="button" onclick="stockInStore.addToBasket(this);">{{strAddToBasketBtnText}}</button></div> {{/IFE}} {{/IFE}} </div> </div> <div id="globalSisMessage" class=""></div> <div id="processingSisMessage" class="hideElement"><div class="processingMessageWrap"> {{{objConfigPreLoaders.general}}} Adding item to your bag</div></div> </div>',
updateSearchBtnLabel:'Update Search',
searchBtnLabel:'Check Stock Near Me',
cancelBtnLabel:'Cancel',
htmlStoreListResultOnLoadTemplate:'<div id="clientPromo"> {{#IFNOTEmpty promotionTileImage1}} {{> fbhtmlPromotionTileTemplate}} {{else}} <div class="findItemMessage"> <strong>How To Find Your Item In Store</strong> <p>We need a bit more detail to show you this item\'s availability at a store near you.</p> <p>Please complete all fields and then click the "{{searchBtnLabel}}" button.</p> </div> {{/IFNOTEmpty}} </div>',
htmlStoreListNavigationTemplate:'<div id="storeNavigation" class="disableNavigation"> <a href="javascript:void(0);" onclick="stockInStore.prevStore(this);" id="moreStoresPrevBtn"> <span class="fas fa-caret-left"></span> </a> <a href="javascript:void(0);" onclick="stockInStore.nextStore(this);" id="moreStoresNextBtn"> <span class="fas fa-caret-right"></span> </a> </div>',
htmlSearchControlsTemplate:'<div class="searchControlswrap"> <div class="buttonWrap"> <button id="uiCancelSearchBtn" type="button" class="uiCancelSearchBtn" onclick="stockInStore.hideProductSelection(this,\'#productSelection\');">{{cancelBtnLabel}}</button> </div> <div class="buttonWrap"> <button id="uiSearchGoBtn" type="button" class="uiSearchGoBtn" onclick="stockInStore.findNearestStores(this);">{{searchBtnLabel}}</button> </div> </div>',
htmlSearchRadiusTemplate:'<div class="radiusWrap"> <label class="labelWrap" for="uiRadiusSel">{{objConfigRadius.label}}</label> <div class="uiRangeWrap"> <div class="selectWrap"> <select id="uiRadiusSel" class="uiRadiusSel" onchange="stockInStore.updateRadius(this);"> {{#each objConfigRadius.list}} {{#IFRadiusEqualsToDefault this.value}} <option selected="selected" value="{{this.value}}">{{this.label}}</option> {{else}} <option value="{{this.value}}">{{this.label}}</option> {{/IFRadiusEqualsToDefault}} {{/each}} </select> </div> <div class="selectWrap"> <select id="uiMetricSel" class="uiMetricSel" onchange="stockInStore.updateMetric(this);"> <option selected="selected" value="km">km</option> <option value="mi">mi</option> </select> </div> </div> </div>',
htmlSearchLocationTemplate:'<strong class="sectionTitle">Location</strong> <div class="searchLocationWrap"> {{> fbhtmlSearchCountriesTemplate}} <div class="inputWrap"> <input id="uiLocationInp" onfocus="stockInStore.resetGeolocationField(this);" type="text" placeholder="Suburb or Postcode" class="uiLocationInp"></input> </div> <div class="locationError hideElement">Select another country. No stores found in <span class="detectedCountry"></span></div> <div class="buttonWrap"> <button id="uiCurrentLocationBtn" type="button" class="uiCurrentLocationBtn" onclick="stockInStore.getCurrentGeolocation(this);"> <span class=\'fal fa-crosshairs\'></span> </button> </div> </div>',
htmlProductVariationTemplate:'<strong class="sectionTitle" style="display:none !important;">Product Options</strong> <div class="variationWrapper"> {{#each dataVariations.arrayVariationInfo}} <select class="sisvar sisvar_{{this.variationIndex}}" data-index="{{this.variationIndex}}" onchange="javascript:stockInStore.changeVariation(this,{{this.variationIndex}});"> <option value="">Select {{this.variationLabels}}</option> {{#each this.variationValues}} <option value="{{this}}">{{{this}}}</option> {{/each}} </select> {{/each}} </div>',
htmlProductFeatureProductVariationsTemplate:'<div class="stockVariationProductInfo"> <ul> {{#each dataVariations.arrayVariationInfo}} <li id="display_varlabel_{{this.variationIndex}}">{{this.variationLabels}}: <span class="display_varvalue_{{this.variationIndex}}"></span></li> {{/each}} </ul> </div> {{#IFE enableSISCNC \'true\'}} {{#IFE enableSISCNCProductPage \'true\'}} <span class="sis-cc-preferred-store sis-cc-store-info {{#IFEMPTY dataStore.selectedStore.label}} hideElement{{/IFEMPTY}}"><ul><li><strong>Click & Collect Store:</strong><span class="sis-cc-store-name">{{ dataStore.selectedStore.label }}</span></li></ul></span> {{/IFE}} {{/IFE}}',
htmlProductFeatureControlTemplate:'<div class="showProductSelection"> <div class="buttonWrap"> <button class="uiShowProductSelectionBtn" type="button" onclick="stockInStore.showProductSelection(this,\'#productSelection\');">{{updateSearchBtnLabel}}</button> {{#IFE enableAddToBasket \'true\'}} {{#IFE hideAddToBasket \'false\'}} <button class="uiAddProductSelectionBtn" type="button" onclick="stockInStore.addToBasket(this);">{{strAddToBasketBtnText}}</button> {{else}} <div style="display:none;"><button class="uiAddProductSelectionBtn" type="button" onclick="stockInStore.addToBasket(this);">{{strAddToBasketBtnText}}</button></div> {{/IFE}} {{/IFE}} </div> </div>',
htmlProductFeatureProductDetailsTemplate:'<div class="productInfoPanel" id="productInformationResults"> <div class="productDisplay"> <div class="stockProductImage"> <img src="{{{dataProduct.image}}}"/> </div> <div class="stockProductInfo"> <div class="stockProductName"> <strong> {{{dataProduct.name}}} </strong> </div> {{#IFNOTEmpty dataProduct.style}} <div class="stockProductStyle">Style # {{{dataProduct.style}}}</div> {{/IFNOTEmpty}} </div> {{> fbhtmlProductFeatureProductVariationsTemplate}} </div> </div>',
isLocationAutoPopulated:'false',
showStockLastUpdatedByStoreIfNull:'true',
replaceUPILastUpdatedByStore:'true',
fnshowSisButtonWithCondition:function(settings,callback){
var showbutton = true;


if(stockInStoreGlobal.querySelect(".product.alert.stock").length>=1 || stockInStoreGlobal.querySelect(".buyonlineonly").length >=1 || stockInStoreGlobal.querySelect(".product-info-stock-sku .stock.unavailable").length >=1){
showbutton = false;

}

if(callback != null) return callback.call(this,showbutton);
},
isTradingTwentyFourHours:'false',
isTradingAmPmToUpperCase:'false',
strGoogleUAAccount:'UA-1932498-1',
isPageViewTracked:'false',
handlebarRequirePath:'//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.3/handlebars.min',
hideAddToBasket:'false',
fnOnDisplayWidget:function(settings){
try{
	var checkSizeVariation = jQuery("#attribute406").is(":visible")

	if(checkSizeVariation){
			var getSISSizeSelection = jQuery("#productVariations .sisvar_1").val();
			
			//First we check if this size is available online
			var isFoundSize = false;
			
			jQuery("#attribute406 option").each(function(){
				if(jQuery(this).text() == getSISSizeSelection){
					isFoundSize = true;
				}
			})
			
			if(isFoundSize){
					document.querySelectorAll(".uiAddProductSelectionBtn")[0].disabled = false;
					document.querySelectorAll(".uiAddProductSelectionBtn")[1].disabled = false;
			}else{
				document.querySelectorAll(".uiAddProductSelectionBtn")[0].disabled = true;
				document.querySelectorAll(".uiAddProductSelectionBtn")[1].disabled = true;
			}
	}else{
		//should we check for other condition
	}


}catch(err){

}
},
fnOnCompleteAddToBasket:function(settings){

},
fnOnUpdateRadius:function(settings,e){

},
fnOnCancelSearch:function(settings,e){

},
fnOnSearchStores:function(settings,e){

},
fnOnDisplayStores:function(settings,e){

},
fnOnUpdateSearch:function(settings,e){

},
fnOnDisplayNoStores:function(settings){

},
fnOnHideStore:function(settings,e){

},
fnOnShowStoreAddress:function(settings,e){

},
fnOnHideStoreAddress:function(settings,e){

},
fnOnShowStoreHours:function(settings,e){

},
fnOnHideStoreHours:function(settings,e){

},
fnOnHideWidget:function(settings){

},
fnOnShowSISButton:function(settings,e){

},
strBrandName:'99 Bikes',
showMapIcon:'true',
limitStoresToCallingCountry:'false',
htmlSearchCountriesTemplate:'<div id="searchCountriesWrap" class=""> <div onclick=" stockInStore.hideCountriesSelection();" class="overlay-countries-list"></div> <a id="uiStoreCountrySel" onclick="stockInStore.showCountriesSelection(this);"><span class="sis-flag noflag"></span></a> <div id="uiStoreCountriesList"> <ul> {{#each dataCache.storesCountries}} <li><a data-country-name="{{this.name}}" data-country-code="{{this.code}}" onclick="stockInStore.updateStoreCountries(this);"><span class="sis-flag {{ lowerCase this.code }}"></span><span class="sis-flag-name">{{ this.name }}</span></a></li> {{/each}} </ul> </div> </div>',
useLocationAutoComplete:'false',
enableSISCNCProductPage:'false',
enableSISCNC:'false',
htmlClickCollectIndicatorTemplate:'<a href="javascript:void(0);" onclick="stockInStore.checkCncStockInStore(this);"> <div class="sis-cc-wrap"> <div class="sis-cc-body"> <span class="sis-cc-header"> <span class="sis-cc-status default"><i class="far fa-map-marker-alt"></i></span> <span class="sis-cc-status available hideElement"><i class="fas fa-map-marker-check"></i></span> <span class="sis-cc-status notavailable hideElement"><i class="fas fa-map-marker-times"></i></span> <strong>CLICK & COLLECT</strong> </span> <div class="sis-cc-preferred-store hideElement"> <span class="sis-cc-store-info">Selected store: <span class="sis-cc-store-name">{{ dataStore.selectedStore.label }}</span>.</span> <span class="sis-cc-link">Change store.</span> </div> <div class="sis-cc-unselected-store hideElement" > No store selected. <span class="sis-cc-link">Select store.</span> </div> </div> </div> </a>',
htmlCnCStoreListingSectionTemplate:'{{#if this.info.cnc}} <li class="storeSelect"> <strong class="storeSelectTitle">CLICK & COLLECT</strong> <span class="cncLabel {{this.info.cnc.class}}">{{this.info.cnc.label}}</span> {{#if this.info.cnc.available}} <div class="storeSelectBtn" onclick="stockInStore.selectStore(\'{{this.info.code}}\')"> <span class="selectLabel"><i class="fas fa-circle"></i>Select store</span><span class="selectedLabel"><i class="fas fa-check-circle"></I><strong>Selected store</strong></span></div> {{else}} <div class="storeSelectBtn disabled" onclick="stockInStore.selectStore(\'{{this.info.code}}\')"> <span class="selectLabel"><i class="fas fa-circle"></i>Select store</span><span class="selectedLabel"><i class="fas fa-check-circle"></I><strong>Selected store</strong></span></div> {{/if}} </li> {{/if}}',
ibt:'in-store',
strGoogleAutocompleteTypes:'(regions)',
htmlCnCProductFeatureProductDetailsTemplate:'<a id="bagClose" onclick="stockInStore.closeBagItems(this);" href="javascript:void(0);"><span class="fal fa-times"></span></a> <strong class="productBagTitle">YOUR BAG <span class="productBagTotalWrap">(<span class="productBagTotal">{{ cartItemsTotal dataCache.clickcollect.items}}</span>)</span></strong> <div class="productInfoPanel" id="productInformationResults"> {{#each dataCache.clickcollect.items}} <div class="productDisplay"> <div class="stockProductImage"> <img src="{{{this.image}}}"/> </div> <div class="stockProductInfo"> <div class="stockProductName"> <strong> {{{this.name}}} </strong> </div> {{#IFNOTEmpty this.style}} <div class="stockProductStyle">Style # {{{this.style}}}</div> {{/IFNOTEmpty}} </div> <div class="stockVariationProductInfo"> {{{this.variations}}} </div> </div> {{/each}} </div> <span class="sis-cc-preferred-store sis-cc-store-info {{#IFEMPTY dataStore.selectedStore.label}} hideElement{{/IFEMPTY}}"><ul><li class="sis-cc-preferred-store"><strong>Click & Collect Store:</strong><span class="sis-cc-store-name">{{ dataStore.selectedStore.label }}</span></li></ul></span>',
htmlCnCProductFeatureControlTemplate:'<div class="showProductSelection"> <div class="buttonWrap"> <button class="uiShowProductSelectionBtn" type="button" onclick="stockInStore.showProductSelection(this,\'#productSelection\');">{{updateSearchBtnLabel}}</button> </div> </div>',
fnshowCncButtonWithCondition:function(settings,callback){
if(callback != null) return callback.call(this,true);
},
htmlNoClickCollectIndicatorTemplate:'Not Available for Click & Collect',
useCncShowQueryString:'true',
returnAllStoresInStateIfNoPostcode:'true',
enableGoogleLinker:'false',
showHideStoresNoStock:'false',
setHideStoresNoStockDefault:'false',
strHideStoresNoStockOptLabel:'No Stock',
htmlNoStockNoStoresMessageTemplate:'<span>We couldn\'t find a store with stock.</span>',
showHideStoresNoCnc:'false',
setHideStoresNoCncDefault:'false',
strHideStoresNoCncOptLabel:'No Click &amp; Collect',
htmlNoCncNoStoresMessageTemplate:'<span>We couldn\'t find a store available for Click & Collect.</span>',
highlightSelectedStore:'true',
clientMediaURL:'https://assets.stockinstore.net/clients/99bikes/media/',
strClientName:'99bikes',
siteName:'99 Bikes'
};
var newinstanceSIS = stockInStore.activate(activationOptions);