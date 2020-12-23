/*	
	-------------------------------------------------------------------------------------------------------------------------------
	Stock In Store Core Script v1.0.0 

	Overview:
	---------
	Product Page Loads
	-------------------
	1.	Get the Stores Master List for specific site (table:sis_stores) and cache data
	
	Click on Check Stock in Store Button:
	---------------------------------------------------------------------------------------------------------------------------------
	1.	Get Product Identifier (example sku) if one is selected from product page(optional)
		Method can be through page scraping, or Using site API or Implementing site custom code
	2.	Get Variation Identifier (example style code) is selected (compulsory) 
		Method can be through page scraping, or Using site API or Implementing site custom code
	3.	While widget is displayed 
		b.	Get variation data from variation identifier (example style code)
			Method can be Using SIS App API ('/getVariations') or site API
		c. 	Whichever method used to get variation data, massage data so that the structure is the same:
			[{label_variation1:'',label_variation2:'', upi:'', variation_1:'',variation_2:''},{...}]
		d.	Build Interface and display within widget. 
	4. If product identifier is available then default variation selection elements within widget	
	
	Change History:
	---------------------------------------------------------------------------------------------------------------------------------
	23.09.2016	- 	PH Line 294 remove onblur="javascript:stockInStore.fixIOSScroll();"
    02.08.2017	-	SY added image and product url to button clicked stats log
	23.08.2017	- 	PH Added fnshowSisButtonWithCondition which allow to execute JS function
					for specific client wanted to display the SIS button based on some conditions (GENERIC)
	23.08.2017	- 	PH Added showSISButtonOnlyForStates, only shows SIS button for Selected States in the ADMIN.
					Will need a better way to select country/state in the Admin. Currently only Australian States
					Not Fully Implemented. Still need to add comparison to freegeoip call
	24.08.2017	- 	PH Auto populate the location field from freegeoip call
	25.08.2017	- 	PH Added enableReserveInStore & htmlreserveInStoreTemplate assets (full implementation for later)
	08.05.2018	-	PH Added code to prevent multiple Server Request for the Checkstockinstore button and the findinstore button
	10.05.2018	-	PH Added property fnshowSisButtonWithCondition which holds code to be evaluate true/false showing/hiding the 
					SIS Button. 
	
	---------------------------------------------------------------------------------------------------------------------------------
*/

(function (root, factory) {
	if ( typeof define === 'function' && define.amd && false) { //include false to prevent definition
		define([], factory(root));
		
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.stockInStore = factory(root);
	}
})(typeof global != 'undefined' ? global : this.window || this.global, function (root) {

	'use strict'; // Explicitly define variable before use (var x = y)

	var stockInStore = {}; // Object for public APIs
		stockInStore.VERSION = '1.0.0';
		stockInStore.APPLICATIONNAME = 'Stock in Store';
		
	var settings, sisAutocomplete; //google location service autocomplete object;
	var Handlebars = window.Handlebars || null;

	
	
	//We add the non customisable options in the defaults to facilitate referencing within the 
	//template.
				
	// Default settings
	var defaults = {
		//NON Customisable options 
		//Internal local storage use
		appurl:_stockinstore[0].applicationurl,
		clickcollect:{
			buttonid:""
		},
		//internal local storage for selected store
		dataStore:{
			selectedStore:null
		},
		
		dataCache:
		{
			widgetId:'',
			isWidgetDisplayed:null,
			windowPos:null,
			widgetDescription:'',
			widgetType:'product', //default to product (can be storelocator, checkout, category)
			locatingInterval:null,
			storesMasterLocation:null, //Stores master list containing id,country,latitude and longitude
			storesCountries:null, //List of countries with stores
			storeConfig:null, //contains last import data or any other information that will not change for subsequent server call 
			productVariations:null, //raw variation data
			geolocationObj:null, //selected long lat,
			radiusSearch:null, //selected radius
			metricSearch:"km",
			storesUnordered:null, //current store result list (raw data from the getStoresStock)
			stores:null, // stores list,
			searchForm:null,
			storeListingInfo:null,
			risUserData:null,
			storeLocator:{
				stores:null,
				storeListingInfo:null,
				mapInfo:{
					mapObject:null,
					mapMarkersArray:null,
					mapMarkerContentArray:null
				}
			},
			storeLocatorMarkerImage:null,
			clickcollect:{
				cncdata:null,
				items:null,

				requesteditems:{
					ajxreqobject:null,
					store_code:null,
					items:null
				},
				cnccartdata:null
			}
		},
		
		//Internal local storage for product details displayed within widget
		dataProduct:{
			name:'',  
			image:'',
			style:''
		},
		
		//Internal local storage for product and variation identifier
		dataIdentifiers:{
			product:'',
			variation:'',
			isindex:'1'
		},
		
		//Internal local storage for variation data
		dataVariations:
		{
			totalVariations:0,
			arrayVariationInfo:[]
		},
		
		//Preloaders html
		objConfigPreLoaders:{
			general:'<span class="fa fa-spinner fa-pulse"></span>',
			productFeature:'<span class="fa fa-spinner fa-pulse"></span>',
			storeList:'<div id="loadingResults"><span class="fa fa-spinner fa-spin"></span><span class="loadingText">&nbsp;Loading Stores. Please Wait...</span></div>'
		},
		
		//Radius configuration
		objConfigRadius:
		{
			label:'Range (km)',
			defaultValue:'30',
			list:[
						{label:'5',value:'5'},
						{label:'10',value:'10'},
						{label:'20',value:'20'},
						{label:'30',value:'30'},
						{label:'40',value:'40'},						
						{label:'50',value:'50'},					
						{label:'60',value:'60'},					
						{label:'70',value:'70'},																	
						{label:'80',value:'80'}
					]
		},
		intMessageTimeout:3,
		//Geocode Error Message Configuration
		objConfigGeocodeErrorMessagesHTML:{
			permissiondenied:'<div class="geolocationError">'+
								'<strong class="errorHeading">Unable to get your current location</strong>'+
								'<p>Turn on location services or enter your postcode</p>'+
								'<button class="uiShowProductSelectionBtn" type="button"'+
								'onclick="stockInStore.showProductSelection(this,\'#productSelection\');">Back To Search</button>'+
							'</div>',							
			other:			'<div class="geolocationError">'+
								'<strong class="errorHeading">Unable to get your current location</strong>'+
								'<p>Turn on location services or enter your postcode</p>'+
								'<button class="uiShowProductSelectionBtn" type="button"'+
								'onclick="stockInStore.showProductSelection(this,\'#productSelection\');">Back To Search</button>'+
							'</div>',
			notsupported:	'<div class="geolocationError">'+
								'<strong class="errorHeading">Unable to get your current location</strong>'+
								'Your browser does not support this function. Please try a different browser.'+
								'<button class="uiShowProductSelectionBtn" type="button"'+
								'onclick="stockInStore.showProductSelection(this,\'#productSelection\');">Back To Search</button>'+
							'</div>'
		},
		
		//Store single DOM Element within stores result list sliding configuration
		objConfigStoreListContainer:
		{
			storeElemcontainer:{
				width:206,
				moveby:3 //limit 3
			}
		},
		strGoogleApiKey:"AIzaSyBgOlxJPOMW_JRUUBXW_OnphFhCQvagSns",
		strGoogleUAAccount:"",
		strGoogleAutocompleteTypes:"geocode",
		isPageViewTracked:"false",
		enableGoogleLinker:"false",
		//restrictGoogleComponentToLocal:"true",
		enableSISCNCProductPage:"false", //enable click collect on product page
		enableSISCNC:"false", //enable click collect on product page
		isVariationSelected:"false",
		isLocationAutoPopulated:"true",
		useSisShowQueryString:"true",
		useCncShowQueryString:"true",
		showSisButton:"false",
		xmlMapMan:'<span class="sis-icon"><?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "//www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg version="1.1" id="sis-logo-element" xmlns="//www.w3.org/2000/svg" xmlns:xlink="www.w3.org/1999/xlink" x="0px" y="0px"\
	 width="169.893px" height="340.158px" viewBox="0 0 169.893 340.158" enable-background="new 0 0 169.893 340.158"\
	 xml:space="preserve"><g><g><path class="sis-logo-fill-colour" fill="#FFFFFF" d="M87.997,103.203c25.95,0,46.989-20.597,46.989-46.005c0-25.406-21.039-46.004-46.989-46.004\
			c-25.948,0-46.984,20.598-46.984,46.004C41.013,82.606,62.049,103.203,87.997,103.203z M87.998,38.196\
			c10.72,0,19.41,8.508,19.41,19.002c0,10.495-8.69,19.003-19.41,19.003c-10.718,0-19.406-8.508-19.406-19.003\
			C68.592,46.704,77.28,38.196,87.998,38.196z"/><path class="sis-logo-fill-colour" fill="#FFFFFF" d="M165.246,203.747c0-54.419-42.865-82.747-79.765-82.747S7.582,153.056,7.582,203.748\
			c0,52.794,53.854,106.356,70.215,121.41c1.574,1.646,3.054,2.942,4.378,3.919c0.183,0.157,0.287,0.245,0.287,0.245h0.055\
			c1.766,1.251,3.226,1.9,4.165,1.9c1.043,0,2.171-0.714,3.527-1.9h0.048c0,0,0.284-0.268,0.808-0.779\
			c0.678-0.638,1.404-1.36,2.211-2.165l-0.015-0.001C107.225,312.433,165.246,251.619,165.246,203.747z M36.096,201.045\
			c0-36.901,35.222-50.6,49.758-50.6c14.537,0,50.319,10.344,50.319,50.319c0,39.977-49.648,91.335-49.648,91.335\
			S36.096,241.021,36.096,201.045z"/></g></g></svg></span>',
		//isSisButtonHidden:"false",
		isFindStockInStoreAuto:"false",
		enableReserveInStore:"false",
		enableAddToBasket:"false",
		hideAddToBasket:"true",

		showHideStoresNoStock:"false",
		setHideStoresNoStockDefault:"false",
		strHideStoresNoStockOptLabel:"No Stock",
		htmlNoStockNoStoresMessageTemplate:"<span>We couldn't find a store with stock.</span>",
		
		showHideStoresNoCnc:"false",
		setHideStoresNoCncDefault:"false",
		strHideStoresNoCncOptLabel:"No Click &amp; Collect",
		htmlNoCncNoStoresMessageTemplate:"<span>We couldn't find a store available for Click & Collect.</span>",

		showNearestStore:"true",
		returnAllStoresInStateIfNoPostcode:"true",
		showOnlyNearestStore:"true",
		showStockLastUpdatedBySite:"true",
		showStockLastUpdatedByStore:"false",
		strWidgetElementText:"Check Stock In Store",
		strAddToBasketBtnText:"Add To Basket",		
		strWidgetElementTextMobile:"",
		//Check Stock in Store Button
		htmlWidgetElementTemplate:'<a href="javascript:void(0);" id="checkStoreBtn" onclick="stockInStore.checkStockInStore(this);" class="storeStockBtn sisIcon">' + 
									'{{#IFNOTEmpty buttonImageDesktop}}'+
										'{{#IFNOTEmpty buttonImageDesktopHover}}'+
											'<img class="sis-desktop" onmouseout="stockInStore.swapImage(this,\'{{clientMediaURL}}{{buttonImageDesktop}}\');" onmouseover="stockInStore.swapImage(this,\'{{clientMediaURL}}{{buttonImageDesktopHover}}\');"  src="{{clientMediaURL}}{{buttonImageDesktop}}"/>' + 
										'{{else}}' +
											'<img class="sis-desktop" src="{{clientMediaURL}}{{buttonImageDesktop}}"/>' + 
										'{{/IFNOTEmpty}}'+	
									'{{else}}' +
										'<span class="sis-desktop">{{strWidgetElementText}}</span>' + 
									'{{/IFNOTEmpty}}'+
									
									'{{#IFNOTEmpty buttonImageMobile}}'+
										'{{#IFNOTEmpty buttonImageMobileHover}}'+
											'<img class="sis-mobile-only" onmouseout="stockInStore.swapImage(this,\'{{clientMediaURL}}{{buttonImageMobile}}\');" onmouseover="stockInStore.swapImage(this,\'{{clientMediaURL}}{{buttonImageMobileHover}}\');"  src="{{clientMediaURL}}{{buttonImageMobile}}"/>' + 
										'{{else}}' +
											'<img class="sis-mobile-only" src="{{clientMediaURL}}{{buttonImageMobile}}"/>' + 
										'{{/IFNOTEmpty}}'+	
									'{{else}}' +
										'{{#IFNOTEmpty strWidgetElementTextMobile}}'+
											'<span class="sis-mobile-only">{{strWidgetElementTextMobile}}</span>' +
										'{{else}}' +
											'<span class="sis-mobile-only">{{strWidgetElementText}}</span>' +
										'{{/IFNOTEmpty}}'+	
									'{{/IFNOTEmpty}}'+
									'</a>',
		htmlClickCollectIndicatorTemplate:'<span class="sis-cc-status"><i class="fas fa-check"></i></span>Click Collect. <a href="javascript:void(0);" onclick="stockInStore.checkStockInStore(this);">Check Availability</a>',
		htmlNoClickCollectIndicatorTemplate:'Not Available for Click and Collect',
		//Ads Template
		htmlAdsTemplate1:'',	
		htmlAdsTemplate2:'',
		htmlAdsTemplate3:'',
		htmlAdsTemplate4:'',
		
		htmlPromotionTileTemplate:'{{#IFNOTEmpty promotionTileLink1}}'+
										'<a onclick="stockInStore.sendLinkEvents(this,\'Promo Tile\');" href="{{promotionTileLink1}}" target="_blank"><img src={{clientMediaURL}}{{promotionTileImage1}} /></a>' +
									'{{else}}' +
										'{{#IFNOTEmpty promotionTileImage1}}' +
											'<img src={{clientMediaURL}}{{promotionTileImage1}} />' +
										'{{/IFNOTEmpty}}'+
									'{{/IFNOTEmpty}}',
									
		htmlPromotionBannerTemplate:'{{#IFNOTEmpty promotionBannerLink1}}'+
										'<a onclick="stockInStore.sendLinkEvents(this,\'Promo Banner\');" href="{{promotionBannerLink1}}" target="_blank"><img src={{clientMediaURL}}{{promotionBannerImage1}} /></a>' +
									'{{else}}' +
										'{{#IFNOTEmpty promotionBannerImage1}}' +
											'<img src={{clientMediaURL}}{{promotionBannerImage1}} />' +
										'{{/IFNOTEmpty}}'+
									'{{/IFNOTEmpty}}',
		promotionTileImage1:'',
		promotionBannerImage1:'',
		promotionTileLink1:'',
		promotionBannerLink1:'',
		searchBtnLabel:'Find Stock In Store',
		cancelBtnLabel:'Cancel',
		updateSearchBtnLabel:'Update Search',
		buttonImageDesktop:'',
		buttonImageDesktopHover:'',
		buttonImageMobile:'',
		buttonImageMobileHover:'',
		handlebarRequirePath:'//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.3/handlebars.min',
		siteLogo:'',
		strClientName:'',
		strBrandName:'',
		showStoresFilter:'true',
		showMapIcon:'true',
		highlightSelectedStore:'true',
		showMapOption:'false',
		useLocationAutoComplete:'false',
		clientMediaURL:'',
		//Main Canvas
		htmlCanvasTemplate:'<div class="mainTemplate">'+
									
										'<div id="clientLogo">' +
											'{{#IFNOTEmpty siteLogo}}'+
												'<img src="{{clientMediaURL}}{{siteLogo}}"/>'+
											'{{else}}'+
											'{{/IFNOTEmpty}}'+
										'</div>' +
										'<div id="promotionArea">' +
												'{{#IFNOTEmpty promotionBannerImage1}}'+
													'{{> fbhtmlPromotionBannerTemplate}}'+
												'{{else}}'+	
												'{{/IFNOTEmpty}}'+
										'</div>' +
										'<div id="productFeature">'+
											'{{> fbhtmlProductFeatureProductDetailsTemplate}}'+
											'{{> fbhtmlProductFeatureProductVariationsTemplate}}'+
											'<div id="productFeatureControls">'+
												'{{> fbhtmlProductFeatureControlTemplate}}'+
											'</div>'+
										'</div>'+
										'<div id="productSelection">'+
											'<div class="productSearchWrap">' +
												'<div id="productVariations">'+
													'{{> fbhtmlProductVariationTemplate}}'+
												'</div>'+
												'<div id="searchLocation">'+
													'{{> fbhtmlSearchCountriesTemplate}}'+
													'{{> fbhtmlSearchLocationTemplate}}'+
												'</div>'+
												'<div id="searchRadius">'+
													'{{> fbhtmlSearchRadiusTemplate}}'+
												'</div>'+
												'<div id="searchControls">'+
													'{{> fbhtmlSearchControlsTemplate}}'+
												'</div>'+
											'</div>'+
										'</div>'+
										'<div id="storeList">'+
											'<div id="storeListNavigation">'+
												'{{> fbhtmlStoreListNavigationTemplate}}'+
											'</div>'+
											'<div id="storeListResult">'+
												'{{> fbhtmlStoreListResultOnLoadTemplate}}'+
											'</div>'+
										'</div>'+
										'<div id="footerText">'+
											'<div class="poweredBy">Powered by '+
												'<a onclick="stockInStore.sendLinkEvents(this,\'Footer Logo Link\');" target="_blank" href="http://stockinstore.com"><strong>Stock In Store</strong></a>'+
											'</div>'+
											'{{#IFE showStockLastUpdatedBySite \'true\'}}'+
												'<div class="lastUpdated">' +
													'<strong>Last Updated:</strong> {{format dataCache.storeConfig.stock_updated_at.date type="datelastimport" datestrformat="DDDD, ddd MMMM yyyy"}}'+
												'</div>' +
											'{{/IFE}}'+
											'<div id="mobileSearch">' +
												'{{#IFE showStockLastUpdatedBySite \'true\'}}'+
													'<div class="lastUpdated">' +
														'<strong>Last Updated:</strong> {{format dataCache.storeConfig.stock_updated_at.date type="datelastimport" datestrformat="DDDD, ddd MMMM yyyy"}}'+
													'</div>' +
												'{{/IFE}}'+
												'{{#IFE enableAddToBasket \'true\'}}'+
													'<button class="uiAddProductSelectionBtn" type="button" onclick="stockInStore.addToBasket(this);">{{strAddToBasketBtnText}}</button>'+
												'{{/IFE}}'+
												'<button class="uiShowProductSelectionBtn" type="button"'+
													'onclick="stockInStore.showProductSelection(this,\'#productSelection\');">Update Search</button>'+

											'</div>' +
										'</div>'+
										'<div id="globalSisMessage" class=""></div>'+
										'<div id="processingSisMessage" class="hideElement"></div>'+

								'</div>', 
		htmlCnCProductFeatureProductDetailsTemplate:'',	
		//Product Feature Template
		htmlProductFeatureProductDetailsTemplate:'<div class="productInfoPanel" id="productInformationResults">'+
										'<div class="productDisplay">'+
											'<div class="stockProductImage">'+
												'<img src="{{{dataProduct.image}}}"/>'+
											'</div>'+
											'<div class="stockProductInfo">'+
												'<div class="stockProductName">'+
													'<strong>'+
											    		'{{{dataProduct.name}}}'+
            										'</strong>'+
												'</div>'+
												'{{#IFNOTEmpty dataProduct.style}}'+
													'<div class="stockProductStyle">Style # {{{dataProduct.style}}}</div>'+
												'{{/IFNOTEmpty}}'+	
											'</div>'+
										'</div>',
										
		htmlCnCProductFeatureControlTemplate:'',
										//Controls Within product Feature Template
		htmlProductFeatureControlTemplate:'<div class="showProductSelection">'+
											'<div class="buttonWrap">'+
												'{{#IFE enableAddToBasket \'true\'}}'+
													'<button class="uiAddProductSelectionBtn" type="button" onclick="stockInStore.addToBasket(this);">{{strAddToBasketBtnText}}</button>'+
												'{{/IFE}}'+
												'<button class="uiShowProductSelectionBtn" type="button"'+
												'onclick="stockInStore.showProductSelection(this,\'#productSelection\');">Update Search</button>'+
											'</div>'+
										'</div>'+
									'</div>',
		
		//Variation Display only within Product Feature Template
		htmlProductFeatureProductVariationsTemplate:'<div class="stockVariationProductInfo">'+
														'<ul>'+
														'{{#each dataVariations.arrayVariationInfo}}'+
															'<li id="display_varlabel_{{this.variationIndex}}">'+
															'{{this.variationLabels}}: <span class="display_varvalue_{{this.variationIndex}}"></span></li>'+
														'{{/each}}'+
														'</ul>'+
													'</div>',	
		//Variation Selection Template																			
		htmlProductVariationTemplate:	'<div class="variationWrapper">'+
											'{{#each dataVariations.arrayVariationInfo}}'+
												'<select class="sisvar sisvar_{{this.variationIndex}}"'+
														' data-index="{{this.variationIndex}}"'+
														' onchange="javascript:stockInStore.changeVariation(this,{{this.variationIndex}});">'+
														'<option value="">Select {{this.variationLabels}}</option>'+
														'{{#each this.variationValues}}'+
															'<option value="{{this}}">{{{this}}}</option>'+
														'{{/each}}'+
												'</select>'+
											'{{/each}}'+
									   '</div>',
									
		htmlSearchCountriesTemplate:	'<div class="searchCountriesWrap">' +
											'<div class="selectWrap">'+
											'<select id="uiStoreCountriesSel" class="uiStoreCountriesSel"'+
											' onchange="stockInStore.updateStoreCountries(this);">'+
											'{{#each dataCache.storesCountries}}'+
												'<option value="{{this.code}}">{{this.name}}</option>'+
											'{{/each}}'+
											'</select>'+
											'</div>' +
										'</div>',							
		//Search Location Template
		htmlSearchLocationTemplate:'<div class="searchLocationWrap">'+
										'<div class="inputWrap">'+
											'<input id="uiLocationInp" onfocus="stockInStore.resetGeolocationField(this);"'+
											' onblur="stockInStore.validateLocation(this);"'+
											' type="text" placeholder="Town,Suburb,Postcode" class="uiLocationInp"></input>'+
										'</div>'+
										'<div class="buttonWrap">'+
											'<button id="uiCurrentLocationBtn" type="button" class="uiCurrentLocationBtn"'+
											' onclick="stockInStore.getCurrentGeolocation(this);">'+
												'<span class=\'fa fa-crosshairs\'></span>'+
											'</button>'+
										'</div>'+
									'</div>',
									
		//Search Radius Template
		htmlSearchRadiusTemplate:'<div class="radiusWrap">'+
										'<label class="labelWrap" for="uiRadiusSel">{{objConfigRadius.label}}</label>'+
										'<div class="selectWrap">'+
											'<select id="uiRadiusSel" class="uiRadiusSel"'+
											' onchange="stockInStore.updateRadius(this);">'+
											'{{#each objConfigRadius.list}}'+
												'{{#IFRadiusEqualsToDefault this.value}}'+
	 												'<option selected="selected" value="{{this.value}}">{{this.label}}</option>'+
												'{{else}}'+
													'<option value="{{this.value}}">{{this.label}}</option>'+
												'{{/IFRadiusEqualsToDefault}}'+
											'{{/each}}'+
											'</select>'+
										'</div>'+
									'</div>',
									
		//Search Controls Template
		htmlSearchControlsTemplate:'<div class="searchControlswrap">'+
										'<div class="buttonWrap">'+
											'<button id="uiCancelSearchBtn" type="button" class="uiCancelSearchBtn"'+
											' onclick="stockInStore.hideProductSelection(this,\'#productSelection\');">Cancel</button>'+
										'</div>'+
										'<div class="buttonWrap">'+
											'<button id="uiSearchGoBtn" type="button" class="uiSearchGoBtn"'+
											' onclick="stockInStore.findNearestStores(this);">Find Stock in Store</button>'+
										'</div>'+
									'</div>',
		//Store list Navigation for Store List Result Template
		htmlStoreListNavigationTemplate:'<div id="storeNavigation" class="disableNavigation">'+
											'<a href="javascript:void(0);" onclick="stockInStore.prevStore(this);" id="moreStoresPrevBtn">'+
												'<span class="fa fa-caret-left"></span>'+
											'</a>'+
											'<a href="javascript:void(0);" onclick="stockInStore.nextStore(this);" id="moreStoresNextBtn">'+
												'<span class="fa fa-caret-right"></span>'+
											'</a>'+
										'</div>',
		
		//No Stores Found Template
		htmlNoStoreFoundTemplate:'<span>We couldn\'t find a store within {{radiusSearch}}km. Your nearest store is below. To find other stores update your search or shop online.</span>',
		htmlNoStoreFoundTemplateBlock:'<span>We couldn\'t find a store within {{radiusSearch}}km.To find other stores update your search or shop online.</span>',
		htmlStoreListResultOnLoadTemplate:'<div id="clientPromo">' + 
												'{{#IFNOTEmpty promotionTileImage1}}'+
													'{{> fbhtmlPromotionTileTemplate}}' + 
												'{{else}}'+
												'{{/IFNOTEmpty}}'+	
											'</div>',
		htmlCnCStoreListingSectionTemplate:'<li class="storeSelect  {{ isstoreselected this.info.code  }}">\
												{{#IFGT this.info.stock \'0\'}} \
		   											<button class="storeSelectBtn" type="button" onclick="stockInStore.selectStore(\'{{this.info.code}}\')">Select Store</button>\
												{{else}}\
													<button disabled class="storeSelectBtn disabled" type="button" onclick="stockInStore.selectStore(\'{{this.info.code}}\')">Select Store</button>\
												{{/IFGT }}\
											</li>',	
		//Store List Result Template
		htmlStoreListResultTemplate:'<div id="storeListWrap">'+
										'<div id="storesList">'+
											'{{#each dataCache.stores}}'+
												'<div class="storeDetails">'+
													'<ul>'+
														'<li class="hideStore">'+
															'<a href="javascript:void(0);"'+
															' onclick="stockInStore.hideStore(this);" class="hideStoreLink" data-storecode="{{this.info.code}}">'+
																'<span class="fal fa-times"></span>'+
															'</a>'+
														'</li>'+
														'<li class="storeHeading">'+
															'<strong>{{this.info.label}}</strong>'+
														'</li>'+
														'<li class="storeDistance">'+
															'<a target="_blank" href="http://maps.apple.com/?q={{this.geoposition.lat}},{{this.geoposition.lng}}"'+
															 ' onclick="stockInStore.sendLinkEvents(this, \'Stores - View Map\');" data-storecode="{{this.info.code}}">'+
																'<span class="fa fa-map-marker"></span>View Map <small>{{format this.distance type="float" fixed="2"}} km away</small>'+
															'</a>'+
														'</li>'+
														'<li class="storeAddress">'+
															'<a class="storeAddressIcon"'+
															' onclick="stockInStore.showAddress(this);"'+
															' href="javascript:void(0);" data-storecode="{{this.info.code}}">'+
																'<span class="fa fa-building"></span>Store Address'+
															'</a>'+
															'<div class="addressDetails">'+
																'<a target="_blank" href="http://maps.apple.com/?q={{this.geoposition.lat}},{{this.geoposition.lng}}"'+
															 	' onclick="stockInStore.sendLinkEvents(this,\'Stores - View Map (Address)\');" data-storecode="{{this.info.code}}">'+
																	'{{#each this.info.address_lines}}'+
																		'{{this}} <br/>'+
																	'{{/each}}'+
																	'{{this.info.city}} {{this.info.state}} {{this.info.postcode}}<br>'+
																	'{{this.info.country}}'+
																'</a>'+
															'</div>'+
														'</li>'+
														'{{#IFE ../showStockLastUpdatedByStore \'true\'}}'+
															'{{#IFNOTEmpty this.info.lastUpdateTime}}' + 
																'<li class="storeUpdated">'+
																	'{{format this.info.lastUpdateTime type="datelastimport" datestrformat="DDDD, ddd MMMM yyyy"}}'+
																'</li>'+
															'{{/IFNOTEmpty}}'+															
														'{{/IFE}}'+	
														'<li class="storeContact">'+
															'<div class="contactLine">'+
																'<a class="storeTel" href="tel:{{removeBlanks this.info.phone}}"'+
																' onclick="stockInStore.sendLinkEvents(this, \'Stores - Telephone\');" data-storecode="{{this.info.code}}">'+
																	'<span class="fa fa-phone"></span>{{this.info.phone}}'+
																'</a>'+
															'</div>'+
															'<div class="contactLine">'+
																'<a class="storeHours"'+
																' onclick="stockInStore.showHours(this);"'+
																' href="javascript:void(0);" data-storecode="{{this.info.code}}">'+
																	'<span class="fa fa-clock-o"></span>Opening Hours'+
																'</a>'+
																'<div class="openHours">'+
																	'{{{this.info.open_hours}}}'+
																		'<span class="fa fa-caret-down"></span>'+
																'</div>'+
															'</div>'+
														'</li>'+
														'<li class="storeStock" data-stock-value="{{this.info.stock}}">'+
															'{{#IFEMPTY this.info.threshold.action}}'+
																'<strong class="{{this.info.threshold.class}}">{{{this.info.threshold.label}}}</strong>'+
															'{{else}}'+
																'{{#IFE this.info.threshold.action \'phone\'}}'+
																					'<a class="{{this.info.threshold.class}} storeTel" href="tel:{{removeBlanks this.info.phone}}"'+
																						' onclick="stockInStore.sendLinkEvents(this, \'Stores - Telephone\');" data-storecode="{{this.info.code}}" data-indicator-label="{{this.info.threshold.label}}" data-indicator-action="{{this.info.threshold.action}}">'+
																						'{{{this.info.threshold.label}}}</a>'+
																'{{/IFE}}'+
															'{{/IFEMPTY}}'+
														'</li>'+
													'</ul>'+
												'</div>'+
											'{{/each}}'+
									 	'</div>'+
									 '</div>',
		htmlreserveInStoreTemplate: '',
		htmlstoreLocatorTemplate:	'<div class="sis-locator-inner-wrapper">\
										<div class="sis-locator-col-left">\
											<div class="sis-locator-search-wrapper">\
												{{> fbhtmlSearchLocationTemplate}}\
											</div>\
											\<div>\
											\<h3 class="selectstore-heading">Please select a store</h3></div>\
											<div id="storeListResult">\
												{{> fbhtmlStoreLocatorListTemplate}}\
											</div>\
										</div>\
										<div class="sis-locator-col-right">\
												\<div id="sis-selected-store">\
													{{> fbhtmlSelectedStoreTemplate}}\
												\</div>\
												{{> fbhtmlStoreLocatorMapTemplate}}\
										</div>\
									</div>\
									<div id="sis-locator-store-view">\
										{{> fbhtmlStoreLocatorDetailTemplate}}\
									</div>',
		htmlStoreLocatorMapTemplate: '<div id="sis-locator-map-wrap"></div>',
		htmlSelectedStoreTemplate:'<h3>Your selected store: {{dataStore.selectedStore.label}}</h3>',								
		htmlstoreLocatorListTemplate:'<div id="storeListWrap">'+
									'<div id="storesList">'+
										'{{#each dataCache.stores}}'+
											'<div class="storeDetails" data-store-code="{{this.info.code}}">'+
											'<h3 class="storeHeading">{{this.info.label}}</h3>'+
											'<a class="storeSelectBtn {{ isstoreselected this.info.code  }}" onclick="javasctipt:stockInStore.selectStore(\'{{this.info.code}}\')" href="javascript:void(0);">Select Store</a>' + 
											'<ul class="storeInfo">'+
													//'<li class="hideStore">'+
													//	'<a href="javascript:void(0);"'+
													//	' onclick="stockInStore.hideStore(this);" class="hideStoreLink" data-storecode="{{this.info.code}}">'+
													//		'<span class="fal fa-times"></span>'+
													//	'</a>'+
													//'</li>'+
														'<li><a onclick="javasctipt:stockInStore.viewStoreDetails(\'{{this.info.code}}\')" href="javascript:void(0);">View Store Detail Page</a></li>'+
														'<li><a onclick="javasctipt:stockInStore.gotoMapMarker(\'{{this.info.code}}\')" href="javascript:void(0);">View on Map</a></li>'+
														'<li class="storeDistance">'+
														'<a target="_blank" href="http://maps.apple.com/?q={{this.geoposition.lat}},{{this.geoposition.lng}}"'+
														 ' onclick="stockInStore.sendLinkEvents(this, \'Stores - View Map\');" data-storecode="{{this.info.code}}">'+
															'<span class="fa fa-map-marker"></span>View Map <small>{{format this.distance type="float" fixed="2"}} km away</small>'+
														'</a>'+
													'</li>'+
													'<li class="storeAddress">'+
														'<a class="storeAddressIcon"'+
														' onclick="stockInStore.showAddress(this);"'+
														' href="javascript:void(0);" data-storecode="{{this.info.code}}">'+
															'<span class="fa fa-building"></span>Store Address'+
														'</a>'+
														'<div class="addressDetails">'+
															'<a target="_blank" href="http://maps.apple.com/?q={{this.geoposition.lat}},{{this.geoposition.lng}}"'+
															 ' onclick="stockInStore.sendLinkEvents(this,\'Stores - View Map (Address)\');" data-storecode="{{this.info.code}}">'+
																'{{#each this.info.address_lines}}'+
																	'{{this}} <br/>'+
																'{{/each}}'+
																'{{this.info.city}} {{this.info.state}} {{this.info.postcode}}<br>'+
																'{{this.info.country}}'+
															'</a>'+
														'</div>'+
													'</li>'+
													//'{{#IFE ../showStockLastUpdatedByStore \'true\'}}'+
													//	'{{#IFNOTEmpty this.info.lastUpdateTime}}' + 
													//		'<li class="storeUpdated">'+
													//			'{{format this.info.lastUpdateTime type="datelastimport" datestrformat="DDDD, ddd MMMM yyyy"}}'+
													//		'</li>'+
													//	'{{/IFNOTEmpty}}'+															
													//'{{/IFE}}'+	
													'<li class="storeContact">'+
														'<div class="contactLine">'+
															'<a class="storeTel" href="tel:{{removeBlanks this.info.phone}}"'+
															' onclick="stockInStore.sendLinkEvents(this, \'Stores - Telephone\');" data-storecode="{{this.info.code}}">'+
																'<span class="fa fa-phone"></span>{{this.info.phone}}'+
															'</a>'+
														'</div>'+
														'<div class="contactLine">'+
															'<a class="storeHours"'+
															' onclick="stockInStore.showHours(this);"'+
															' href="javascript:void(0);" data-storecode="{{this.info.code}}">'+
																'<span class="fa fa-clock-o"></span>Opening Hours'+
															'</a>'+
															'<div class="openHours">'+
																'{{{this.info.open_hours}}}'+
																	'<span class="fa fa-caret-down"></span>'+
															'</div>'+
														'</div>'+
													'</li>'+
													//'<li class="storeStock" data-stock-value="{{this.info.stock}}">'+
													//	'{{#IFEMPTY this.info.threshold.action}}'+
													//		'<strong class="{{this.info.threshold.class}}">{{{this.info.threshold.label}}}</strong>'+
													//	'{{else}}'+
													//		'{{#IFE this.info.threshold.action \'phone\'}}'+
													//							'<a class="{{this.info.threshold.class}} storeTel" href="tel:{{removeBlanks this.info.phone}}"'+
													//								' onclick="stockInStore.sendLinkEvents(this, \'Stores - Telephone\');" data-storecode="{{this.info.code}}" data-indicator-label="{{this.info.threshold.label}}" data-indicator-action="{{this.info.threshold.action}}">'+
													//								'{{{this.info.threshold.label}}}</a>'+
													//		'{{/IFE}}'+
													//	'{{/IFEMPTY}}'+
													//'</li>'+
												'</ul>'+
											'</div>'+
										'{{/each}}'+
									 '</div>'+
								 '</div>',
		htmlStoreLocatorMapContentTemplate:'<div class="storeDetails">'+
		'<ul>'+
			'<li class="storeHeading">'+
				'<strong>{{this.info.label}}</strong>'+
			'</li>'+
			'<li class="storeDistance">'+
				'<a target="_blank" href="http://maps.apple.com/?q={{this.geoposition.lat}},{{this.geoposition.lng}}"'+
				 ' onclick="stockInStore.sendLinkEvents(this, \'Stores - View Map\');" data-storecode="{{this.info.code}}">'+
					'<span class="fa fa-map-marker"></span>View Map <small>{{format this.distance type="float" fixed="2"}} km away</small>'+
				'</a>'+
			'</li>'+
			'<li class="storeAddress">'+
				'<a class="storeAddressIcon"'+
				' onclick="stockInStore.showAddress(this);"'+
				' href="javascript:void(0);" data-storecode="{{this.info.code}}">'+
					'<span class="fa fa-building"></span>Store Address'+
				'</a>'+
				'<div class="addressDetails">'+
					'<a target="_blank" href="http://maps.apple.com/?q={{this.geoposition.lat}},{{this.geoposition.lng}}"'+
					 ' onclick="stockInStore.sendLinkEvents(this,\'Stores - View Map (Address)\');" data-storecode="{{this.info.code}}">'+
						'{{#each this.info.address_lines}}'+
							'{{this}} <br/>'+
						'{{/each}}'+
						'{{this.info.city}} {{this.info.state}} {{this.info.postcode}}<br>'+
						'{{this.info.country}}'+
					'</a>'+
				'</div>'+
			'</li>'+
			'<li class="storeContact">'+
				'<div class="contactLine">'+
					'<a class="storeTel" href="tel:{{removeBlanks this.info.phone}}"'+
					' onclick="stockInStore.sendLinkEvents(this, \'Stores - Telephone\');" data-storecode="{{this.info.code}}">'+
						'<span class="fa fa-phone"></span>{{this.info.phone}}'+
					'</a>'+
				'</div>'+
				'<div class="contactLine">'+
					'<a class="storeHours"'+
					' onclick="stockInStore.showHours(this);"'+
					' href="javascript:void(0);" data-storecode="{{this.info.code}}">'+
						'<span class="fa fa-clock-o"></span>Opening Hours'+
					'</a>'+
					'<div class="openHours">'+
						'{{{this.info.open_hours}}}'+
							'<span class="fa fa-caret-down"></span>'+
					'</div>'+
				'</div>'+
			'</li>'+
		'</ul>',
		htmlStoreLocatorDetailTemplate:'<div><h1>{{this.info.store_name}}</h1></div>',
		fnAddToBasket:function(elem,settings,callback)
		{
			if(callback != null) return callback.call(this,true);
		},

		fnshowCncButtonWithCondition:function(settings,callback)
		{
			if(callback != null) return callback.call(this,true);
		},

		fnshowSisButtonWithCondition:function(settings,callback)
		{
			if(callback != null) return callback.call(this,true);
		},
		showSISButtonOnlyForStates:'ALL',
		//Customisable options 
		//If the check stock in store button need to be moved to a spefic
		//location on the page
		fnSetSISButtonLocation:function(settings)
		{
			return {
				enable:false,
				action:'after', //before, append
				target:'.addtobag', // class (starts with '.') or id (starts with '#');
				isSearchTarget:true //enable interval to wait until the product element is loaded on page before moving the check stock in store button
			}
		},
									 
		//Option for method of getting product details to be displayed in SIS widget
		fnGetProductDetails:function(settings,callback)
		{
				settings.dataProduct.name =  "";
				settings.dataProduct.image = "";
				settings.dataProduct.style = "";
			 	if(callback != null) return callback.call(this);
		},
		
		fnUpdateProductDetails:function(settings,callback)
		{
			if(callback != null) return callback.call(this);
		},

		//Option for method of getting product identifier 
		fnGetProductIdentifier:function(settings,callback)
		{
			var productidentifier = '';
			settings.dataIdentifiers.product = productidentifier;
			if(callback != null) return callback.call(this);

		},
		
		//Option for method of getting variation identifier 
		fnGetVariationIdentifier:function(settings,callback)
		{
			 var variationidentifier = '';
			 settings.dataIdentifiers.variation = variationidentifier;
	 		 if(callback != null) return callback.call(this);
		},
		
		//Calculation related to store list container  (e.g the width of the store list container is based on the number of stores displayed)
		fnStyleStoresList:function(settings)
		{
			var storeList = document.getElementById('storesList');
			var elms 		= stockInStoreGlobal.querySelect('.storeDetails');
			var elmshide 	= stockInStoreGlobal.querySelect('.storeDetails.hideElement');
			var totalelms 	= (elms.length - elmshide.length);
			var totalWidth   = totalelms * (settings.objConfigStoreListContainer.storeElemcontainer.width);
			storeList.style.width = totalWidth + 'px'; 

		},
		
		//Calculation related to store list navigation (e.calc of no of px to slide to the right for next store and left  for prev store)
		fnManageStoreNavigation:function(settings)
		{

		},
		
		//When selecting variation find the product identifier
		fnFindUPIVariation:function(settings,e)
		{
			var data = settings.dataCache.productVariations.response;

			var arrVariations = settings.dataVariations.arrayVariationInfo;
			var arrConditionsObject = [];
			var searchKey = '';
			
			for(var i=0;i<arrVariations.length;i++)
			{
				var ind = arrVariations[i].variationIndex;
				searchKey += stockInStoreGlobal.querySelect('.sisvar_' + ind)[0].value;
			}
			
			for(var i=0;i<data.length;i++)
			{
				var combinekey = '';
				for(var j=0;j<arrVariations.length;j++)
				{
					var ind = arrVariations[j].variationIndex;
                    var encodedStr = data[i]['variation_' + ind];
					var parser = new DOMParser;
                    var dom = parser.parseFromString('<!doctype html><body>' + encodedStr, 'text/html');
					combinekey += dom.body.textContent;
				}
				
				if(combinekey == searchKey )
				{
					settings.dataIdentifiers.product = data[i].upi;

				}
			}

		},
		//
		//fnShowSisButton:function(settings)
		//{
		//	return true
		//	
		//},

		//Allow for custom helpers to be added when needed.
		//Can be added through activation code
		fnRegisterCustomHelpers:function(){},
		fnOnChangeVariation:function(settings,e){},
		fnOnDisplayWidget:function(settings){},
		fnOnUpdateRadius:function(settings,e){},
		fnOnUpdateMetric:function(settings,e){},
		fnOnCancelSearch:function(settings,e){},
		fnOnSearchStores:function(settings,e){},
		fnOnDisplayStores:function(settings){},
		fnOnUpdateSearch:function(settings,e){},
		fnOnDisplayNoStores:function(settings){},
		fnOnHideStore:function(settings,e){},
		fnOnShowStoreAddress:function(settings,e){},
		fnOnHideStoreAddress:function(settings,e){},
		fnOnShowStoreHours:function(settings,e){},
		fnOnHideStoreHours:function(settings,e){},
		fnOnShowSISButton:function(settings,e){},
		fnOnHideWidget:function(settings){},
		fnOnCompleteAddToBasket:function(settings){}
	};

	/** ------------------------
	 *	GLOBAL VARS
	 *  -------------------------
	 */


	//
	stockInStore.isCheckInStoreClick = false;
	stockInStore.ErrorLoadingMapAPI = false;
	
	stockInStore.thresholdType = "fis";
	stockInStore.gaLabelType = "fis";

	stockInStore.isCncWidget = false;
	stockInStore.isQuickView = false;

	//
	stockInStore.countryDetails = ""
	stockInStore.botCheck = stockInStoreGlobal.getCookie('_SIS_BOT_CHECK');

	//Reporting Tags
	stockInStore.tags = {
		sis_page:"product",
		sis_module:"sis",
		sis_segment:"",
		sis_button:"sis"
	}


	
	/** ------------------------
	 *	PRIVATE METHODS
	 *  -------------------------
	 */
	
	/**
	 * Extend defaults with user options
	 * @private
	 * @param {default} defaults Default settings
	 * @param {Object} options User options
	 * @returns {Object} Merged values of defaults and options
	 */
	var extend = function( defaults, options ) {

	  for (var property in options) {
		//if (typeof options[property] === 'object') {
		//  defaults[property] = defaults[property] || {};
		//  extend(defaults[property], options[property]);
		//} else {
		  defaults[property] = options[property];
		//}
	  }
	  return defaults;
	};




	/** */
	var sendQuickViewEvent = function(retobj){

		if(typeof(_stockinstore.widget)!=='undefined' && typeof(_stockinstore.widget.onEvent)!=='undefined'){
			callExtOjectFn(_stockinstore,_stockinstore.widget,_stockinstore.widget.onEvent,retobj)
		}

	}

	/** */
	var qvStyleStoresList = function(){
		var storeList = document.getElementById('storesList');
		var elms 		= stockInStoreGlobal.querySelect('.storeDetails');
		var elmshide 	= stockInStoreGlobal.querySelect('.storeDetails.hideElement');
		var totalelms 	= (elms.length - elmshide.length);
		var totalWidth   = totalelms * (settings.objConfigStoreListContainer.storeElemcontainer.width);
		storeList.style.width = totalWidth + 'px'; 

	}
	/** */
	var qvFindUpiVariation = function(){
			
			var data = settings.dataCache.productVariations.response;

			var arrVariations = settings.dataVariations.arrayVariationInfo;
			var arrConditionsObject = [];
			var searchKey = '';
			
			for(var i=0;i<arrVariations.length;i++)
			{
				var ind = arrVariations[i].variationIndex;
				searchKey += stockInStoreGlobal.querySelect('.sisvar_' + ind)[0].value;
			}
			
			for(var i=0;i<data.length;i++)
			{
				var combinekey = '';
				for(var j=0;j<arrVariations.length;j++)
				{
					var ind = arrVariations[j].variationIndex;
                    var encodedStr = data[i]['variation_' + ind];
					var parser = new DOMParser;
                    var dom = parser.parseFromString('<!doctype html><body>' + encodedStr, 'text/html');
					combinekey += dom.body.textContent;
				}
				
				if(combinekey == searchKey )
				{
					settings.dataIdentifiers.product = data[i].upi;

				}
			}
	}

	/** */
	 var resetSISTags = function(){
		stockInStore.tags = {
			sis_page:(typeof(_stockinstore.sis_pagetype)!=='undefined'?_stockinstore.sis_pagetype:"product"),
			sis_module:"sis",
			sis_segment:"",
			sis_button:"sis"
		}
	 }



	/**
	 * 
	 * 
	 * 
 	 * 
	 * 
	 */
	
	 var addToBasket = function(elem,callback)
	 {
		 

		 if(!stockInStore.isQuickView){
			settings.fnAddToBasket.call(this,elem,settings,callback);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.element = elem;
				retObj.eventName = 'onAddToBasket';
				retObj.callback = callback;
				sendQuickViewEvent(retObj);
		} 
	

	 }

	/**
	 * 
	 * 
	 * 
 	 * 
	 * 
	 */
	
	 var displaySisButton = function(callback)
	 {
		 

		 if(!stockInStore.isQuickView){
			settings.fnshowSisButtonWithCondition.call(this,settings,callback);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.eventName = 'onBeforeShowSisButton';
				retObj.callback = callback;
				sendQuickViewEvent(retObj);
		} 


	 }

	 /**
	  * 
	  */
	 var displayCncButton = function(callback){
		if(!stockInStore.isQuickView){
			settings.fnshowCncButtonWithCondition.call(this,settings,callback);
			
		}
		
	 }
	
	/**
	 * Reverse geocoding get address from long and lat
	 * @private
	 * @param {string} latitude
 	 * @param {string} longitude
	 * @param {function} callback
	 * @returns {string} address
	 */
	 var getAddressByLatLng = function( lat, lng, callback ) {
		
		var latlng = {lat: parseFloat(lat), lng: parseFloat(lng)};
		var geocoder = new google.maps.Geocoder();

		geocoder.geocode({'location': latlng}, function(results, status) {
			if (status === 'OK') {
			  if (results[0]) {
				if(callback != null) return callback.call(this,results);
			  } else {
				if(callback != null) return callback.call(this,null);
			  }
			} else {
			  stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getAddressByLatLng " ,"Unable to get address by lat lng: " + status);
			  if(callback != null) return callback.call(this,null);
			}
		  });
		


	};
	


	/**
	 * Reverse geolocation object from address  and address component string
	 * @private
	 * @param {string} address
 	 * @param {string} component string (e.g country:AU)
	 * @param {function} callback
	 * @returns {string} address
	 */
	var getGeolocation = function( address, component, callback ) {
		var requestObj = stockInStoreGlobal.ajaxRequest();
		
		//Temporary Solution to Google Encoding service not 
		//being able to find post code ex 2000 
		var compobject = {
			'country':'AU'
		}
		if(component== "country:AU"){
			var caddress = address.split(" ").join("");
			if(caddress.length == 4 ){
				if(parseInt(caddress,10) == caddress){
					address= "postcode " + address
					compobject.postalCode = caddress;
				}
			}
			
		}

		var countryComponent = 'AU';
		if(component.length>0){
			countryComponent = component.split(":")[1];
			compobject.country = countryComponent
		}
		
		//console.log(address)
		//console.log(compobject)		
		
		var optGeocode = {
			'address': address
		}

		if(typeof(sisAutocomplete) == 'undefined'){
			optGeocode.componentRestrictions = compobject;
		}

		




		var geocoder = new google.maps.Geocoder();
		geocoder.geocode(optGeocode, function(results, status) {
			  if (status === 'OK') {
				if(callback != null) return callback.call(this,results);
				
			  } else {
					stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getGeolocation " ,"Unable to get geolocation: " + status);
					if(callback != null) return callback.call(this,null);
			  }
			});
	
	};


	/**
	 * Refresh the selected variation display within the widget (product feature section and not the product variation selection)
	 * @private
	 * @param {string}	index of the variation (1,2) (the index is used to reference the variation element as they are concatenated in the name e.g)
	 *					display_varlabel_1, display_varlabel_2			
 	 * @param {string} variation value to display 
	 */
	var updateVariationDisplay = function( dataindex, value ) {
		stockInStoreGlobal.querySelect('.display_varvalue_' + dataindex)[0].innerHTML = value;
		
		/*updateProductDetails(function(){


		})*/
		
	};

	/**
	 * 
	 * @param {*} radius 
	 */
	var updateProductDetails = function(callback){

		settings.fnUpdateProductDetails.call(this,settings,callback);
	}

	/**
	 * Set the search radius value
	 * @private
	 * @param {string}	Selected radius
	 */
	var setRadius = function( radius ) {
		settings.dataCache.radiusSearch = radius;
		
	};

	/**
	 * Set the search metric value
	 * @private
	 * @param {string}	Selected metric
	 */
	var setMetric = function( metric ) {
		settings.dataCache.metricSearch = metric;
		stockInStoreGlobal.setCookie('_SIS_METRIC', metric, 525600, '/');	
	};



	/**
	 * Display error messages for geolocation when getting geolocation from Browser API
	 * @private
	 * @param {string}	error string to be displayed
	 */
	var geolocationErrorHandler = function( errorname ) {

		
		stockInStoreGlobal.addClassName(document.getElementById('storeList'),'showElement');
		stockInStoreGlobal.addClassName(document.getElementById('productSelection'),'hideElement');
		if(errorname=='PERMISSION_DENIED')
		{

			stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Alert Log', 'Search - Current Location: Permission Denied','');
			document.getElementById('storeListResult').innerHTML =settings.objConfigGeocodeErrorMessagesHTML.permissiondenied

		   
		}else if(errorname=='NOTSUPPORTED')
		{
            stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Alert Log', 'Search - Current Location: Not Supported','');
			document.getElementById('storeListResult').innerHTML = settings.objConfigGeocodeErrorMessagesHTML.notsupported
		}else
		{

			stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Alert Log', 'Search - Current Location: Other','');
			document.getElementById('storeListResult').innerHTML =  settings.objConfigGeocodeErrorMessagesHTML.other
		}
		
		var pdata = {}
			var errorInfo ={};
				errorInfo.geolocation = errorname;
				pdata.errorInfo  = errorInfo ;
				stockInStore.sendEvents(null,null,'sis','_trackEvent', 'Stock In Store', 'Alert Log', 'Search - Current Location',JSON.stringify(pdata));
		
	};
	
	
	/**
	 * 
	 * @param {*} callback 
	 */
	 var cleanImageURL = function(URL){
		//We make the image url a fully formed url
			var imageCapURL = URL;
			//Checks if string does not contain http or https
				//Checks if string contains ../
				//Checks if string starts with "/"
			if (imageCapURL.indexOf('http://') === -1 && imageCapURL.indexOf('https://') === -1) {
			if (imageCapURL.indexOf('../')!==-1 )
			{
				imageCapURL = imageCapURL.split("../").join("");
			}
				
			if(imageCapURL.substring(0, 2)=="//"){
				imageCapURL = window.location.protocol + imageCapURL;
			}else{
				//if origin is not available
				if (!window.location.origin) {
					window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
				}
				
				imageCapURL =  window.location.origin + (imageCapURL.charAt(0)== "/" ?"":"/" ) + imageCapURL
			}
			}

			if(imageCapURL.indexOf("&")!==-1){
				imageCapURL = encodeURIComponent(imageCapURL)
			}
			return imageCapURL;
	 }
	 /**
	 * Get product identifier from page or other method (e.g site api)
	 * @private
 	 * @params {function} callback
	 */
	 var getProductIdentifier = function(callback)
	 {
		 settings.fnGetProductIdentifier.call(this,settings,callback);

	 }
	  
	  
	/**
	 * Get variation identifier from page or other method(e.g site api)
	 * @private
 	 * @params {function} callback
	 */
	 
	 var getVariationIdentifier = function( callback ) {
		 settings.fnGetVariationIdentifier.call(this,settings,callback);

		 

	 }
		
	/**
	 * Get product details from page
	 * @private
 	 * @params {function} callback
	 */	 
	 
	 var getProductDetails = function(callback)
	 {
		 settings.fnGetProductDetails.call(this,settings,callback);
	 }
	 
	 
	 
	 /**
	 * Get Master Stores List (country, id, latitude,longitude)
	 * @private
 	 * @params {function} callback
	 */
	 
	/** */
	var getAllStores = function( callback ) {
	
		var requestObj = stockInStoreGlobal.ajaxRequest()
		requestObj.open('POST',_stockinstore[0].applicationurl + '/stores/getAllStores',true);
		requestObj.withCredentials = true;
		requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		
		requestObj.onreadystatechange = function ()
		{
			if (requestObj.readyState == 4) {
				if(requestObj.status == 200){
					var respObj = JSON.parse(requestObj.responseText);				
					settings.storelocator.dataCache.stores = respObj.response;
					if(callback != null) return callback.call(this);
				}else{
					stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getAllStores " ,"Unable to get all stores: " + JSON.stringify(requestObj));	
				}
			}
		}

		var timezone_offset_minutes = new Date().getTimezoneOffset();
			timezone_offset_minutes = timezone_offset_minutes == 0 ? 0 : -timezone_offset_minutes;
		


		requestObj.send('site=' + _stockinstore[0].site + '&widget=' + settings.dataCache.widgetId +'&timezoneOffsetMinutes=' + timezone_offset_minutes  + '&isajax=1&info=none' + '&preview='+_stockinstore[0].isPreviewMode);
		
	};

	/** */
	var getStores = function( callback ) {
		if(settings.dataCache.storesMasterLocation!=null)
		{
			if(callback != null) return callback.call(this);
		}
	
		var requestObj = stockInStoreGlobal.ajaxRequest()
		requestObj.open('POST',_stockinstore[0].applicationurl + '/stores/getStoresForWidget',true);
		requestObj.withCredentials = true;
		requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		
		requestObj.onreadystatechange = function ()
		{
			if (requestObj.readyState == 4) {
				if(requestObj.status == 200){
					var respObj = JSON.parse(requestObj.responseText);
					
					var arrTeStoresList = respObj.response.stores_list;
					var retStoreList = []
					for(var sl=0;sl<arrTeStoresList.length;sl++){
						var objsl = respObj.response.stores_list[sl]
						objsl.code = escape(objsl.code) 
						retStoreList.push(objsl)
					}
					settings.dataCache.storesMasterLocation  = retStoreList;



					settings.dataCache.storeConfig = respObj.response.stores_config;
					settings.dataCache.storesCountries = respObj.response.countries_list;
					if(callback != null) return callback.call(this);
				}else{
					stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getStores " ,"Unable to get stores: " + JSON.stringify(requestObj));	
				}
			}
		}
		
		//requestObj.addEventListener("error", function(evt){
	//		stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getStores " ,"Unable to get stores: " +  JSON.stringify(requestObj));	
//		});

		requestObj.send('site=' + _stockinstore[0].site + '&widget=' + _stockinstore[0].widgets  + '&isajax=1&info=none' + '&preview='+_stockinstore[0].isPreviewMode);
		
	};
	
	
	/**
	 * Get product variation
	 * @private
 	 * @params {function} callback
	 */
	var getProductVariation = function( callback ) {


			var requestObj = stockInStoreGlobal.ajaxRequest()
			requestObj.open('POST',_stockinstore[0].applicationurl + '/stock/getVariations',true);
			requestObj.withCredentials = true;
			requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
			requestObj.onreadystatechange = function ()
			{
				if (requestObj.readyState == 4) {
					if(requestObj.status == 200){
						if(callback != null) return callback.call(this,JSON.parse(requestObj.responseText));
					}else{
						stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getProductVariation " ,"Unable to get product variations: " + JSON.stringify(requestObj));	
					}
				}
			}
			requestObj.send('site=' + _stockinstore[0].site + '&widget='+ settings.dataCache.widgetId  +  '&index=' + settings.dataIdentifiers.variation+ '&is_index=' + settings.dataIdentifiers.isindex + '&isajax=1');
	}
	
	/**
	 * Get the stores stock
	 * @private
	 * @params {array}
 	 * @params {object} longitude and latitude properties
 	 * @params {function} callback
	 */
	var getStoresStock = function( arrstorelist, objgeo, callback ) {
		
		stockInStoreGlobal.removeClassName(document.getElementById('storeList'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('storeList'),'showElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('productSelection'),'showElement');
		stockInStoreGlobal.addClassName(document.getElementById('productSelection'),'hideElement');

		stockInStoreGlobal.addClassName(document.getElementById('storeStockModal'),'storelistactive');
		
		stockInStoreGlobal.removeClassName(document.getElementById('mobileSearch'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('mobileSearch'),'showElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('productFeatureControls'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('productFeatureControls'),'showElement');
				
		var requestObj =  stockInStoreGlobal.ajaxRequest();
		requestObj.open('POST',_stockinstore[0].applicationurl + '/stores/getStoresStock',true);
		requestObj.withCredentials = true;
		requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
		requestObj.onreadystatechange = function ()
		{
			if (requestObj.readyState == 4) {
				if(requestObj.status == 200){
					if(callback != null) return callback.call(this,JSON.parse(requestObj.responseText));
				}else{
					stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getStoresStock " ,"Unable to get stores stock: " + JSON.stringify(requestObj));	
				}
			}
		}
		
		var latlonstr = objgeo.lat + '_'+objgeo.lng;
		var timezone_offset_minutes = new Date().getTimezoneOffset();
                timezone_offset_minutes = timezone_offset_minutes == 0 ? 0 : -timezone_offset_minutes;
		
		var postDataString = "";
		if(stockInStore.isQuickView){
			var objPassed = [];
			objPassed[0] = {"upi": settings.dataIdentifiers.product,"quantity":1};

			postDataString = 'site=' + _stockinstore[0].site + 
			'&widget=' + settings.dataCache.widgetId +
			'&timezoneOffsetMinutes=' + timezone_offset_minutes +
			'&pid=' + settings.dataIdentifiers.product + 
			'&storeids=' +arrstorelist.toString() +   
			'&latlong=' + latlonstr+ 
			'&preview='+_stockinstore[0].isPreviewMode+
			'&thresholdType=' + stockInStore.thresholdType+
			'&items=' + JSON.stringify(objPassed) + 
			'&info=none&isajax=1'
		}else{

			if(typeof(_stockinstore.items)!=="undefined"){

				if(_stockinstore.items.length == 1){
					if(settings.dataIdentifiers.product!=null){
						if(settings.dataIdentifiers.product.split(",").length == 1){
							_stockinstore.items[0].upi = settings.dataIdentifiers.product	
						}
					}
				}
	
				var passItems = [];
					
				for(var i=0;i<_stockinstore.items.length;i++){
					var ob = cloneObject(_stockinstore.items[i])
					if(typeof(ob.name)!=='undefined'){
						//ob.name = escape(ob.name.replace(/(\n|\r|[^a-zA-Z0-9])/g,''))
						ob.name =ob.name.replace(/'/g, "\\'");
						ob.name = ob.name.replace(/[^A-Za-z' ]/g, "");
					}

					if(typeof(ob.variations)!=='undefined'){
						ob.variations =ob.variations.replace(/'/g, "\\'");
						ob.variations= ob.variations.replace(/[^A-Za-z' ]/g, "");
					}
					 
					if(typeof(ob.image)!=='undefined'){
						if(ob.image.indexOf('<img')==-1){
							ob.image = escape(ob.image)
						}
					}	
					passItems.push(ob)
				}
	
				postDataString = 'site=' + _stockinstore[0].site + 
				'&widget=' + settings.dataCache.widgetId +
				'&timezoneOffsetMinutes=' + timezone_offset_minutes +
				'&pid=' + settings.dataIdentifiers.product + 
				'&storeids=' +arrstorelist.toString() +   
				'&latlong=' + latlonstr+ 
				'&preview='+_stockinstore[0].isPreviewMode+
				'&thresholdType=' + stockInStore.thresholdType+
				'&items=' + JSON.stringify(passItems) + 
				'&info=none&isajax=1'
			}else{
	
				var objPassed = [];
				objPassed[0] = {"upi": settings.dataIdentifiers.product,"quantity":1};
	
				postDataString = 'site=' + _stockinstore[0].site + 
				'&widget=' + settings.dataCache.widgetId +
				'&timezoneOffsetMinutes=' + timezone_offset_minutes +
				'&pid=' + settings.dataIdentifiers.product + 
				'&storeids=' +arrstorelist.toString() +   
				'&latlong=' + latlonstr+ 
				'&preview='+_stockinstore[0].isPreviewMode+
				'&thresholdType=' + stockInStore.thresholdType+
				'&items=' + JSON.stringify(objPassed) + 
				'&info=none&isajax=1'
			}
	
		}		
	
		requestObj.send(postDataString);
						
			
		var gaStrData = "";
		var pdata = {}
		var searchInfo = {};
		var	productIdentifiers = {}
			productIdentifiers = settings.dataIdentifiers;
			searchInfo.productIdentifiers = productIdentifiers ;
			
			
			
		var variationInfo= [];
		
		for(var i=0;i<settings.dataVariations.arrayVariationInfo.length;i++)
		{
			var variationObj = {}
			
			var getVarValue = (stockInStoreGlobal.querySelect('.sisvar_' + settings.dataVariations.arrayVariationInfo[i].variationIndex))[0].value;
			
			var encodedStr = getVarValue;
			var parser = new DOMParser;
			var dom = parser.parseFromString('<!doctype html><body>' + encodedStr,'text/html');
			getVarValue =  dom.body.textContent;
			
			gaStrData += "variation " + settings.dataVariations.arrayVariationInfo[i].variationLabels + ":" + getVarValue + "|";
			variationObj.name = settings.dataVariations.arrayVariationInfo[i].variationLabels;
			
			
			variationObj.value = getVarValue;
			
			
			variationInfo.push(variationObj);
			
		}
		
		searchInfo.variationInfo = variationInfo;
		
		
		gaStrData += "radius:" + settings.dataCache.radiusSearch + "|" ;
		
		if(arrstorelist.length>0)
		{
			gaStrData += "stores:" + arrstorelist.toString() + "|" ;
		}
		
		gaStrData += "pid:" + settings.dataIdentifiers.product + "|";
		
		
		
		var getCookieLocationPCode = stockInStoreGlobal.getCookie('_SISLOCATIONPCODE');
		if(getCookieLocationPCode!=="")
		{
			gaStrData += "postcode:" + getCookieLocationPCode;
			searchInfo.postcode = getCookieLocationPCode;
		}
		var getCookieLocationAddress = stockInStoreGlobal.getCookie('_SISLOCATIONADDRESS');
		if(getCookieLocationAddress!=="")
		{
			searchInfo.locationinput = getCookieLocationAddress;
		}
		
		searchInfo.radius = settings.dataCache.radiusSearch;
		
		//Address Components
		var getCookieAddressComponent = stockInStoreGlobal.getCookie('_SISADDRESSCOMPONENTS'); 
		var addressCompInfo = [];
		if(getCookieAddressComponent!=="")
		{
			var arrAddressComp = getCookieAddressComponent.split(",")
			for(var ac=0;ac<arrAddressComp.length;ac++)
			{
				var addressCompObj = {};
				var arrelm = arrAddressComp[ac]
				 addressCompObj[arrelm.split(":")[0]] = arrelm.split(":")[1] 
				 addressCompInfo.push(addressCompObj)
			}
		}
		

		searchInfo.addressCompInfo = addressCompInfo;
		searchInfo.stores = arrstorelist.toString();
		pdata.searchInfo = searchInfo;
		
		settings.dataCache.searchForm = pdata
		
		//stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Click', 'Search - ' + gaStrData,'');
		stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Click', 'Product Searched','');
		stockInStore.sendEvents(null,null,'sis','_trackEvent', 'Stock In Store', 'Submit', 'Search Form',JSON.stringify(pdata));					
	};
	

	/**
	 * Find the type value of a google location address component
	 * @private
	 * @param  (array) 	components
	 * @param  (string)	searchtyppe
	 * returns (string)	type value 
	 */

	 
	var getAddressComponentsProp = function(components,searchtype,searchprop)
	{
		var arrComp = components;
		
		var  styperesult= "";
		for(var i=0;i<arrComp.length;i++)
		{
			var arrtypes = arrComp[i].types
			
			for (var j=0;j<arrtypes.length;j++)
			{
				if(arrtypes[j] == searchtype)
				{
					styperesult = arrComp[i][searchprop];

				}
			}
		}
		return styperesult;
	}

	/** */
	var getAddressComponents = function(components,searchtype)
	{
		var arrComp = components;
		
		var  styperesult= "";
		for(var i=0;i<arrComp.length;i++)
		{
			var arrtypes = arrComp[i].types
			
			for (var j=0;j<arrtypes.length;j++)
			{
				if(arrtypes[j] == searchtype)
				{
					styperesult = arrComp[i].short_name;

				}
			}
		}
		return styperesult;
	}
	
	/**
	 * Reorder Store Information
	 * @private
	 */
	var reorderStoreInformation = function() {

		var storesres= settings.dataCache.stores //ordered list of stores;
		var lstoresres = storesres.length;
				
		for(var i=0;i<lstoresres;i++)
		{
			storesres[i].info = getStoreInformationFromUnorderedList(storesres[i].code);
			
		}
		

		
		displayStores();
	};
	
	
	/**
	 * Get store information from unordered list
	 * @private
	 * @params {string} store id
 	 * @returns {object}
	 */
	var getStoreInformationFromUnorderedList = function( storeid ) {
		var result = {};
		var storedata = settings.dataCache.storesUnordered;
		for(var i=0;i<storedata.length;i++)
		{
			if(escape(storedata[i].code)==storeid)
			{
				result = storedata[i];
				//if(stockInStore.thresholdType == "cnc"){
				//	result.stock = result.cnc.value
				//}
				
			}
		}
		return result;
	};	
	
	/** */
	var getCncStatus = function( cnconfig,forcerefresh,pcallback ) {
		
		var ajaxCall  = false;
		var store_code = settings.dataStore.selectedStore.code

		if(forcerefresh){
			ajaxCall = true;
		}else{
			//Check if cached object is created.
			if(settings.dataCache.clickcollect.cncdata == null){
				ajaxCall = true;
			}
		}
		
		if(ajaxCall){

			var requestObj =  stockInStoreGlobal.ajaxRequest();
			requestObj.open('POST',_stockinstore[0].applicationurl + '/stores/getCncStatus',true);
			requestObj.withCredentials = true;
			requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
			requestObj.onreadystatechange = function ()
			{
				if (requestObj.readyState == 4) {
					if(requestObj.status == 200){
						settings.dataCache.clickcollect.cncdata = JSON.parse(requestObj.responseText)
						if(pcallback != null) return pcallback.call(this,JSON.parse(requestObj.responseText));
						
					}else{
						stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getCncStatus " ,"Unable to get getCncStatus: " + JSON.stringify(requestObj));
					}
					
				}
			}

			if(typeof(_stockinstore.items)!=="undefined"){

				if(_stockinstore.items.length == 1){
					if(settings.dataIdentifiers.product!=null){
						if(settings.dataIdentifiers.product.split(",").length == 1){
							_stockinstore.items[0].upi = settings.dataIdentifiers.product	
						}
					}
				}


				
				requestObj.send('site=' + _stockinstore[0].site + 
							'&widget=' + settings.dataCache.widgetId +
							'&index_type=' + cnconfig.index_type + 
							'&index_value=' + cnconfig.index_value + 
							'&store_code=' + store_code +
							'&items=' + JSON.stringify(_stockinstore.items) + 
							'&preview='+_stockinstore[0].isPreviewMode+
							'&info=none&isajax=1');
			}else{

				var upiPass = cnconfig.index_value
				if(settings.dataIdentifiers.product!==""){
					upiPass = settings.dataIdentifiers.product;
				}

				var objPassed = [];
				objPassed[0] = {"upi": upiPass,"quantity":1};

				requestObj.send('site=' + _stockinstore[0].site + 
							'&widget=' + settings.dataCache.widgetId +
							'&index_type=' + cnconfig.index_type + 
							'&index_value=' + cnconfig.index_value + 
							'&store_code=' + store_code +
							'&items=' + JSON.stringify(objPassed) +  
							'&preview='+_stockinstore[0].isPreviewMode+
							'&info=none&isajax=1');
				
			}	
			
			
		}else{
			if(pcallback != null) return pcallback.call(this,settings.dataCache.clickcollect.cncdata);
		}


	}
	
	/**
	 * When stores are found
	 * @private
	 */
	var displayStores = function() {
		

		switch (settings.dataCache.widgetType.toLowerCase()) {
			case 'homepage':
				break;
			case 'shopping bag':
				var template = Handlebars.compile(settings.htmlStoreListResultTemplate);
				document.getElementById('storeListResult').innerHTML = template(settings);
				styleStoreElemContainer();
				break;
			case 'landing':
				break;
			case 'search':
				break;
			case 'article':
				break;
			case 'member account':
				break;
			case '3rdparty':
				break;	
			case 'other':
				break;	
			case 'store locator':
				var template = Handlebars.compile(settings.htmlstoreLocatorListTemplate);
				document.getElementById('storeListResult').innerHTML = template(settings);
				displayMap();				
				break;
			case 'category':
				var template = Handlebars.compile(settings.htmlStoreListResultTemplate);
				document.getElementById('storeListResult').innerHTML = template(settings);
				styleStoreElemContainer();				

				break;
			case 'checkout':
				/*var template = Handlebars.compile(settings.htmlstoreLocatorListTemplate);
				document.getElementById('storeListResult').innerHTML = template(settings);
				displayMap();*/
				var template = Handlebars.compile(settings.htmlStoreListResultTemplate);
				document.getElementById('storeListResult').innerHTML = template(settings);
				styleStoreElemContainer();				
				break;
			default :
				var template = Handlebars.compile(settings.htmlStoreListResultTemplate);
				document.getElementById('storeListResult').innerHTML = template(settings);
				styleStoreElemContainer();
		}

		checkHideStoreNoStock();

		var highlightClass = "";
		if(settings.highlightSelectedStore == 'true'){
			highlightClass = " standout"
			document.getElementById('storesList').className = highlightClass;
		}

		if(stockInStore.thresholdType == "cnc" && !stockInStore.isCncWidget){
			document.getElementById('storesList').className = "collapse " + highlightClass;
		}
	};


	/**
	 * 
	 */
	
	var checkHideStoreNoStock = function(){


		//Check if we need to display hide stores with no stock
		var showOptions = false;
		if(settings.showHideStoresNoStock == 'true'){
			stockInStoreGlobal.addClassName(stockInStoreGlobal.querySelect(".sisNoStock")[0],'showElement');
			showOptions = true;
		}else{
			stockInStoreGlobal.removeClassName(stockInStoreGlobal.querySelect(".sisNoStock")[0],'showElement');
		}

		if(settings.showHideStoresNoCnc == 'true'){
			stockInStoreGlobal.addClassName(stockInStoreGlobal.querySelect(".sisNoCC")[0],'showElement');
			showOptions = true;
		}else{
			stockInStoreGlobal.removeClassName(stockInStoreGlobal.querySelect(".sisNoCC")[0],'showElement');
		}

		if(showOptions){
			stockInStoreGlobal.addClassName(stockInStoreGlobal.querySelect("#storeListWrap .wrap-sis-options")[0],'showElement');	
		}else{
			stockInStoreGlobal.removeClassName(stockInStoreGlobal.querySelect("#storeListWrap .wrap-sis-options")[0],'showElement');
		}


		var getCookieHideStores =  	stockInStoreGlobal.getCookie('_SISHIDESTORESNOSTOCK');
		var getCookieHideStoresCC = stockInStoreGlobal.getCookie('_SISHIDESTORESNOCC');

			

			if(getCookieHideStores == 'true'){
				document.getElementById("sisUIHideShowNoStockStores").checked = true;
				//document.getElementById("sisUIHideShowNoStockStores").onchange();
			}

			if(getCookieHideStoresCC == 'true'){
				document.getElementById("sisUIHideShowNoCCStores").checked = true;
				//document.getElementById("sisUIHideShowNoStockStores").onchange();
			}

			if(settings.setHideStoresNoStockDefault == 'true'){
				if(getCookieHideStores == ""){
					document.getElementById("sisUIHideShowNoStockStores").checked = true;
				}
			}

			if(settings.setHideStoresNoCncDefault == 'true'){
				if(getCookieHideStoresCC == ""){
					document.getElementById("sisUIHideShowNoCCStores").checked = true;
				}
			}



			stockInStore.showhideNoStockStore()
	
	}
	/**
	 * 
	 */
	var displayMap = function(){

		var centerpoint = {lat: parseFloat(settings.dataCache.geolocationObj.lat), lng: parseFloat(settings.dataCache.geolocationObj.lng)};
	
		var bounds = new google.maps.LatLngBounds();
		var mapOptions = {
			mapTypeId: 'roadmap',
			zoom: 4, 
			center: centerpoint
		};
		


		if(settings.dataCache.storeLocator.mapInfo.mapObject==null){
			settings.dataCache.storeLocator.mapInfo.mapObject = new google.maps.Map(document.getElementById('sis-locator-map'), mapOptions);
			settings.dataCache.storeLocator.mapInfo.mapObject.setTilt(50);
		}else{
			settings.dataCache.storeLocator.mapInfo.mapObject.setCenter(centerpoint)
			settings.dataCache.storeLocator.mapInfo.mapObject.setZoom(4);
			
		}
	
		//We need to clear the markers
		if(settings.dataCache.storeLocator.mapInfo.mapMarkersArray!==null){
			var mapArray = settings.dataCache.storeLocator.mapInfo.mapMarkersArray;
			for(var j=0;j<mapArray.length;j++){
				mapArray[j].setMap(null);
			}

			settings.dataCache.storeLocator.mapInfo.mapMarkersArray = []
		}
		settings.dataCache.storeLocator.mapInfo.mapMarkersArray = []
		settings.dataCache.storeLocator.mapInfo.mapMarkerContentArray = []

		var infoWindow = new google.maps.InfoWindow();


		var iconImage = {
			scaledSize: new google.maps.Size(32, 42)
			//,origin: new google.maps.Point(0,0)
			//,anchor: new google.maps.Point(0, 0) // anchor
		};

		if(settings.storeLocatorMarkerImage!==null){
			iconImage.url  = settings.clientMediaURL + settings.storeLocatorMarkerImage;
		}

		//Populate markers
		for (var i=0;i<settings.dataCache.stores.length;i++){
			if(settings.dataCache.stores[i].geoposition.lat!=="" && settings.dataCache.stores[i].geoposition.lng!==""){

				var position = new google.maps.LatLng(parseFloat(settings.dataCache.stores[i].geoposition.lat),parseFloat(settings.dataCache.stores[i].geoposition.lng));
				bounds.extend(position);
	
				var marker = new google.maps.Marker({
					map: settings.dataCache.storeLocator.mapInfo.mapObject,
					position: position,
					title: settings.dataCache.stores[i].info.store_name,
					id:settings.dataCache.stores[i].code,
					icon: iconImage,
					//shape: shape,
				  });

				settings.dataCache.storeLocator.mapInfo.mapMarkerContentArray.push(settings.dataCache.stores[i])  

				settings.dataCache.storeLocator.mapInfo.mapMarkersArray.push(marker);
				  
				// Add info window to marker    
				google.maps.event.addListener(marker, 'click', (function(marker, i) {
					return function(e) {

						var template = Handlebars.compile(settings.htmlStoreLocatorMapContentTemplate);
						infoWindow.setContent(template(settings.dataCache.storeLocator.mapInfo.mapMarkerContentArray[i]));
						infoWindow.open(settings.dataCache.storeLocator.mapInfo.mapObject, marker);

						//only scroll store list when clicking on marker
						//prevent store list scrolling when clicking on view on map	
						if(typeof(e) !== 'undefined'){
							//We might scroll the store list to the corresponding store
							var storeDetailElem  = document.getElementById("storesList").querySelector(".storeDetails[data-store-code=" + settings.dataCache.storeLocator.mapInfo.mapMarkerContentArray[i].code  + "]")
							if(storeDetailElem!==null){
								document.getElementById("storeListWrap").scrollTop = 0
								document.getElementById("storeListWrap").scrollTop = storeDetailElem.offsetTop - storeDetailElem.clientHeight 
							}

						}
					
					}
				})(marker, i));
				
				settings.dataCache.storeLocator.mapInfo.mapObject.fitBounds(bounds);
			}
		}
		settings.dataCache.storeLocator.mapInfo.mapObject.setZoom(17);
		settings.dataCache.storeLocator.mapInfo.mapObject.panTo(settings.dataCache.storeLocator.mapInfo.mapMarkersArray[0].position);
		settings.dataCache.storeLocator.mapInfo.mapObject.setCenter(settings.dataCache.storeLocator.mapInfo.mapMarkersArray[0].position);

	}


	/**
	 * 
	 */

	stockInStore.initialiseStoreCountry=function(countrycode,showerror){
		var metric = "km"	
		var getMetric = stockInStoreGlobal.getCookie('_SIS_METRIC');
					
		if(getMetric == ""){

			if(countrycode=="US" || countrycode=="LR" || countrycode=="MM"){
				metric = "mi"
			}
			
			stockInStoreGlobal.setCookie('_SIS_METRIC', metric, 525600, '/');
		}else{
			metric = getMetric
			
		}		

		settings.dataCache.metricSearch = metric;

		var selMetricElement = document.getElementById("uiMetricSel")
		if(selMetricElement!==null){
			selMetricElement.value = metric;
		}


		var allflags = document.getElementById("uiStoreCountrySel").querySelectorAll(".sis-flag")
		
		for(var i=0;i<allflags.length;i++){
			allflags[i].setAttribute("class","sis-flag " + countrycode.toLowerCase())
		}

		if(showerror){
			var DefaultCountryHasStores = false;
			var CountryName = "";
			//Check if the default country has stores
			for(var i=0;i<settings.dataCache.storesCountries.length;i++){
				if(settings.dataCache.storesCountries[i].code.toLowerCase() == countrycode.toLowerCase()){
					DefaultCountryHasStores = true;
					break;
				}
			}
	
			if(!DefaultCountryHasStores){
				var countryinfo = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?stockInStore.countryDetails:'AU|Australia';
				document.querySelector(".locationError .detectedCountry").innerText = countryinfo.split("|")[1];
				document.querySelector(".locationError").setAttribute("class","locationError")
			}
	
		}
	}

	/**
	 * 
	 */
	stockInStore.hideCountriesSelection = function(){
		document.getElementById("searchCountriesWrap").setAttribute('class','');
		
	}

	stockInStore.showCountriesSelection = function(){
		document.getElementById("searchCountriesWrap").setAttribute('class','active');
		
	}

	/**
	 * 
	 */

	stockInStore.updateStoreCountries=function(elem){
		
		var selCountryName = elem.getAttribute("data-country-name");
		var selCountryCode = elem.getAttribute("data-country-code");


		//hide the location error
		document.querySelector(".locationError .detectedCountry").innerText = "";
		document.querySelector(".locationError").setAttribute("class","locationError hideElement")


		var allflags = document.getElementById("uiStoreCountrySel").querySelectorAll(".sis-flag")
		
		for(var i=0;i<allflags.length;i++){
			allflags[i].setAttribute("class","sis-flag " + selCountryCode.toLowerCase())
		}

		stockInStoreGlobal.setCookie('_SIS_COUNTRY',  selCountryCode + "|" + selCountryName  , 30, '/')
		
		var getMetric = stockInStoreGlobal.getCookie('_SIS_METRIC');
		var metric = "km"			
		if(getMetric == ""){

			if(selCountryCode=="US" || selCountryCode=="LR" || selCountryCode=="MM"){
				metric = "mi"
			}
			
			stockInStoreGlobal.setCookie('_SIS_METRIC', metric, 525600, '/');
		}else{
			metric = getMetric;
		}

		var selMetricElement = document.getElementById("uiMetricSel")
		if(selMetricElement!==null){
			selMetricElement.value = metric;
		}


		settings.dataCache.metricSearch = metric;

		stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', "", 8760, '/');
		stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', "", 8760, '/');
		stockInStoreGlobal.setCookie('_SISLOCATIONLAT', "", 8760, '/');
		stockInStoreGlobal.setCookie('_SISLOCATIONLNG', "", 8760, '/');
		stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', "", 8760, '/');

		//Delete other address cookies
		stockInStore.countryDetails  = selCountryCode + "|" + selCountryName

		if(typeof(sisAutocomplete)!=="undefined"){

			var countryinfo = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?stockInStore.countryDetails:'AU|Australia';
				
			getGeolocation(countryinfo.split("|")[1],'country:' + (countryinfo.split("|")[0]),function(geodata)
			{
				if(geodata.length>0){
					localStorage.setItem('SISCountryGeometry', JSON.stringify(geodata[0].geometry));
					sisAutocomplete.setBounds(geodata[0].geometry.bounds)
				}

				
			})


			sisAutocomplete.setComponentRestrictions({country:( typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?(stockInStore.countryDetails.split("|")[0]):'AU'});
		}

		var pdata = {}
		var countryInfo 	=	{};
		countryInfo.code 	= selCountryCode;
		countryInfo.name 	= selCountryName;
		pdata.countryInfo  	= countryInfo ;
		stockInStore.sendEvents(elem,null,'ga','_trackEvent', 'Stock In Store', 'Select', 'Country','');
		stockInStore.sendEvents(elem,null,'sis','_trackEvent', 'Stock In Store', 'Select', 'Country',JSON.stringify(pdata));

		document.getElementById('uiLocationInp').value='';
		validateSearch();

		stockInStore.hideCountriesSelection()
	}


	/**
	 * 
	 */
	stockInStore.viewStoreDetails = function(storecode){
		var obStore = null;
		//First get the store detail
		for (var i=0;i<settings.dataCache.stores.length;i++){
			
			if(settings.dataCache.stores[i].code == storecode){
				obStore = cloneObject(settings.dataCache.stores[i]);
				break;
			}
		}
		if(obStore!==null){
			//console.log(obStore)

			var state = {};
			var title = "";
			var storeName = obStore.name 
			var url   =  (storeName).replace(/[^a-z0-9]/gi, '-').toLowerCase();

			history.pushState(obStore, null, "?store=" +  url);
			var innerStoreWrap = stockInStoreGlobal.querySelect('.sis-locator-inner-wrapper')[0]
			
			innerStoreWrap.style.position = "absolute";
			innerStoreWrap.style.left = "-10000px"
			var elemWrapper = document.getElementById("sis-locator-store-view")			
			Handlebars.registerPartial('fbhtmlStoreLocatorDetailTemplate', settings.htmlStoreLocatorDetailTemplate);

			var template = Handlebars.compile(settings.htmlStoreLocatorDetailTemplate);
			elemWrapper.innerHTML = template(obStore);


		}else{
			return false;
		}

	}
	/**
	 * gotomarker
	 * @private
	 */
	
	stockInStore.gotoMapMarker = function(storecode){
		var markerarray = settings.dataCache.storeLocator.mapInfo.mapMarkersArray;
			
		for (var i=0;i<markerarray.length;i++){
			
			if(markerarray[i].id == storecode){
				


				google.maps.event.trigger(markerarray[i], 'click');
			}
		}

	}

	stockInStore.getSelectedStore = function(){
		var storeCookieCode = stockInStoreGlobal.getCookie('_SISSTORECODEINFO');
		var storeLocalStorage = localStorage.getItem('SISSelectedStoreInfo');
		if(typeof(settings)!=='undefined'){
			if(storeLocalStorage!==null){
				settings.dataStore.selectedStore = JSON.parse(storeLocalStorage);
				
			}else{
				settings.dataStore.selectedStore = null
			}
			return 	settings.dataStore.selectedStore;
		}else{
			return null;
		}


	}

	stockInStore.selectStore = function(storecode){
		stockInStoreGlobal.setCookie('_SISSTORECODEINFO', storecode , 1440, '/');

		var selStoreData = JSON.stringify(getStoreInformationFromUnorderedList(storecode))
		//Add an expiry to the selStoreData
		

		localStorage.setItem('SISSelectedStoreInfo', selStoreData);




		setSelectedStoreListItem(storecode);
		var storeLocalStorage = localStorage.getItem('SISSelectedStoreInfo');
			settings.dataStore.selectedStore = JSON.parse(storeLocalStorage);


		//update any element on page
		
		var pdata = {}
		var storeEventsInfo = {}
		storeEventsInfo.storecode = storecode;
		storeEventsInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
		storeEventsInfo.storeListingInfo = settings.dataCache.storeListingInfo;
		pdata.storeEventsInfo = storeEventsInfo;
		addLogDataHideStores(pdata);
		stockInStore.sendEvents(this,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Stores - Select Store',JSON.stringify(pdata));
		stockInStoreGlobal.savedLogString = "";
		settings.dataStore.selectedStore = getStoreInformationFromUnorderedList(storecode);
		

		var storeNameElements  = document.querySelectorAll(".sis-cc-preferred-store")
		for(var s=0;s<storeNameElements.length;s++){
			var snameelm =storeNameElements[s].querySelector(".sis-cc-store-name")
			if(snameelm!==null){
				snameelm.innerText = settings.dataStore.selectedStore.label;
				
				stockInStoreGlobal.removeClassName(storeNameElements[s],'hideElement');
				var unselElem = storeNameElements[s].parentNode.querySelector(".sis-cc-unselected-store")
				if(unselElem!==null){
					stockInStoreGlobal.addClassName(unselElem,'hideElement');
				}
			}
		
		} 

		var storeInfoWidgetElements = document.querySelectorAll("#productFeature .sis-cc-store-info")

		for(var sti=0;sti<storeInfoWidgetElements.length;sti++){
			var snameelm =storeInfoWidgetElements[sti]
			if(snameelm!==null){
				stockInStoreGlobal.removeClassName(storeInfoWidgetElements[sti],'hideElement');
			}
		}


		var otherStoreNameElements = document.querySelectorAll(".sis-cc-store-name")
		for(var os=0;os<otherStoreNameElements.length;os++){
			var snameelm =otherStoreNameElements[os]
			if(snameelm!==null){
				snameelm.innerText = settings.dataStore.selectedStore.label;
			}
		
		} 

		//stockInStore.updateCNCStatus({index_type:'upi',index_value:settings.dataIdentifiers.product},false);
		//var elemWrapper = document.getElementById("sis-selected-store")
		//Handlebars.registerPartial('fbhtmlSelectedStoreTemplate', settings.htmlSelectedStoreTemplate);

		//var template = Handlebars.compile(settings.htmlSelectedStoreTemplate);
		//elemWrapper.innerHTML = template(settings);
		if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onStoreSelected)!=='undefined'){
			var retobj = {}
			retobj.selectedstore= settings.dataStore.selectedStore;
			if(settings.dataCache.productVariations!==null){
				if(typeof(settings.dataCache.productVariations.response)!=="undefined"){
					retobj.upis = settings.dataCache.productVariations.response;
				}
	
			}
				
			retobj.selectedproduct = {}
			retobj.selectedproduct.upi = settings.dataIdentifiers.product 
		

			callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onStoreSelected,retobj)
		}
		
	}

	/**
	 * 
	 * @param {*} storecode 
	 */
	var setSelectedStoreListItem = function(storecode){
		
		var storeList 	= document.getElementById('storesList');
		var storeElments  = storeList.querySelectorAll(".storeDetails")

		for(var i=0;i<storeElments.length;i++){
			var getStoreCode = storeElments[i].getAttribute('data-storecode');
			if(getStoreCode!==null){
				if(getStoreCode == storecode){
					stockInStoreGlobal.addClassName(storeElments[i],'sel');
				}else{
					stockInStoreGlobal.removeClassName(storeElments[i],'sel');
				}
			}
		}
	}

	

	/**
	 * When no stores are found
	 * @private
	 */
	var displayNoStores = function(withtemplate) {

	
		stockInStoreGlobal.removeClassName(document.getElementById('mobileSearch'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('mobileSearch'),'showElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('productSelection'),'showElement');
		stockInStoreGlobal.addClassName(document.getElementById('productSelection'),'hideElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('storeList'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('storeList'),'showElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('productFeatureControls'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('productFeatureControls'),'showElement');
		if(withtemplate)
		{
			var template = Handlebars.compile(settings.htmlNoStoreFoundTemplateBlock);
			document.getElementById('storeListResult').innerHTML = template(settings.dataCache);
		}else
		{
			document.getElementById('storeListResult').innerHTML = "";
		}

		

		if(!stockInStore.isQuickView){
			settings.fnOnDisplayNoStores.call(this,settings);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.eventName = 'onDisplayNoStores';
				sendQuickViewEvent(retObj);
		} 

		
		checkStoreNavigation();
	};
	
	
	/**
	 * Specific styling of individual store container within the store list
	 * only achievable with code rather than CSS
	 * @private
	 */
	 
	 
	var styleStoreElemContainer = function() {
		 
		 if(!stockInStore.isQuickView){
			settings.fnStyleStoresList.call(this,settings);
		}else{
			
			var retObj = {};
				retObj.settings = settings;
				retObj.eventName = 'onDisplayStores';
				sendQuickViewEvent(retObj);
	

				qvStyleStoresList();
		} 

		var getCookieLocationPCode = stockInStoreGlobal.getCookie('_SISLOCATIONPCODE');
		var searchStoresByState = false;
		var getStateSearch= "";
		if(settings.returnAllStoresInStateIfNoPostcode=="true" && getCookieLocationPCode==""){
			searchStoresByState = true;
			var getStateSearchString = stockInStoreGlobal.getCookie("_SISADDRESSCOMPONENTS");
			var arrComp = getStateSearchString.split(",")

			var findColoquial = false;

			for(var ci=0;ci<arrComp.length;ci++){
				var arrcompprop = arrComp[ci].split(":")[0]

				if(arrcompprop == "ca"){
					findColoquial = true;
				}

				if(arrcompprop == "ly"){
					findColoquial = true;
				}

				if(arrcompprop == "aal1"){
					getStateSearch = arrComp[ci].split(":")[1]
				}

				
			}
				
		}

		if(getStateSearch == ""){
			searchStoresByState = false;
		}
		if(findColoquial){
			searchStoresByState = false;
		}


		if(searchStoresByState){
			var kmaawayElms = stockInStoreGlobal.querySelect("#storesList .storeDistance small")
			for(var i=0;i<kmaawayElms.length;i++){
				kmaawayElms[i].style.display = "none";
			}
		}

		
		 checkStoreNavigation();
		 
	}
	 
	
	
	/**
	 * Manage the store navigation
	 * @private
	 */


	 var checkStoreNavigation = function() {
			 
			 
			 if(!stockInStore.isQuickView){
				settings.fnManageStoreNavigation.call(this,settings);
			} 
	
			 
		 
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
		 
		 	
			
			var leftPos 	= getLeftPost();

		 	if(leftPos==0)
			{
				stockInStoreGlobal.addClassName(document.getElementById("moreStoresPrevBtn"),'disabled');
			}else
			{
				stockInStoreGlobal.removeClassName(document.getElementById("moreStoresPrevBtn"),'disabled');
			}
			

			var storeList 	= document.getElementById('storesList');
			var widthStr = getWidthVal();
	
			var diffDis = widthStr  - Math.abs(leftPos) ;
			var multiplier = settings.objConfigStoreListContainer.storeElemcontainer.width * settings.objConfigStoreListContainer.storeElemcontainer.moveby;
			
			stockInStoreGlobal.removeClassName(document.getElementById("moreStoresNextBtn"),'disabled');
			
			if(diffDis<=settings.objConfigStoreListContainer.storeElemcontainer.width)
			{
				stockInStoreGlobal.addClassName(document.getElementById("moreStoresNextBtn"),'disabled');
			}
			
			if(diffDis<=multiplier)
			{
				stockInStoreGlobal.addClassName(document.getElementById("moreStoresNextBtn"),'disabled');
			}
			
	}
	 
	 
	 
	
	/**
	 * Map variation data: Massage the variation data indepently of the method used
	 * to get the data. The target format will be same
	 * @private
	 * @params {object} Passed raw variation object
	 * @params {function} callback function
	 * @returns {object} massaged variation data
	 */		
	 
	 
	var mapVariationData = function( data, callback ) {
		
		var variationDefinition = null;
	
		 //settings.fnMapVariationData.call(this,settings);
		settings.dataCache.productVariations = data;
		

		//Ensures that the data is escape from the source


		var datal = settings.dataCache.productVariations.response.length;


		//Assuming that all skus will have the same amount of variations
		//we then just use the first index of the sku list to get how many 
		//variations we are dealing with here
		if(datal>0)
		{
			var objind0 = settings.dataCache.productVariations.response[0];
			
			settings.dataVariations.arrayVariationInfo = [];
			
			var arrayLabelVariations=[];
			var countIndexObj = 0;
			
			for(var p in objind0) {

				if(p.indexOf('label_variation_')!=-1)
				{

					if(objind0[p]!='' && objind0[p]!=null && objind0[p] != 'null')
					{
						countIndexObj +=1 //label_variation_countIndexObj and variation_countIndexObj 
						
						settings.dataVariations.arrayVariationInfo.push({variationIndex:countIndexObj,variationLabels:objind0[p],variationValues:[],variationDefaultValue:''})
					}
				}
			}
			
			settings.dataVariations.totalVariations = countIndexObj; //We have the total Variations for this style

			var setarrlabels = settings.dataVariations.arrayVariationInfo;
			
			for(var i=0;i<setarrlabels.length;i++){
				for(var j=0;j<datal;j++){
					if(settings.dataCache.productVariations.response[j]['label_variation_'+setarrlabels[i].variationIndex]==setarrlabels[i].variationLabels){
						//If user selected product on page before then we need to get the default value
						if(settings.dataIdentifiers.product!=null){
							if(settings.dataCache.productVariations.response[j].upi == settings.dataIdentifiers.product){
								
								setarrlabels[i].variationDefaultValue = stockInStoreGlobal.decodeHTML(settings.dataCache.productVariations.response[j]['variation_'+setarrlabels[i].variationIndex]);
							}
						}
						
						setarrlabels[i].variationValues.push(stockInStoreGlobal.decodeHTML(settings.dataCache.productVariations.response[j]['variation_'+setarrlabels[i].variationIndex]))
					}
				}
				
				setarrlabels[i].variationValues = stockInStoreGlobal.setDistinctArray(setarrlabels[i].variationValues)
			}

		}
		if(callback != null) return callback.call(this)
	}
	

	/**
	 * Custom Helpers for templates
	 * @private
	 */	
	var registerCoreHelpers = function() {
		
		//Sample helper not in use
		Handlebars.registerHelper( 'storemasterlist', function( items, options ) {
		  var out = '<ul>';

		  for(var i=0, l=items.length; i<l; i++) {
			out = out + '<li>' + options.fn(items[i]) + '</li>';
		  }
		
		  return out + '</ul>';
		});

		Handlebars.registerHelper('escape', function(val) {
			return val.replace(/(['"])/g, '\\$1');
		});

		Handlebars.registerHelper('parsehtml', function(val) {
			
			var parser = new DOMParser();
			var dom = parser.parseFromString('<!doctype html><body>' + val, 'text/html');

			//Check if UL exist in content
			var tContent = dom.body.textContent;

			if(val.indexOf("<ul>")!==-1){
				
				var ulElem = dom.getElementsByTagName("ul")
				var lisElements = ulElem[0].children
				
				var retString = ""
				if(lisElements.length >0){
					retString = "<ul>"
					for(var i=0;i<lisElements.length;i++){
						var stringList = lisElements[i].innerText
						var strParser = new DOMParser();
						var strDom = parser.parseFromString('<!doctype html><body>' + stringList, 'text/html');
						//console.log(strDom.body.textContent)
						retString += "<li>" + strDom.body.textContent + "</li>"

					}
					retString += "</ul>"

					return retString;
				}else{
					return tContent;
				}
				
			}else{
				return tContent
			}
			

		});
		
		Handlebars.registerHelper( 'IFRadiusEqualsToDefault', function( val, opts ) {

   		 if(val == settings.objConfigRadius.defaultValue) 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});


		Handlebars.registerHelper( 'IFVariationsEqualsToDefault', function( val, opts ) {

   		 if(val == settings.objConfigRadius.defaultValue) 
        	return opts.fn(this);
	     else
    	    return opts.inverse(this);
		});


		Handlebars.registerHelper('IFEMPTY', function( val, opts ) {

   		 if(val == '' || val == 'null' || val == null || val.length==0 || typeof(val)=='object') 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});

		Handlebars.registerHelper('IFNOTEmpty', function( val, opts ) {
			
   		 if(val == '' || val == 'null' || val == null || val.length==0 || typeof(val)=='object') 
    	    return opts.inverse(this);

	    else
			return opts.fn(this);
		});

		Handlebars.registerHelper('IFE', function( val, val2, opts ) {
   		if(val == val2) 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});



		Handlebars.registerHelper('IFLT', function( val, val2, opts ) {
   		 if(val < val2) 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});

		Handlebars.registerHelper('IFLTE', function( val, val2, opts ) {
   		 if(val <= val2) 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});

		Handlebars.registerHelper('IFGT', function( val, val2, opts ) {
   		 if(val > val2) 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});

		Handlebars.registerHelper('IFGTE', function( val, val2, opts ) {
   		 if(val >= val2) 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});


		Handlebars.registerHelper('IFGTLT', function( val, val2, val3, opts ) {
   		 if(val > val2 && val < val3 ) 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});

		Handlebars.registerHelper('IFGTELTE', function( val, val2, val3, opts ) {
   		 if(val >= val2 && val <= val3 ) 
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});

		Handlebars.registerHelper( 'removeBlanks', function( string ) {
			if(string!=="" && string!== 'null' && string!=='undefined' && string)
			{
				return string.split(" ").join("");
			}else
			{
				return string;
			}
			
		})


		Handlebars.registerHelper( 'lowerCase', function( string ) {
			if(string!=="" && string!== 'null' && string!=='undefined' && string)
			{
				return string.toLowerCase();
			}else
			{
				return string;
			}
			
		})

		
		Handlebars.registerHelper('IFDEVICEMATCH', function( val, opts ) {
			if(navigator.userAgent.match(val)){
				return opts.fn(this);
			}else{
				return opts.inverse(this);
			}
		});


	

		Handlebars.registerHelper( 'checkdevice', function( devicestr ) {
			if(navigator.userAgent.match(devicestr)){
				return true;
			}else{
			}	
			
		});
		


		Handlebars.registerHelper( 'formatStockMessage', function( stockQuantity ) {
			var threshold = {
								limited:{value:3,message:'Call Store to Confirm',class:'limited'},
								unavailable:{value:0,message:'Sold Out',class:'unavailable'},
								available:{value:4,message:'Available',class:'available'}
							}
			var stockval = parseInt(stockQuantity);
			
			if(stockval==0){
				return '<strong class="' + threshold.unavailable.class + '">'  + threshold.unavailable.message + '</strong>';
			}else if(stockval>=threshold.available.value)
			{
				return '<strong class="' +threshold.available.class + '">' + threshold.available.message + '</strong>';
			}else if(stockval<=threshold.limited.value || stockval> threshold.unavailable.value )
			{
				var htmlmess = '<strong class="' + threshold.limited.class + '">' + threshold.limited.message + '</strong>';
				
				return htmlmess;
			}else if(stockval<= threshold.unavailable.value )
			{
				return '<strong class="' + threshold.unavailable.class + '">'  + threshold.unavailable.message + '</strong>';

			}else
			{
				return '<strong class="' + threshold.unavailable.class + '">'  + threshold.unavailable.message + '</strong>';
			}
			
		});
		

		Handlebars.registerHelper('formatlink', function ( context, options ) {
			var type = options.hash.maptype;
			switch (type) {
				case 'applemap':
					var retLink = 'https://maps.apple.com/?';
					var arryAddress = context.info.address_lines;
					var llLink = context.info.latitude + ',' + context.info.longitude;

					var addressstr = escape(arryAddress.join(" "));
					var arrOtherAddress = [];
					arrOtherAddress.push(context.info.city);
					arrOtherAddress.push(context.info.state);
					arrOtherAddress.push(context.info.postcode);
					arrOtherAddress.push(context.info.country);
					addressstr +=  "%20"  + escape(arrOtherAddress.join(" "));

					var storeName = escape(context.info.label)


					retLink += 'address=' + addressstr + '&ll=' + llLink + '&q=' + settings.strBrandName + (settings.strBrandName!==""?"%20":"") + storeName;

					return retLink;
				default :
					return 'javascript:void(0);';
			}
    	});

		
		Handlebars.registerHelper('format', function ( context, options ) {
			var type = options.hash.type;
			switch (type) {
				case 'price':
					return '$AUD ' + context; //formatPrice ...
				case 'percent':
					return formatPercent(context, options);
				case 'float':
					return formatFloat(context, options);
				case 'datelastimport':
					return formatDateLastImport(context, options);
				case 'jsontradinghours':
					return formatTradingHours(context, options);
				case 'ellipsis':
					return 	formatEllipsis(context,options);
				default :
					return;
			}
		});
		
		Handlebars.registerHelper('isstoreselected', function ( storecode ) {
			var getCookieStoreCode = stockInStoreGlobal.getCookie('_SISSTORECODEINFO');
			var getLocalSelStore = localStorage.getItem('SISSelectedStoreInfo');
			
			if(getLocalSelStore!==null ){
				var getLocalJSONSelStore = JSON.parse(getLocalSelStore);
				if(getLocalJSONSelStore.code == storecode){
					return "sel"
				}else{
					return ""
				}
			}else{
				return ""
			}

    	});
		

		Handlebars.registerHelper('cartItemsTotal', function ( items ) {
			
			var retVal = 0;

			if(items!==null && items!=="" && items!=="null"){
				for(var i=0;i<items.length;i++){
					retVal += parseInt(items[i].quantity)
				}
			}

			if(retVal<=0){
				return "";	
			}else{
				if(retVal==1){
					return retVal + " Item";
				}else{
					return retVal + " Items";
				}
			}
    	});


		
		
		function formatEllipsis(context, options){
			var charcount = options.hash.charcount || 32;
			var showtitle = options.hash.showtitle || "false";
			if(showtitle =="true"){
				return (context.length > charcount) ? ('<span title="'+  context + '">'  + context.substr(0, charcount-1) + '&hellip;') + '</span>' : context;
			}else{
				return (context.length > charcount) ? ( context.substr(0, charcount-1) + '&hellip;') : context;
			}
			


			//return ((context.length > parseInt(charcount) ?() (context.substr(0, parseInt(charcount)-1) + '&hellip;') : context);
		};
		
	   function formatPercent( context, options ) {
	        var fixed = options.hash.fixed || 2;
        	return  (context * 100).toFixed(fixed) + '%';
    	};
    	function formatFloat( context, options ) {
        	var fixed = options.hash.fixed || 2;
	        return  parseFloat(context).toFixed(fixed);
    	};
		
		function formatDateLastImport( context, options ) {
			var utime = context
			var datestrformat = options.hash.datestrformat || 'DDDD, ddd MMMM yyyy'; //set default formatting

			if(utime == 'null' || utime=='' || utime ==null)
			{
				return '';
			}else
			{	
				if(datestrformat == 'DDDD, ddd MMMM yyyy')
				{
					var dtstring =utime;
					
					var dstring = (dtstring.split(' ')[0]).split('-').join('/');
					var tstring = dtstring.split(' ')[1];
					var mtimestring =tstring.split(':')[0] + ':' + tstring.split(':')[1];
					
					var displayDateString = stockInStoreGlobal.toDateString(new Date(dstring),datestrformat);
					var displayTimeString = stockInStoreGlobal.formatTime(mtimestring);
					
					return displayDateString + ' at ' + displayTimeString; 
					
				}else if(datestrformat == 'DDD ddd MMM yyyy')
				{
					var dtstring =utime;
					var dstring = (dtstring.split(' ')[0]).split('-').join('/');
					var tstring = dtstring.split(' ')[1];
					var mtimestring =tstring.split(':')[0] + ':' + tstring.split(':')[1];
					var displayDateString = stockInStoreGlobal.toDateString(new Date(dstring),datestrformat);
					var displayTimeString = stockInStoreGlobal.formatTime(mtimestring);
					
					return displayTimeString + ' ' + displayDateString;
					
				}else if(datestrformat == 'local'){
					
					/*var localtime = new Date( utime.split(" ").join("T") + "Z");
					//to remove the st,nd,th -  use DDD dd MMM yyyy instead of DDDD, ddd MMMM yyyy
					var displayDateString = localtime.toDateString("DDD dd MMM yyyy");
					var hours = localtime.getHours();
					var minutes = localtime.getMinutes();
					var ampm = hours >= 12 ? 'pm' : 'am';
					hours = hours % 12;
					hours = hours ? hours : 12; // the hour '0' should be '12'
					minutes = minutes < 10 ? '0'+minutes : minutes;
					var displayTimeString = hours + ':' + minutes+ ampm;
					return displayTimeString + " " + displayDateString;
					*/



					var localtime = new Date( utime.split(" ").join("T") + "Z");
					//to remove the st,nd,th -  use DDD dd MMM yyyy instead of DDDD, ddd MMMM yyyy
					var displayDateString = stockInStoreGlobal.toDateString(localtime,"DDD dd MMM yyyy");
					var hours = localtime.getHours();
					var minutes = localtime.getMinutes();
					var ampm = hours >= 12 ? 'pm' : 'am';
					hours = hours % 12;
					hours = hours ? hours : 12; // the hour '0' should be '12'
					minutes = minutes < 10 ? '0'+minutes : minutes;
					var displayTimeString = hours + ':' + minutes+ ampm;
					return displayTimeString + " " + displayDateString;
				}else
				{
					return '';
				}
				
			}
			
			
		};
		
	
		function formatTradingHours(context, options){
			var tradingHours = "";

			var linecount = options.hash.linecount || 3;

			if(context!==null && context!=="" && context!=="null"){
						
				
						var jsoncon = context;
						var ol = Object.keys(jsoncon).length;
						var cnt = 0;
						var classline=""
						for (var prop in jsoncon){
								cnt ++;
								if(stockInStore.thresholdType == "cnc" && !stockInStore.isCncWidget){

									if(cnt <= linecount){
										classline = " tradinghrslineshow"
									}else{
										classline = " tradinghrslinehide"
									}
								}
								var objda = jsoncon[prop]
								tradingHours += "<li class='tradinghrsline" + classline + "'>"


								if(objda.occasionIcon!==null && objda.occasionIcon!=="" && objda.occasionName!==null && objda.occasionName!==""){
									
									var safeclassiconname = (objda.occasionName).toLowerCase().replace(/[^a-zA-Z0-9.]/g, "").split(" ").join("");
									
									
									tradingHours +=	"<span class='trading-icon'>"
									
									tradingHours +=		"<span alt='" + objda.occasionName + "' title='"+  objda.occasionName + "' class='" + safeclassiconname + "'>" + objda.occasionIcon + "</span>"
									tradingHours +=	"</span>"
								}

								tradingHours += 	"<span class='trading-info'>" 
								tradingHours +=			"<span class='trading-day'>" + prop.toLowerCase() + ":</span>" 
								tradingHours +=			"<span class='trading-hours'>"
								
								//only shows open 
								if(objda.open!==""){
									tradingHours +=				"<span class='trading-open'>"  + objda.open + "</span>" + " - " 
									tradingHours +=				"<span class='trading-close'>" +  objda.close  + "</span>" 
								}else{
									tradingHours +=				"<span class='trading-close'>Closed</span>" 
								}
								
								tradingHours +=			"</span>"
								tradingHours +=		"</span>"
								
								
								tradingHours +=	"</li>"
								
						}		

						if(stockInStore.thresholdType == "cnc" && !stockInStore.isCncWidget){
							tradingHours +=	"<li class='tradinghrsviewlinks'><a class='viewmoretradinghrs' onclick='stockInStore.viewMoreTradingHours(this);' href='javascript:void(0);'>View More</a><a class='viewlesstradinghrs' onclick='stockInStore.viewLessTradingHours(this);'href='javascript:void(0);'>View Less</a></li>"
						}

						if(tradingHours!==""){
							tradingHours = "<ul>" + tradingHours + "</ul>"
						}


				
			}


			return tradingHours;
		};
		
	
		Handlebars.registerHelper( 'if_eq', function( a, b, opts ) {
   		 if(a == b) // Or === depending on your needs
        	return opts.fn(this);
	    else
    	    return opts.inverse(this);
		});

		

		document.addEventListener("click", function (e) {
			var target = e.target;
		
			var _this = e;

			if(target == null || typeof(target)=="undefined" || typeof(target.classList) == "undefined"){
				return
			}
			
			
				if (target.classList.contains('sis-widget-button')){
					if(target.getAttribute('data-sis-config')==null){
						return				
					}
					
					var retObj = {};
					retObj.settings = settings;
					retObj.element = target;
					retObj.eventName = 'onClickWidget';
					sendQuickViewEvent(retObj);

					var dataSISConfig = JSON.parse(target.getAttribute('data-sis-config'))	
						settings.dataIdentifiers.product  = dataSISConfig.product.upi
						settings.dataIdentifiers.variation  = dataSISConfig.product.upi
						settings.dataIdentifiers.isindex = 0;
						settings.dataProduct.name =  dataSISConfig.product.name
						settings.dataProduct.image =	dataSISConfig.product.image
						settings.dataProduct.style = dataSISConfig.product.style

						if(typeof(dataSISConfig.thresholdtype)!=='undefined'){
							stockInStore.thresholdType = dataSISConfig.thresholdtype;
							stockInStore.tags.sis_module = dataSISConfig.thresholdtype;
							stockInStore.tags.sis_button = dataSISConfig.thresholdtype;
						}	

						if(typeof(dataSISConfig.tags)!=='undefined'){
							if(typeof(dataSISConfig.tags.segment)!=='undefined'){
								stockInStore.tags.sis_segment = dataSISConfig.tags.segment;
								
							}
						}

					
						stockInStore.checkSingleStockInStore(_this)
				}
			
		});


		//After registering all helpers AS Handlebars is set as DI then continue code execution
		switch (settings.dataCache.widgetType.toLowerCase()) {
			case 'homepage':
				break;
			case 'shopping bag':
				stockInStore.shoppingBagActivation();
				break;
			case 'landing':
				break;
			case 'search':
				break;
			case 'article':
				break;
			case 'member account':
				break;
			case '3rdparty':
				break;	
			case 'other':
				break;	
			case 'store locator':

				if (typeof google === 'object' && typeof google.maps === 'object'){
					stockInStore.locatorActivation()
				}else{
					var ma = document.createElement('script'); 
					ma.type = 'text/javascript'; 
					ma.async = 0;
					ma.src =   'https://maps.googleapis.com/maps/api/js?callback=stockInStore.locatorActivation' + (settings.strGoogleApiKey!==''?'&key=' +settings.strGoogleApiKey:'');
					var mas = document.getElementsByTagName('script')[1]; 
					mas.parentNode.insertBefore(ma, mas);

				}

				
				break;
			case 'category':
				stockInStore.categoryActivation()
				break;
			case 'checkout':

			
				/*if (typeof(google)=='undefined') 
				{
					
					var ma = document.createElement('script'); 
					ma.type = 'text/javascript'; 
					ma.async = 0;
					ma.src =   'https://maps.googleapis.com/maps/api/js?callback=stockInStore.checkoutActivation' + (settings.strGoogleApiKey!==''?'&key=' +settings.strGoogleApiKey:'');
					var mas = document.getElementsByTagName('script')[1]; 
					mas.parentNode.insertBefore(ma, mas);
				}else{
					stockInStore.checkoutActivation()
				}*/
			
				stockInStore.checkoutActivation()
				break;
			default :
				stockInStore.sisButtonActivation()
		}

		return settings.fnRegisterCustomHelpers.call(this);
	};

	/**
	 * 
	 * @param {*} obj 
	 */

	var cloneObject = function(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}
	
	/**
	 * Display widget
	 * @private
	 * @param {Object} options User settings
	 */	
	var displayWidget = function(iscncwidget) {
		var checkCncWidget = (iscncwidget!=='undefined' && iscncwidget == true);
		
		var clickcollectclass = "";
		stockInStore.isCncWidget = false;

		if(checkCncWidget){
			clickcollectclass = "clickcollectmodal showbag "
			stockInStore.isCncWidget = true;
		}
		//Clear cache window position
		settings.dataCache.windowPos = null;
		stockInStore.isCheckInStoreClick = false;
		
		//Get the window Position
		var doc = document.documentElement;
		var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
		var left = (window.pageXOffset || doc.scrollLeft)  - (doc.clientLeft || 0);
		
		//Save in Cache
		settings.dataCache.windowPos = {"top":top,"left":left};
		
		//Move to top
		document.documentElement.scrollTop = document.body.scrollTop = 0;

		var modalHTML = '';
		
		/* START MODAL */
		modalHTML +=	'<div class="sisContent">'
		//modalHTML +=		'<div class="modalOverlay">'
		modalHTML +=		'<div class="modalOverlay"></div>'
		modalHTML +=			'<div class="modalWrapper">'
		modalHTML +=				'<div class="modalContainer">'
		modalHTML +=	 				'<div class="modalContent">'
		modalHTML +=						'<a id="modalClose" href="javascript:void(0);" onclick="stockInStore.sendLinkEvents(this,\'Widget Closed\');"><span class="fal fa-times"></span></a>'
		modalHTML +=						'<div id="modalBodyContent" class="stockInStore"></div>'
		modalHTML +=					'</div>' 
		modalHTML +=				'</div>'
		modalHTML +=			'</div>'
		//modalHTML +=		'</div>'

		
		var checkModal = document.getElementById('storeStockModal');
		//var browserInfoObj = stockInStoreGlobal.detectDevice();
		//	Adding a class to the modal for secured/non-secured pages
		
		var secureClass = "ssloff";
		if (location.protocol === 'https:') {
			secureClass = "sslon";
		}
		
		var classPromoBanner = '';
		if(settings.promotionBannerImage1==""){
			classPromoBanner = ' hideBanner';
		}
					
		if(checkModal==null)
		{
			var div = document.createElement('div');
			div.setAttribute('id', 'storeStockModal');
			document.body.appendChild(div);
			
			checkModal = document.getElementById('storeStockModal');
			checkModal.innerHTML = modalHTML;
			

			//checkModal.setAttribute('class',browserInfoObj.browsername + ' showElement')
			checkModal.setAttribute('class',clickcollectclass  + secureClass + ' showElement' + classPromoBanner)
			
			registerModalEvents();
			
			//Add JS Fix for google location selection for IOS
			/*if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {	
				setTimeout(function() {	
					var container = document.getElementsByClassName('pac-container')[0];	
					container.addEventListener('touchend', function(e) {	
						e.stopImmediatePropagation();	
					});	
				}, 500);	
			}*/	 
			
		}else
		{
			//checkModal.setAttribute('class',browserInfoObj.browsername +  ' showElement')
			checkModal.setAttribute('class',clickcollectclass  + secureClass +  ' showElement' + classPromoBanner)
		}
		
		var template = Handlebars.compile(settings.htmlCanvasTemplate);
		
		if(checkCncWidget){
			Handlebars.registerPartial('fbhtmlProductFeatureProductDetailsTemplate', settings.htmlCnCProductFeatureProductDetailsTemplate);
			Handlebars.registerPartial('fbhtmlProductFeatureControlTemplate', settings.htmlCnCProductFeatureControlTemplate);
			Handlebars.registerPartial('fbhtmlProductFeatureProductVariationsTemplate', "");
		
			Handlebars.registerPartial('fbhtmlProductVariationTemplate', "");
	
		}else{
			Handlebars.registerPartial('fbhtmlProductFeatureProductDetailsTemplate', settings.htmlProductFeatureProductDetailsTemplate);	
			Handlebars.registerPartial('fbhtmlProductFeatureControlTemplate', settings.htmlProductFeatureControlTemplate);

			Handlebars.registerPartial('fbhtmlProductFeatureProductVariationsTemplate', settings.htmlProductFeatureProductVariationsTemplate);
			Handlebars.registerPartial('fbhtmlProductVariationTemplate', settings.htmlProductVariationTemplate);
	
		}
		

		
		Handlebars.registerPartial('fbhtmlSearchCountriesTemplate', settings.htmlSearchCountriesTemplate);

		Handlebars.registerPartial('fbhtmlSearchLocationTemplate', settings.htmlSearchLocationTemplate);
		
		Handlebars.registerPartial('fbhtmlSearchRadiusTemplate', settings.htmlSearchRadiusTemplate);
		Handlebars.registerPartial('fbhtmlSearchControlsTemplate', settings.htmlSearchControlsTemplate);
		
		Handlebars.registerPartial('fbhtmlAdsTemplate1',settings.htmlAdsTemplate1);
		Handlebars.registerPartial('fbhtmlAdsTemplate2',settings.htmlAdsTemplate2);
		Handlebars.registerPartial('fbhtmlAdsTemplate3',settings.htmlAdsTemplate3);
		Handlebars.registerPartial('fbhtmlAdsTemplate4',settings.htmlAdsTemplate4);
		
		Handlebars.registerPartial('fbhtmlPromotionTileTemplate',settings.htmlPromotionTileTemplate);
		Handlebars.registerPartial('fbhtmlPromotionBannerTemplate',settings.htmlPromotionBannerTemplate);
		
		Handlebars.registerPartial('fbhtmlStoreListNavigationTemplate', settings.htmlStoreListNavigationTemplate);
		Handlebars.registerPartial('fbhtmlStoreListResultOnLoadTemplate', settings.htmlStoreListResultOnLoadTemplate);		
		Handlebars.registerPartial('fbhtmlReserveInStoreTemplate', settings.htmlreserveInStoreTemplate);		
		
		Handlebars.registerPartial('fbhtmlCnCStoreListingSectionTemplate', settings.htmlCnCStoreListingSectionTemplate);						
						
		// data is passed to above template
		var output = template(settings);

		document.getElementById('modalBodyContent').innerHTML = output;

		

		stockInStoreGlobal.addClassName(document.body,'stockInStoreActive');
		
			var attrdis = document.createAttribute('onkeypress');
			attrdis.value = 'javascript:stockInStore.handleLocationEvents(this,event);';
			document.getElementById('uiLocationInp').setAttributeNode(attrdis);
		
			var attrdis_b = document.createAttribute('onkeydown');
			attrdis_b.value = 'javascript:stockInStore.handleLocationValue(this,event);';
			document.getElementById('uiLocationInp').setAttributeNode(attrdis_b);

			//Places API Switch
			if(settings.useLocationAutoComplete == 'true'){
				var attrdis = document.createAttribute('onblur');
				attrdis.value = 'javascript:stockInStore.getLocationFromInput();';
				document.getElementById('uiLocationInp').setAttributeNode(attrdis);
			}else{

				var attrdis = document.createAttribute('onblur');
				attrdis.value = 'javascript:stockInStore.validateLocation(this);';
				document.getElementById('uiLocationInp').setAttributeNode(attrdis);
			}



		if (typeof google === 'object' && typeof google.maps === 'object'){
			if(settings.useLocationAutoComplete == 'true'){
				stockInStore.initialiseLocationServices();
			}else{
				stockInStore.initUI();
			}
		}else{
			var ma = document.createElement('script'); 
			ma.type = 'text/javascript'; 
			ma.async = 0;
			if(settings.useLocationAutoComplete == 'true'){
				ma.src =   'https://maps.googleapis.com/maps/api/js?libraries=places&callback=stockInStore.initialiseLocationServices' + (settings.strGoogleApiKey!==''?'&key=' +settings.strGoogleApiKey:'');

			}else{
				ma.src =   'https://maps.googleapis.com/maps/api/js?libraries=places&callback=stockInStore.initUI' + (settings.strGoogleApiKey!==''?'&key=' +settings.strGoogleApiKey:'');

			}
			var mas = document.getElementsByTagName('script')[1]; 
			mas.parentNode.insertBefore(ma, mas);
		}
	
		
	};



	/**
	 * 
	 */
	stockInStore.viewMoreTradingHours = function(elm){
		//var parentElemt = elm.parentNode.parentNode;
		//parentElemt.className = "expand";
		var highlightClass = "";
		if(settings.highlightSelectedStore == 'true'){
			highlightClass = " standout"
		}

		document.getElementById('storesList').className = "expand" + highlightClass;
	};

	stockInStore.viewLessTradingHours = function(elm){
		//var parentElemt = elm.parentNode.parentNode;
		//parentElemt.className = "collapse";
		var highlightClass = "";
		if(settings.highlightSelectedStore == 'true'){
			highlightClass = " standout"
		}

		document.getElementById('storesList').className = "collapse" + highlightClass;
	};


	stockInStore.viewBagItems = function(elm){
		var checkModal = document.getElementById('storeStockModal');
		stockInStoreGlobal.addClassName(checkModal,'showbagpopup');
	}

	stockInStore.closeBagItems = function(elm){
		var checkModal = document.getElementById('storeStockModal');
		stockInStoreGlobal.removeClassName(checkModal,'showbagpopup');
	}
	
	/**
	 * 
	 */
	
	/**
	 * Get the location object (lat & long from the location field)
	 * @private
	 */	
	stockInStore.getLocationFromInput = function() {
		
		var place  = sisAutocomplete.getPlace();
		var geobj = {}
		
		if(typeof(place)!=='undefined' && typeof(place.geometry)!=='undefined'){

			geobj.lat = place.geometry.location.lat();
			geobj.lng = place.geometry.location.lng();
			
			var addressString = getAddressStringFromComponent(place)
			
			stockInStoreGlobal.setCookie('_SISLOCATIONLAT', geobj.lat , 8760, '/');						
			stockInStoreGlobal.setCookie('_SISLOCATIONLNG', geobj.lng , 8760, '/');
			
			
			if(place.formatted_address == '' || place.formatted_address == 'Australia')
			{
				document.getElementById('uiLocationInp').value='';
				stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', "" , 8760, '/');						
				stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', "", 8760, '/');
			}else
			{
				document.getElementById('uiLocationInp').value  = place.formatted_address;
				stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', place.formatted_address , 8760, '/');						
				stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', addressString, 8760, '/');
				
				var getPostCode = getAddressComponents(place.address_components,'postal_code');
				
				if(getPostCode!=="")
				{
					stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', getPostCode , 8760, '/');
				}else{
					stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', "", 8760, '/');
				}
			}
			settings.dataCache.geolocationObj = geobj;
		}else{
			var getCookieLocationAddress = stockInStoreGlobal.getCookie('_SISLOCATIONADDRESS');
			if(getCookieLocationAddress!==""){
				document.getElementById('uiLocationInp').value = getCookieLocationAddress;
			}else{
				
			}
			document.getElementById('uiLocationInp').value = "";
		}

		
		validateSearch();
	};
	
	/*
		Scans a DOM for all data attributes
		@private
	*/
	 var getDataAttributes = function(elm,obj)
	 {
		for (var i = 0; i < elm.attributes.length; i++) {
			 //	only attributes starting with data-
			 var subAttrName = (elm.attributes[i].name.substring(0, 5)).toLowerCase();
			 if( subAttrName == "data-")
			 {
				 var subAttrNameRem = ((elm.attributes[i].name.substring(5, (elm.attributes[i].name.length))).toLowerCase()).split("-").join("")
				 obj[subAttrNameRem] = escape(elm.attributes[i].value);
			 }
			}			
	 }	
	
	/**
	 * Breaks the Google place address components into a string
	 * With Abbreviated properties to save cookie space
	 */
	
	var getAddressStringFromComponent = function(place)
	{
		var retString = "";
		if(typeof(place.address_components)!='undefined' && place.address_components.length >0)
		{
			var arrComp = [];
			var plcComp = place.address_components;

			var plcCompL = place.address_components.length;
			for(var plc=0;plc<plcCompL;plc++)
			{
				var typec = plcComp[plc].types[0]
				if( typec== "administrative_area_level_1")
				{
					typec = "aal1"
				}else if (typec== "administrative_area_level_2")
				{
					typec = "aal2"
				}else if (typec== "administrative_area_level_3")
				{
					typec = "aal3"
				}else if (typec== "administrative_area_level_4")
				{
					typec = "aal4"
				}else if (typec== "administrative_area_level_5")
				{
					typec = "aal5"
				}else if(typec== "intersection")
				{
					typec = "itn"
				}else if(typec== "political")
				{
					typec = "pl"					
				}else if(typec== "street_number")
				{
					typec = "stn"
					
				}else if(typec== "colloquial_area")
				{
					typec = "ca"
				}else if(typec== "neighborhood")
				{
					typec = "ngd"
				
				}else if(typec== "premise")
				{
					typec = "pm"				
				}else if(typec== "subpremise")
				{
					typec = "spm"				
					
				}else if(typec== "sublocality_level_1")
				{
					typec = "slyl1"					
				}else if(typec== "sublocality_level_2")
				{
					typec = "slyl2"					
				}else if(typec== "sublocality_level_3")
				{
					typec = "slyl3"					
				}else if(typec== "sublocality_level_4")
				{
					typec = "slyl4"					
				}else if(typec== "sublocality_level_5")
				{
					typec = "slyl5"					

				}else if(typec== "locality")
				{
					typec = "ly"
				}else if(typec== "postal_code")
				{
					typec = "pcde"
				}else if(typec== "route")
				{
					typec = "rte"					
				}else if(typec== "country")
				{
					typec = "cnty"
				}
				
				arrComp.push(typec + ":" + plcComp[plc].short_name)
			}
			retString = arrComp.toString();
		}

		return retString;
	}

	/**
	 * Register Widget related events
	 * @private
	 */	
	var registerModalEvents = function() {
		//Close Widget
		stockInStoreGlobal.addEvent(document.getElementById('modalClose'),'click',stockInStore.hideWidget);
		
	};
	
	
	
	/**
	 * Checks if a sku (variation 1 & variation 2...) has been selected on the product page
	 * in order to set the default value of the variation within the SIS Widget
	 * @private
  	 */
	var checkSelectedIdentifiers = function() {
		if(!stockInStore.isCncWidget){

			var arrVarDef = settings.dataVariations.arrayVariationInfo
			if(settings.dataIdentifiers.product!='')
			{
				
				for(var i=0;i<arrVarDef.length;i++)
				{
					var elem = stockInStoreGlobal.querySelect('.sisvar_' + arrVarDef[i].variationIndex)[0];
					
					elem.value = arrVarDef[i].variationDefaultValue;
					stockInStoreGlobal.triggerEvent(elem,'change');
				}
			}else
			{
				if(typeof(arrVarDef)!='undefined' && arrVarDef.length >0)
				{
					//if there is only 1 variation in the drop down and isVariationSelected is set to 'true' then select it
					if(	settings.isVariationSelected == "false")
					{
						var elem = stockInStoreGlobal.querySelect('.sisvar_' + arrVarDef[0].variationIndex)[0];
						stockInStoreGlobal.triggerEvent(elem,'change');
					}else{
						for(var i=0;i<arrVarDef.length;i++)
						{
							var elem = stockInStoreGlobal.querySelect('.sisvar_' + arrVarDef[i].variationIndex)[0];
							
							if(elem.options.length == 2 ) //if there is only one variation then preselect it
							{
								elem.selectedIndex = "1";
								stockInStoreGlobal.triggerEvent(elem,'change');
							}
						}
					}
				}
	
			}
	
		}
		
		validateSearch();
	};	
	

	/**
	 * Inititalise ads content
	 * @private // TO BE RE-IMPLEMENTED	based on ads service currently for google ads
	 * @note : need to find a service that allow opening the ad link in another window (google ad does not allow as )
	 */
	var loadAds = function() {
		var adsbygoogleElems = stockInStoreGlobal.querySelect('.adsbygoogle');
		if(adsbygoogleElems .length >0)
		{
			stockInStoreGlobal.getScript( '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', function() {

					for(var i=0;i<adsbygoogleElems.length;i++)
					{
						(adsbygoogle = window.adsbygoogle || []).push({});
					}
			});	

		}
	};

	
	
	/**
	 * Inititalise the User interface (Widget content) after Widget is displayed
	 * @private 	
	 */
	stockInStore.initUI = function() {	
		//initialiase UI DATA
		settings.dataCache.radiusSearch = settings.objConfigRadius.defaultValue;
		
		
		//We check if Page is https to hide or show the current location Button
		 if("https:" !== document.location.protocol){
			 var parentUIL = document.getElementById('uiCurrentLocationBtn').parentNode
			 if(parentUIL!==null){
	 			stockInStoreGlobal.addClassName(parentUIL,'hideElement');
			 }
		 }
		


		 var getCountryCode = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?(stockInStore.countryDetails.split("|")[0]):'AU'
		 stockInStore.initialiseStoreCountry(getCountryCode,true)
	
	 
		if(!stockInStore.isQuickView){
			settings.fnOnDisplayWidget.call(this,settings);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.eventName = 'onDisplayWidget';
				sendQuickViewEvent(retObj);
		} 

		
		checkAddToBasketButton();
		checkSelectedIdentifiers(); //to be able to set the default value of variations we need to populate the object before data binding 
		loadAds();
	};
	


	/**
	 * 
	 * @param {*} pcallback 
	 */

	 var checkAddToBasketButton = function(){

		//Hide add to basket on checkout
		if(settings.dataCache.widgetType == "product"){

			//For client testing we put a sisshowaddtobag
			if(stockInStoreGlobal.getQueryString('sisshowaddtobag')!==''){
				if(settings.showSisButton == "true"){ //add to bag is enabled
					if(settings.hideAddToBasket == "true"){
						var elms = document.querySelectorAll('#storeStockModal .uiAddProductSelectionBtn');
						for (var i=0;i<elms.length;i++){
							elms[i].parentNode.style.display = 'inline';
						}
					}
				}
			} 

		}else{

			var elms = document.querySelectorAll('#storeStockModal .uiAddProductSelectionBtn');
			for (var i=0;i<elms.length;i++){
				elms[i].style.display = 'none';
			}

		}
		


	 }

	/**
	 * Get Location from Third party service
	 */
	var	getLocationInfo = function(pcallback){

		var getSavedCountryCK = stockInStoreGlobal.getCookie('_SIS_COUNTRY');


		//We check if there is a cookie saved before calling the server 

		if(getSavedCountryCK =="" || getSavedCountryCK == null || typeof(getSavedCountryCK) =='undefined'){
			var requestObj =  stockInStoreGlobal.ajaxRequest();
			requestObj.open('POST',_stockinstore[0].applicationurl + '/address/getCountryDetails',true);
			requestObj.withCredentials = true;
			requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
			requestObj.onreadystatechange = function ()
			{
				if (requestObj.readyState == 4) {
					if(requestObj.status == 200){
						var locationdata = JSON.parse(requestObj.responseText)
						if(typeof(locationdata.response.country_code)!='undefined' && typeof(locationdata.response.country_name)!=='undefined'){
							if(locationdata.response.country_code != null && locationdata.response.country_name != null){
								stockInStoreGlobal.setCookie('_SIS_COUNTRY', locationdata.response.country_code + "|" + locationdata.response.country_name  , 30, '/'); //expire after 30 minutes
								//stockInStoreGlobal.setCookie('_SIS_REGION', locationdata.response.region_code + "|" + locationdata.response.region_name  , 30, '/'); //expire after 30 minutes
								stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', "" , 8760, '/');						
								stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', "", 8760, '/');	

							}
						}

						if(pcallback != null) return pcallback.call(this,JSON.parse(requestObj.responseText));
					}else{
						stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getLocationInfo " ,"Unable to get location info: " + JSON.stringify(requestObj));	
					}
					
					
				}
			}
			requestObj.send('widget=' + settings.dataCache.widgetId +
							'&info=none&isajax=1');
		}else{
			var data = {};
			data.response = {};
			data.response.country_code ="";
			data.response.country_name ="";

			if(getSavedCountryCK.indexOf("|")!=-1){
				data.response.country_code = getSavedCountryCK.split("|")[0]
				data.response.country_name = getSavedCountryCK.split("|")[1]
			}

			 
			if(pcallback != null) return pcallback.call(this,data);
		}
		
		
	}
	

	/**
	 * Check if Location information exist
	 * If no location information then call freegeoip to get longitute and lattitude
	 * Reverse Geocode to get the address
	 * @private 	
	 */
	var validateSearch = function()
	{
		var getCookieLocationLat = stockInStoreGlobal.getCookie('_SISLOCATIONLAT');
		var getCookieLocationLng = stockInStoreGlobal.getCookie('_SISLOCATIONLNG');

		validatePostSearch();

		/*if(getCookieLocationLat=="" && getCookieLocationLng=="")
		{
			if(settings.isLocationAutoPopulated == "true"){	
				getLocationInfo(function(locationdata){
					
					if(locationdata!=="")
					{
						stockInStore.getCurrentGeolocation(null)					
						
					}else
					{
						validatePostSearch();	
					}
				})
			}else{
				
				//var findLocationButton = stockInStoreGlobal.querySelect('#searchLocation .buttonWrap');
				//if(findLocationButton.length > 0){
				//stockInStoreGlobal.removeClassName(findLocationButton[0],'hide');
				//}
				validatePostSearch();	
			}
			
		}else
		{
			validatePostSearch();	
		}*/
		
		
	}
	
	/**
	 * Validate the search form variations location and radius need to be selected before searching for stores
	 * @private 	
	 */
	var validatePostSearch = function() {
		var valid = true;
		
		//validate variations
		var sisvariationsList		=	document.getElementsByClassName('sisvar');
		for (var i = 0; i < sisvariationsList.length; i++) 
		{
			var getVarVal = sisvariationsList[i].options[sisvariationsList[i].selectedIndex].value
			if(getVarVal.length<=0)
			{
				stockInStoreGlobal.addClassName(sisvariationsList[i],'invalid');
				valid = false;
			}else
			{
				stockInStoreGlobal.removeClassName(sisvariationsList[i],'invalid');
			}
		}
		
		//Check if location is saved
		var getCookieLocationAddress = stockInStoreGlobal.getCookie('_SISLOCATIONADDRESS');
		var getCookieLocationLat = stockInStoreGlobal.getCookie('_SISLOCATIONLAT');
		var getCookieLocationLng = stockInStoreGlobal.getCookie('_SISLOCATIONLNG');
		var getCookieAddressComponent	=	stockInStoreGlobal.getCookie('_SISADDRESSCOMPONENTS');
		
		if(getCookieLocationLat!=="" && getCookieLocationLng!=="")
		{
			var geobj = {}
			geobj.lat = getCookieLocationLat;
			geobj.lng = getCookieLocationLng;
			settings.dataCache.geolocationObj = geobj;
		}
		
		if(getCookieLocationAddress!=="")
		{
			document.getElementById('uiLocationInp').value = getCookieLocationAddress;
		}
		
		//validate location field
		var location = document.getElementById('uiLocationInp').value;
		if(location.length<=0)
		{
			stockInStoreGlobal.addClassName(document.getElementById('uiLocationInp'),'invalid');
			stockInStoreGlobal.addClassName(document.getElementById('uiCurrentLocationBtn'),'invalid');
			valid = false;
		}else
		{
			stockInStoreGlobal.removeClassName(document.getElementById('uiLocationInp'),'invalid');
			stockInStoreGlobal.removeClassName(document.getElementById('uiCurrentLocationBtn'),'invalid');

		}
		
		if(stockInStore.ErrorLoadingMapAPI){

			stockInStoreGlobal.addClassName(document.getElementById('uiLocationInp'),'invalid');
			stockInStoreGlobal.addClassName(document.getElementById('uiCurrentLocationBtn'),'invalid');
			valid = false;

		}

		
		
		if(!valid)
		{
			if(settings.dataCache.widgetType == "product" || stockInStore.isQuickView){
				stockInStoreGlobal.addClassName(document.getElementById('uiSearchGoBtn'),'disabled');
				
				if(!document.getElementById('uiSearchGoBtn').hasAttribute('disabled')){
					var attrdis = document.createAttribute('disabled');
					attrdis.value = 'disabled';
					document.getElementById('uiSearchGoBtn').setAttributeNode(attrdis);
				}else{
					document.getElementById('uiSearchGoBtn').setAttribute('disabled','disabled')
				}
			}
		}else
		{

			if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onProductSelected)!=='undefined'){
				var retobj = {}
				var selupis = null;
				if(typeof(settings.dataCache.productVariations.response)!=="undefined"){
					retobj.upis = settings.dataCache.productVariations.response;
				}
					
					retobj.selectedproduct = {}
					retobj.selectedproduct.upi = settings.dataIdentifiers.product 
					
				callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onProductSelected,retobj)
			}
			if(settings.dataCache.widgetType == "product" || stockInStore.isQuickView){
				stockInStoreGlobal.removeClassName(document.getElementById('uiSearchGoBtn'),'disabled');
				document.getElementById('uiSearchGoBtn').removeAttribute('disabled'); 
				
				if(settings.isFindStockInStoreAuto == "true"){
					if(settings.dataCache.isWidgetDisplayed==null)
					{
						stockInStore.findNearestStores(document.getElementById('uiSearchGoBtn'));
						settings.dataCache.isWidgetDisplayed = 'displayed'
					}else{
						document.getElementById('uiSearchGoBtn').focus();
					}
				}else{
					document.getElementById('uiSearchGoBtn').focus();
				}

			}else{
				stockInStoreGlobal.removeClassName(document.getElementById('uiSearchGoBtn'),'disabled');
				document.getElementById('uiSearchGoBtn').removeAttribute('disabled'); 
				document.getElementById('uiSearchGoBtn').focus();
				//stockInStore.findNearestStores(document.getElementById('uiSearchGoBtn'));
			}
		}
	};
	
	
  	/**
	 * Get the width of the store list container
	 * @private 	
	 * @return {string} width in px
	 */
	var getWidthVal = function() {
		var storeList = document.getElementById('storesList');
		if(storeList!==null)
		{
			var widthStr 	= storeList.style.width;
			if(widthStr=='')
			{
				widthStr = 0;
			}else
			{
				widthStr = parseInt(widthStr.replace('px',''));				
			}
		}else
		{
			var widthStr = 0;
		}
				
		return widthStr;	
	};	
	

	/**
	 * Get the left position of  the store list container
	 * @private 	
	 * @return {string} width in px
	 */
	var getLeftPost = function() {
		var storeList 	= document.getElementById('storesList');
		if(storeList!==null)
		{
			var mleftStr 	 = storeList.style.marginLeft;
			
			if(mleftStr=='')
			{
				mleftStr = 0;
			}else
			{
				mleftStr = parseInt(mleftStr.replace('px',''));				
			}
				
				var leftPos = mleftStr;
			
		}else
		{
				var leftPos = 0;
		}
		return leftPos;
	};	 
	 
	/**
	 * Array Sort order function for sorting stores by distance (closest first)
	 * @private
	 * @param  {obj property} distance
 	 * @param  {obj property} distance
	 * @return {obj property} closest
	 */
	var compareDistance =function( a, b ) {
		return a.distance - b.distance;
	};	 


	/**
	 * 
	 */
	var compareStoreName = function(a, b){
			if(a.name.toLowerCase() < b.name.toLowerCase()) { return -1; }
			if(a.name.toLowerCase() > b.name.toLowerCase()) { return 1; }
			return 0;
	}

	/**
	 * 
	 */

	var runBotCheck= function(){

		// 	Only do the check if the cookie is not set
		stockInStore.botCheck = stockInStoreGlobal.getCookie('_SIS_BOT_CHECK');

		if(stockInStore.botCheck==""){
			if(typeof(SISBotDetector) == "function"){
				var SISInsBotDetector = new SISBotDetector({
					timeout: 60000,
					callback: function(result){
						if (!result.isBot) {
							var pdata	= {};
								pdata.isBot = false;
							stockInStore.botCheck = 'true';
							stockInStoreGlobal.setCookie('_SIS_BOT_CHECK',  'true'  , 30, '/');
							stockInStore.sendEvents(null,null,'sis','_trackEvent', 'Stock In Store', 'BotTest', 'Session Bot Test',JSON.stringify(pdata));		
						}
					}
				}).monitor();
			}
		}
		
	}

	/**
	 * Display loading overlay 
	 */

	 var showProcessing = function(){
		stockInStoreGlobal.removeClassName(document.getElementById('processingSisMessage'),'hideElement');
	 }

	/**
	 * Hide 
	 */
	var hideProcessing = function(){
		stockInStoreGlobal.addClassName(document.getElementById('processingSisMessage'),'hideElement');
		
	}


	/**
	 * 
	 */
	var hoverSisButtton = function(e){
		
		if(e.target.getAttribute('data-hover')!==null){
			return				
		}
		e.target.setAttribute('data-hover',"true");
		stockInStore.sendEvents(elem,null,'sis','_trackEvent', 'Stock In Store', 'BotTest', 'Session Bot Test','');		
	}


	/**
	 * Utils function to Call user defined function accessing public sis functions
	 * @param {*} obj 
	 * @param {*} objtype 
	 * @param {*} objfn 
	 * @param {*} objparam 
	 */
	var callExtOjectFn = function(obj,objtype,objfn,objparam){

		
		if(typeof(obj)!=='undefined'){
		
			if(typeof(objtype)!=='undefined'){
				if(typeof(objfn) == 'function'){
					
					objfn(objparam)
				}
			}
		}
	}

	/** ------------------------
	 *	PUBLIC METHODS
	 *  -------------------------
	 */


	/**
	*
	*/
	
	stockInStore.handleLocationEvents = function(element,e){
		
		if (e.keyCode == 13) {
			stockInStore.validateLocation(element);
			return false;
    	}
	}

	/**
	 * 
	 */
	stockInStore.handleLocationValue= function(element,e){
			
			var valEl = element.value
			
			if(valEl.split(" ").join("").length >0){
				document.getElementById('uiSearchGoBtn').removeAttribute('disabled');
			}

	}

	
	/**
	* Reserve in store
	* Not Fully Implemented just the backbone
	*/
	stockInStore.openReserveInStore = function(elem,section,storecode){
		stockInStoreGlobal.setCookie('_SISSTORECODEINFO', storecode , false, '/');
		stockInStoreGlobal.addClassName(document.getElementById('reserveInStore'),'show');
		
		var checkSection = document.getElementById(section);
		checkSection.setAttribute('data-store-code',storecode)

		
		stockInStore.displayReserveInStoreSection(section)
	}


	/**
	* 
	* @public
	* @param 
	*/
	stockInStore.closeReserveInStore = function(){
		
		stockInStore.displayReserveInStoreSection("")
		stockInStoreGlobal.removeClassName(document.getElementById('reserveInStore'),'show');
	}
	
	/**
	 * 
	 * @public
	 * @param 
	 */
	stockInStore.displayReserveInStoreSection = function(section){
		

		//hide all other section
		var sections = document.getElementsByClassName("ris-section")
		
		for (var i = 0; i < sections.length; i++) 
		{
			stockInStoreGlobal.removeClassName(sections[i],'show');
		}
		if(section!=="")
		{
			stockInStoreGlobal.addClassName(document.getElementById(section),'show');
		}
	}

	/**
	 * 
	 * @public
	 * @param 
	 */
	stockInStore.sendReservation = function(reservationform)
	{
		var frmReserve = document.getElementById(reservationform);
		
		var risUserDataObj 				= {}
			risUserDataObj.email 		= frmReserve.getElementsByClassName('ris-user-email')[0].value;
			risUserDataObj.mobilenumber = frmReserve.getElementsByClassName('ris-user-mobile-number')[0].value;
			risUserDataObj.firstname 	= frmReserve.getElementsByClassName('ris-user-first-name')[0].value;			
			risUserDataObj.quantity 	= frmReserve.getElementsByClassName('ris-user-quantity-reserve')[0].value;			

	
		
		//Ajax post
		//Ajax Result : 
		//if first time user then redirect to verification section
		//stockInStore.displayReserveInStoreSection('ris-verfity')
		//else
		//stockInStore.displayReserveInStoreSection('ris-complete')
		
		//if(Math.floor(Math.random() * 2)>0)
		//{
			stockInStore.displayReserveInStoreSection('ris-verify')
		//}else
		//{
		//	stockInStore.displayReserveInStoreSection('ris-complete')
		//}
	}
	
	/**
	 * 
	 * @public
	 * @param 
	 */
	stockInStore.verifyReservation = function(verificationform)
	{
		var frmVerification = document.getElementById(verificationform);
		var verficationCode = frmVerification.getElementsByClassName('ris-verification-code')[0].value;
		stockInStore.displayReserveInStoreSection('ris-complete')
	}
	
	/**
	* Swap Image
	*/
	stockInStore.swapImage = function(e,image)
	{
		e.setAttribute('src',image)
	}
	
	/**
	 * Executed from activation script when widget is loaded on page 
	 * @public
	 * @param {Object} customise activation options (extending core default options)
	 */
	stockInStore.activate = function ( options ) {
		
		// Destroy any existing initializations
		stockInStore.destroy();

		// Merge user options with defaults
		settings = extend( defaults, options || {} );
	
		/** Check if  */

		var widgets =	stockInStoreGlobal.querySelect('[data-sis-widget-id]')
		//Check the widget type
		if(widgets.length > 0 ){
			settings.dataCache.widgetDescription = widgets[0].getAttribute('data-sis-widget-description')
			settings.dataCache.widgetId = widgets[0].getAttribute('data-sis-widget-id');
			var getPagetype = widgets[0].getAttribute("data-widget-type")
			if(getPagetype !== null){
				
				settings.dataCache.widgetType = getPagetype  	

				//Check if pagetype property has been defined
				stockInStore.tags.sis_page = settings.dataCache.widgetType;
			}	
		}else{
			
			var sisactivate = false;
			
			if(typeof(_stockinstore.sis_pagetype)!=='undefined'){
				settings.dataCache.widgetType = _stockinstore.sis_pagetype;
				stockInStore.tags.sis_page = settings.dataCache.widgetType;
				sisactivate = true;
			}

			if(typeof(_stockinstore.sis_widget_description)!=='undefined' &&  typeof(_stockinstore.sis_widget_id)!=='undefined'){

				settings.dataCache.widgetDescription = _stockinstore.sis_widget_description;
				settings.dataCache.widgetId = _stockinstore.sis_widget_id;

				sisactivate = true;

			}

			if(!sisactivate){
				return;
			}
		}
		


		var pdata = {}
		var productPageInfo = {}
			productPageInfo.pageurl = encodeURIComponent(document.location.href);
			

		//Based on the widget type, we send the corresponding log data
		//update the preview title respective of the widget type
		if(_stockinstore[0].isPreviewMode){
			stockInStorePreviewUI.updatePreviewTitle("stockinstore " + settings.dataCache.widgetType + ": Preview Mode ")
		}


		switch (settings.dataCache.widgetType.toLowerCase()) {

			case 'homepage':
				pdata.homePageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Home Page Loaded', JSON.stringify(pdata),stockInStore.tags);

				break;
			case 'shopping bag':
				pdata.shoppingBagPageInfo = productPageInfo;
				stockInStore.tags.sis_module = "cnc"
				stockInStore.gaLabelType = "cnc";
				stockInStore.tags.sis_button = "cnc";
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Shopping Bag Page Loaded', JSON.stringify(pdata),stockInStore.tags);
				break;
			case 'landing':
				pdata.landingPageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Landing Page Loaded', JSON.stringify(pdata),stockInStore.tags);

				break;
			case 'search':
				pdata.searchPageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Search Page Loaded', JSON.stringify(pdata),stockInStore.tags);

				break;
			case 'article':
				pdata.articlePageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Article Page Loaded', JSON.stringify(pdata),stockInStore.tags);

				break;
			case 'member account':
				pdata.memberAccountPageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Member Account Page Loaded', JSON.stringify(pdata),stockInStore.tags);

				break;
			case '3rdparty':
				pdata.thirdPartyPageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Third Party Page Loaded', JSON.stringify(pdata),stockInStore.tags);
				break;	
			case 'other':
				pdata.otherPageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Other Page Loaded', JSON.stringify(pdata),stockInStore.tags);

				break;	
			case 'store locator':
				pdata.storelocatorPageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Store Locator Page Loaded', JSON.stringify(pdata),stockInStore.tags);
				break;
			case 'category':
				pdata.categoryPageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Category Page Loaded', JSON.stringify(pdata),stockInStore.tags);
				break;
			case 'checkout':
				pdata.checkoutPageInfo = productPageInfo;
				stockInStore.tags.sis_module = "cnc"
				stockInStore.gaLabelType = "cnc";
				stockInStore.tags.sis_button = "cnc";
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Checkout Page Loaded', JSON.stringify(pdata),stockInStore.tags);
				break;
			default :
				pdata.productPageInfo = productPageInfo;
				stockInStoreGlobal.sendStats('_trackEvent', 'Stock In Store',  'Load', 'Product Page Loaded', JSON.stringify(pdata),stockInStore.tags);

		}

		stockInStore.initTracker();


		if(settings.useCncShowQueryString == "true"){
			if(stockInStoreGlobal.getQueryString('cncshow')!=''){
				settings.enableSISCNCProductPage = 'true';
				settings.enableSISCNC = 'true';
			}else{
				settings.enableSISCNCProductPage = 'false';
				settings.enableSISCNC = 'false';

				
				if(settings.dataCache.widgetType.toLowerCase() == "checkout"){
					settings.enableSISCNCProductPage = 'true';
					settings.enableSISCNC = 'true';
				}

			}
		}

		
		if(settings.useSisShowQueryString == "true")
		{
		
			if(stockInStoreGlobal.getQueryString('sisshow')!='' && settings.showSisButton == "true")
			{
				stockInStore.internalActivation();	
			}else
			{
				return;
			}
		}else
		{
			if(settings.showSisButton == "true")
			{
				stockInStore.internalActivation();
			}else
			{
				return;
			}
		}
		
		
		//var isShowSISButton = settings.fnShowSisButton.call(this,settings);
		//var isSisButtonHidden = settings.isSisButtonHidden;
		
		//Should the Stock in Store button Be displayed
		//if(!isShowSISButton)
		//{
		//	return;
		//}
		
		//Should the Stock in Store button be hidden
		//Overide the fnShowSisButton call
		//if(isSisButtonHidden == "true") //default false
		//{
		//	return;
		//}
		

	};
	
	/**
	 * 
	 */
	stockInStore.internalActivation = function()
	{
		
		//Register All Core Template Helpers and call on custom helpers

		if (typeof requirejs === 'function') {
		
			requirejs.config({
				paths: {
					'handlebars': settings.handlebarRequirePath
				}
			});
		
			require(['handlebars'], function (myHandlebars) {

				Handlebars = myHandlebars;
				registerCoreHelpers();
			})
		}else{
		  
			if(window.Handlebars)
			{
				registerCoreHelpers();
			}else
			{
				
				var winIntervalHBarScript = window.setInterval(function(){
			
							// && window.Handlebars
							if(window.Handlebars)
							{
								registerCoreHelpers();
								window.clearInterval(winIntervalHBarScript);
							}
						},1)		
				
			}
		}	

	}

	/**
	 * 
	 */
	var getCartItemsArray = function(prop){
		var retArray = [];
		if(typeof(_stockinstore.items)!=="undefined"){
			if(_stockinstore.items.length>0){
				for(var i=0;i<_stockinstore.items.length;i++){
					if(_stockinstore.items[i][prop]){
						retArray.push(_stockinstore.items[i][prop])
					}
				}
			}
	
		}

		return retArray;
	}

	/**
	 * 
	 */
	stockInStore.showClickCollectWidget = function(){
		if(settings.enableSISCNC == 'true' && settings.enableSISCNCProductPage == 'true'){
			stockInStore.thresholdType = "cnc";
			stockInStore.tags.sis_module = "cnc"
			stockInStore.gaLabelType = "cnc";
			stockInStore.tags.sis_button = "cnc";
			showClickCollect();
		}
	}

	/** Shopping Bag Activation **/
	stockInStore.shoppingBagActivation = function(){
		stockInStore.checkoutActivation();
	}


	/** Checkout Page */
	stockInStore.checkoutActivation = function(){

		runBotCheck();

		getStores(function(){

			/*if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.config)!=='undefined' && typeof(_stockinstore.clickcollect.config.triggerElement)!=='undefined'){
				stockInStoreGlobal.addEvent(
					document.getElementById(_stockinstore.clickcollect.config.triggerElement.id),
					(typeof(_stockinstore.clickcollect.config.triggerElement.event)!=='undefined'?_stockinstore.clickcollect.config.triggerElement.event:'click'),
					function(){
					stockInStore.thresholdType = "cnc";
					showClickCollect();
				});*/

				//Check if there is a selected store
				var getCookieStoreCode = stockInStoreGlobal.getCookie('_SISSTORECODEINFO');
				var getLocalSelStore = localStorage.getItem('SISSelectedStoreInfo');
				
				if(getCookieStoreCode == ""){
					if(getLocalSelStore!==null){
						localStorage.removeItem('SISSelectedStoreInfo');
		
					}
				}



				if(getCookieStoreCode!=="" && getLocalSelStore!==null){
					settings.dataStore.selectedStore = JSON.parse(getLocalSelStore)
				}
				
				if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onLoaded)!=='undefined'){
					var retobj = {};
					retobj.selectedstore = settings.dataStore.selectedStore;
					if(typeof(_stockinstore.items)!=="undefined"){
						if(_stockinstore.items.length > 0){
							var upis = getCartItemsArray('upi');
							settings.dataCache.clickcollect.items = _stockinstore.items;
							settings.dataIdentifiers.product = upis.toString();
							retobj.items =  _stockinstore.items;
						}

					}
					callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onLoaded,retobj)
				}

				if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onGetCartCNCStatus)!=='undefined'){
					stockInStore.getCartCNCStatus(function(data){
						callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onGetCartCNCStatus,data)
					})
				}
				


			//}
			
		
		})

	}

	/** */
	var showClickCollect = function(){
			if(typeof(_stockinstore.items)!=="undefined"){
				if(_stockinstore.items.length > 0){
					var upis = getCartItemsArray('upi');//document.getElementById(settings.clickcollect.buttonid).getAttribute("data-sis-upis-config")

					settings.dataCache.clickcollect.items = _stockinstore.items;
					settings.dataIdentifiers.product = upis.toString(); 


					stockInStore.tags = {
						sis_page:"checkout",
						sis_module:"cnc",
						sis_segment:"",
						sis_button:"cnc"
					}
		
					var pdata = {}
					var	productIdentifiers = {}
						productIdentifiers = settings.dataIdentifiers;
						productIdentifiers.pageurl = encodeURIComponent(document.location.href);
						
																	
						pdata.productIdentifiersInfo = productIdentifiers;

						var passItems = [];
				
						for(var i=0;i<_stockinstore.items.length;i++){
							var ob = cloneObject(_stockinstore.items[i])
							if(typeof(ob.name)!=='undefined'){
								ob.name =ob.name.replace(/'/g, "\\'");
								ob.name = ob.name.replace(/[^A-Za-z' ]/g, "");
							}
							
							if(typeof(ob.variations)!=='undefined'){
								ob.variations =ob.variations.replace(/'/g, "\\'");
								ob.variations= ob.variations.replace(/[^A-Za-z' ]/g, "");
							}

							if(typeof(ob.image)!=='undefined'){
								if(ob.image.indexOf('<img')==-1){
									ob.image = escape(ob.image)
								}
								
							}
							
							passItems.push(ob)
						}

						pdata.cartItemsInfo = passItems;
						
						getLocationInfo(function(locationdata){
							
							var locationInfo = {}
							locationInfo = locationdata.response;
							pdata.locationInfo = locationInfo;
							
							
					
							stockInStore.sendEvents(null,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Button Clicked',JSON.stringify(pdata));
							
							
							//Remove the added property
							delete settings.dataIdentifiers.pageurl
					
						
						})


					//stockInStore.sendEvents(null,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Button Clicked',JSON.stringify(pdata));
					displayWidget(true); //true for cnc
		
				}
			}
	}

	/**
	 * Store Locator
	 */
	stockInStore.locatorActivation=function(){
		runBotCheck();
		
		//console.log("addevent")
		window.onpopstate  =  function(e) {
			//setTimeout(function(){
			// URL location
			var location = document.location;
		
			// state
			
			//console.log(e)

			//}, 0);
		};

		getStores(function(){

			//We need to check if there are any cookies set from  (from stockinstore)
			getLocationInfo(function(locationdata){
				
				var elemWrapper = document.getElementById("sis-storelocator-wrapper")
				Handlebars.registerPartial('fbhtmlSearchLocationTemplate', settings.htmlSearchLocationTemplate);
				Handlebars.registerPartial('fbhtmlStoreLocatorListTemplate', settings.htmlstoreLocatorListTemplate);
				Handlebars.registerPartial('fbhtmlStoreLocatorMapTemplate', settings.htmlStoreLocatorMapTemplate);
				Handlebars.registerPartial('fbhtmlSelectedStoreTemplate', settings.htmlSelectedStoreTemplate);
				Handlebars.registerPartial('fbhtmlSearchCountriesTemplate', settings.htmlSearchCountriesTemplate);
				Handlebars.registerPartial('fbhtmlStoreLocatorDetailTemplate', settings.htmlStoreLocatorDetailTemplate);
				
				

				var template = Handlebars.compile(settings.htmlstoreLocatorTemplate);
				elemWrapper.innerHTML = template(settings);

			//We check if the map is already created, as we do not want to recreate the map
			var getMapObject = document.getElementById("sis-locator-map")

			if(getMapObject == null){
				document.getElementById("sis-locator-map-wrap").innerHTML = "<div id='sis-locator-map'></div>"
			}
				//callExtOjectFn(_stockinstore,_stockinstore.locator,_stockinstore.locator.ready,settings)



				var pdata= {};				
				var locationInfo = {}
				locationInfo = locationdata.response;
				pdata.locationInfo = locationInfo;
				
				
				if(	locationdata=="") {
					stockInStore.countryDetails = ""
				}else{
					stockInStore.countryDetails  = locationdata.response.country_code + "|" + locationdata.response.country_name;
				}
				
				var getCookieLocationAddress = stockInStoreGlobal.getCookie('_SISLOCATIONADDRESS');
				var getCookieLocationLat = stockInStoreGlobal.getCookie('_SISLOCATIONLAT');
				var getCookieLocationLng = stockInStoreGlobal.getCookie('_SISLOCATIONLNG');
				var getCookieAddressComponent	=	stockInStoreGlobal.getCookie('_SISADDRESSCOMPONENTS');
			
				if(getCookieLocationAddress!==""){
					document.getElementById('uiLocationInp').value = getCookieLocationAddress;
				}


				if(getCookieLocationLat!=="" && getCookieLocationLng!==""){
					var geobj = {}
					geobj.lat = getCookieLocationLat;
					geobj.lng = getCookieLocationLng;
					settings.dataCache.geolocationObj = geobj;
					stockInStore.findNearestStores(document.getElementById('uiSearchGoBtn'));		
					
				}else{
					var countryinfo = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?stockInStore.countryDetails:'AU|Australia';
				
					getGeolocation(countryinfo.split("|")[1],'country:' + (countryinfo.split("|")[0]),function(geodata){
						
						if(geodata!==null)
						{
							//here address string
							var resobject = geodata;
							if(typeof(geodata.results)!='undefined'){
								resobject = geodata.results[0];
							}else{
								resobject = geodata[0];
							}


							var addressString = getAddressStringFromComponent(resobject)
							
							if(resobject.formatted_address == '')// || resobject.formatted_address == (countryinfo.split("|")[1]))
							{
								document.getElementById('uiLocationInp').value='';
								
								stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', "" , 8760, '/');						
								stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', "", 8760, '/');	
							}else
							{
								document.getElementById('uiLocationInp').value  = resobject.formatted_address;
								stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', resobject.formatted_address , 8760, '/');						
								stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', addressString, 8760, '/');							
								var getPostCode = getAddressComponents(resobject.address_components,'postal_code');
								if(getPostCode!=="")
								{
									stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', getPostCode , 8760, '/');
								}else{
									stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', "", 8760, '/');
								}
							}
							
							
							var geobj = {}
							
							geobj.lat = resobject.geometry.location.lat();
							geobj.lng = resobject.geometry.location.lng();
							
							stockInStoreGlobal.setCookie('_SISLOCATIONLAT', geobj.lat , 8760, '/');						
							stockInStoreGlobal.setCookie('_SISLOCATIONLNG', geobj.lng , 8760, '/');
							settings.dataCache.geolocationObj = geobj;
							
						}else{
								document.getElementById('uiLocationInp').value='';
								stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', "" , 8760, '/');						
								stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', "", 8760, '/');	
						}
						stockInStore.findNearestStores(document.getElementById('uiSearchGoBtn'));		
					})
				}
			})
		})
	}


	/**
	 * 
	 */
	stockInStore.categoryActivation = function(){
		runBotCheck();
		
		getStores(function()
		{
		})
	};

	/**
	 * 
	 */

	stockInStore.sisButtonActivation = function(){
		
		// Add class to HTML element to activate conditional CSS
		//document.documentElement.classList.add( settings.initClass );
		
		
		//Cache  Stores Master list before initialising the interface
		getStores(function()
		{
		})
		var widgets =	stockInStoreGlobal.querySelect('[data-sis-widget-id]'),widgetsLength	=	widgets.length; 
		//
		if( widgetsLength > 0 )
		{
			for( var i=0;i<widgetsLength;i++)
			{
					var widget = widgets[i];
					
					//populate the SIS content placeholder and display
					settings.dataCache.widgetId = widget.getAttribute('data-sis-widget-id');
					settings.dataCache.widgetDescription = widget.getAttribute('data-sis-widget-description')

					//should we move the stock in store button somewhere spefic on the page
					var opt = settings.fnSetSISButtonLocation(settings);
					
					
					var pdata=  {}
					var widgetInfo = {};
						widgetInfo.id = settings.dataCache.widgetId;
						widgetInfo.description = settings.dataCache.widgetDescription;
						pdata.widgetInfo = widgetInfo;
						
					var targetStr	= opt.target;

					if(opt.enable){
						if(opt.action!='')
						{
							var chkTargetType = stockInStoreGlobal.getClassOrID(targetStr);
							
							var targetelm = null;
							var searchElemInter = null;
													
							if(opt.isSearchTarget)
							{
								var searchElemInter = window.setInterval(function(){
									
									if(chkTargetType == 'ID')
									{
										 targetelm = document.getElementById(targetStr.substring(1));
									}else if(chkTargetType == 'CLASS')
									{
										 targetelm = document.getElementsByClassName(targetStr.substring(1))[0];
									}else
									{
										 targetelm = document.getElementById(targetStr);
									}
	
									if(targetelm!=null)
									{
										window.clearInterval(searchElemInter);
											
										if(opt.action == 'after')
										{
											targetelm.parentNode.insertBefore(widget, targetelm.nextSibling);
										}else if(opt.action == 'before')
										{
											targetelm.parentNode.insertBefore(widget, targetelm);
										}else if (opt.action == 'append')
										{
											targetelm.appendChild(widget, targetelm);
										}
										stockInStore.showButton(widget,pdata)					
									}
								},1)
								
							}else
							{
								if(chkTargetType == 'ID')
								{
									 targetelm = document.getElementById(targetStr.substring(1));
								}else if(chkTargetType == 'CLASS')
								{
									 targetelm = document.getElementsByClassName(targetStr.substring(1))[0];
								}else
								{
									 targetelm = document.getElementById(targetStr);
								}
								
								if(opt.action == 'after')
								{
									targetelm.parentNode.insertBefore(widgets[i], targetelm.nextSibling);
								}else if(opt.action == 'before')
								{
									targetelm.parentNode.insertBefore(widgets[i], targetelm);
								}else if (opt.action == 'append')
								{
									targetelm.appendChild(widget, targetelm);

								}
									
								stockInStore.showButton(widget,pdata)	
							}
					}
				}else
				{
					stockInStore.showButton(widget,pdata)	
				}
			}
		}
	}
	

	/**
	 * 
	 */
	stockInStore.getUPI = function(productid,pcallback)
	{
		var requestObj =  stockInStoreGlobal.ajaxRequest();
		requestObj.open('POST',_stockinstore[0].applicationurl + '/stock/getUPI',true);
		requestObj.withCredentials = true;
		requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
		requestObj.onreadystatechange = function ()
		{
			if (requestObj.readyState == 4) {
				if(requestObj.status == 200){
					if(pcallback != null) return pcallback.call(this,JSON.parse(requestObj.responseText));
				}else{
					stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getUPI " ,"Unable to get UPI: " + JSON.stringify(requestObj));
				}
				
			}
		}
		
		requestObj.send('site=' + _stockinstore[0].site + 
						'&widget=' + settings.dataCache.widgetId +
						'&product_id=' + productid + 
						'&preview='+_stockinstore[0].isPreviewMode+
						'&info=none&isajax=1');

	}
	
	
	/**
	 * Add To Basket
	 * @public
	 * 
	*/
	
	stockInStore.addToBasket = function(elem)
	{
		showProcessing();

		addToBasket(elem,function(postdata,isadded){

			var pdata = {}
			var productInfo =	{};
				productInfo.productid 		= postdata.productid;
				productInfo.ecomproductid 	= postdata.ecomproductid;
				productInfo.variationid 	= postdata.variationid;
				pdata.productInfo  			= productInfo ;

				//Can add to basket without doing a find in store search
				if(settings.dataCache.searchForm!==null && settings.dataCache.storeListingInfo!==null){
					var storeEventsInfo = {}
					storeEventsInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
					storeEventsInfo.storeListingInfo = settings.dataCache.storeListingInfo;
					pdata.storeEventsInfo = storeEventsInfo;
					addLogDataHideStores(pdata);
	
				}


			stockInStore.sendEvents(elem,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Add to Basket',JSON.stringify(pdata));
			
			

			if(!stockInStore.isQuickView){
				settings.fnOnCompleteAddToBasket.call(this,settings);
			}else{
				var retObj = {};
					retObj.settings = settings;
					retObj.eventName = 'onCompleteAddToBasket';
					sendQuickViewEvent(retObj);
			} 

			hideProcessing();
			stockInStore.hideWidget();			
		})
	},
	
	 


	 /**
	 * Show SIS Button
	 * @public
	 * @param {string} elem check stock in store button
	 */
	stockInStore.showButton = function(widget,pdata)
	{
		var _THIS = this;
		displaySisButton(function(show){
			if(show)
			{
				//var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
				//var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
				//if(!iOS){
					var template = Handlebars.compile(settings.htmlWidgetElementTemplate);
					widget.style.display = 'block';
					widget.innerHTML = template(settings);//settings.htmlWidgetElementTemplate;


					if(settings.enableSISCNC == 'true' && settings.enableSISCNCProductPage =='true'){
						
						displayCncButton(function(showcnc){
							if(showcnc){

								stockInStore.thresholdType = "cnc";
								stockInStore.tags.sis_module = "cnc"
								

							}else{
								stockInStore.thresholdType = "fis";
								stockInStore.tags.sis_module = "sis"
							}
						})
						
					}


					stockInStore.sendEvents(null,null,'gasis','_trackEvent', 'Stock In Store', 'Impression', 'SIS Button Impression',JSON.stringify(pdata),true);

					runBotCheck();

					settings.fnOnShowSISButton.call(_THIS,settings,widget);


					if(settings.enableSISCNC == 'true' && settings.enableSISCNCProductPage =='true'){


						displayCncButton(function(showcnc){
							if(showcnc){
								var getSelStore = stockInStore.getSelectedStore()
						

								var newNode = document.createElement("div")
								newNode.className="sisClickCollectIndicator"
		
									
		
								var template = Handlebars.compile(settings.htmlClickCollectIndicatorTemplate);
									newNode.innerHTML =  template(settings);
									widget.appendChild(newNode, widget);
		

								var allCncIndicators= stockInStoreGlobal.querySelect(".sisClickCollectIndicator");
								
								for(var i=0;i<allCncIndicators.length;i++){
									var indicator= allCncIndicators[i]
									
									if(getSelStore!==null){
										
										stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-preferred-store"),'hideElement');
										stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-unselected-store"),'hideElement');
						
									}else{
										stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-unselected-store"),'hideElement');
										stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-preferred-store"),'hideElement');
						
									}
								}


								if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onLoaded)!=='undefined'){
									var retobj = {};
									retobj.selectedstore = settings.dataStore.selectedStore;
									callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onLoaded,retobj)
								}
							}else{
								// Should we show the message not available for click and collect
								if(settings.htmlNoClickCollectIndicatorTemplate!==""){
									var newNode = document.createElement("div")
									newNode.className="sisNoClickCollectIndicator"
			
										
			
									var template = Handlebars.compile(settings.htmlNoClickCollectIndicatorTemplate);
										newNode.innerHTML =  template(settings);
									widget.appendChild(newNode, widget);
			
									if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onLoaded)!=='undefined'){
										var retobj = {};
										retobj.selectedstore = settings.dataStore.selectedStore;
										callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onLoaded,retobj)
									}
								}
								
							}
						})
													
					}
			}
		})
	}

	/**
	 * 
	 */
	stockInStore.resetCNCStatus = function(){


		//Check saved store cookie or localstorage
		var storeSelected = false;
		settings.dataCache.clickcollect.cncdata == null
		if(settings.dataStore.selectedStore !== null){

			storeSelected = true;
		}
		
		var allCncIndicators= stockInStoreGlobal.querySelect(".sisClickCollectIndicator");

			var template = Handlebars.compile(settings.htmlClickCollectIndicatorTemplate);
		
			
		for(var i=0;i<allCncIndicators.length;i++){
			var indicator= allCncIndicators[i]
			indicator.innerHTML =  template(settings);

			//we reset the cnc status
			stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-status.default"),'hideElement');
			stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-status.notavailable"),'hideElement');
			stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-status.available"),'hideElement');

			if(storeSelected){
				
					
				stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-unselected-store"),'hideElement');

			}else{
				stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-unselected-store"),'hideElement');
				stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-preferred-store"),'hideElement');

			}
		}

	}

	/**
	 * 
	 * 
	 */
	stockInStore.forceGetCartCNCStatus = function(callback){

		var storeSelected = false;
		var ajaxRequest = true;

		
		if(settings.dataStore.selectedStore !== null){

			storeSelected = true;
			var store_code = settings.dataStore.selectedStore.code
		}

		if(storeSelected){
					var requestObj = stockInStoreGlobal.ajaxRequest();
					requestObj.open('POST',_stockinstore[0].applicationurl + '/stores/getCartCncStatus',true);
					requestObj.withCredentials = true;
					requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
					requestObj.onreadystatechange = function ()
					{
						if (requestObj.readyState == 4) {
							if(requestObj.status == 200){
		
								/*if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onGetCartCNCStatus)!=='undefined'){
									stockInStore.getCartCNCStatus(function(data){
										callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onGetCartCNCStatus,JSON.parse(requestObj.responseText))
									})
								}*/
								settings.dataCache.clickcollect.cnccartdata = JSON.parse(requestObj.responseText)
								
								if(callback != null) return callback.call(this,settings.dataCache.clickcollect.cnccartdata);
							}else{
								
								if(callback != null) return callback.call(this,null);
								//stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getCartCncStatus " ,"Unable to get cart cnc status: " + JSON.stringify(requestObj));	
							}
						}
					}
				
					
					var postDataString = "";		
					if(typeof(_stockinstore.items)!=="undefined"){
			

						var passItems = [];
				
						for(var i=0;i<_stockinstore.items.length;i++){
							var ob = cloneObject(_stockinstore.items[i])
							if(typeof(ob.name)!=='undefined'){
								//ob.name = escape(ob.name.replace(/(\n|\r|[^a-zA-Z0-9])/g,''))
								ob.name =ob.name.replace(/'/g, "\\'");
								ob.name = ob.name.replace(/[^A-Za-z' ]/g, "");
							}
							
							if(typeof(ob.variations)!=='undefined'){
								ob.variations =ob.variations.replace(/'/g, "\\'");
								ob.variations= ob.variations.replace(/[^A-Za-z' ]/g, "");
							}

							if(typeof(ob.image)!=='undefined'){
								if(ob.image.indexOf('<img')==-1){
									ob.image = escape(ob.image)
								}
								
							}
							
							passItems.push(ob)
						}

			
						postDataString = 'site=' + _stockinstore[0].site + 
						'&widget=' + settings.dataCache.widgetId +
						'&preview='+_stockinstore[0].isPreviewMode+
						'&thresholdType=cnc'+
						'&store_code=' + store_code +
						'&items=' + JSON.stringify(passItems) + 
						'&info=none&isajax=1'
	
						settings.dataCache.clickcollect.requesteditems.items = JSON.stringify(_stockinstore.items)
						settings.dataCache.clickcollect.requesteditems.store_code =  store_code;
					}else{
			
						var objPassed = [];
						objPassed[0] = {"upi": settings.dataIdentifiers.product,"quantity":1};
			
						postDataString = 'site=' + _stockinstore[0].site + 
						'&widget=' + settings.dataCache.widgetId +
						'&preview='+_stockinstore[0].isPreviewMode+
						'&thresholdType=cnc' + 
						'&store_code=' + store_code +
						'&items=' + JSON.stringify(objPassed) + 
						'&info=none&isajax=1'
	
						settings.dataCache.clickcollect.requesteditems.items =  JSON.stringify(objPassed)
						settings.dataCache.clickcollect.requesteditems.store_code =  store_code;
					}
			
					requestObj.send(postDataString);
		}else{
			if(callback != null) return callback.call(this,null);
		}
	}

	/**
	 * 
	 * 
	 */
	stockInStore.getCartCNCStatus = function(callback){

		var storeSelected = false;
		var ajaxRequest = true;

		
		if(settings.dataStore.selectedStore !== null){

			storeSelected = true;
			var store_code = settings.dataStore.selectedStore.code
		}

		if(storeSelected){


			if(settings.dataCache.clickcollect.cnccartdata == null){
				ajaxRequest = true;
			}else{
				//compare cached items against new request
				if(typeof(_stockinstore.items)!=="undefined"){
					
					

					if(settings.dataCache.clickcollect.requesteditems.store_code!==store_code){
						ajaxRequest = true;	
					}else{
						if(settings.dataCache.clickcollect.requesteditems.items == JSON.stringify(_stockinstore.items)){
							ajaxRequest = false;
						}else{
							ajaxRequest = true;
						}
					}


				}else{
					ajaxRequest = true;
				}
				
			}	

			
			if(ajaxRequest){
				//if(settings.dataCache.clickcollect.requesteditems.ajxreqobject!==null){
				//	settings.dataCache.clickcollect.requesteditems.ajxreqobject.abort();
				//	settings.dataCache.clickcollect.requesteditems.ajxreqobject = null;
				//}
				if(settings.dataCache.clickcollect.requesteditems.ajxreqobject == null){
					settings.dataCache.clickcollect.requesteditems.ajxreqobject =  stockInStoreGlobal.ajaxRequest();
					settings.dataCache.clickcollect.requesteditems.ajxreqobject.open('POST',_stockinstore[0].applicationurl + '/stores/getCartCncStatus',true);
					settings.dataCache.clickcollect.requesteditems.ajxreqobject.withCredentials = true;
					settings.dataCache.clickcollect.requesteditems.ajxreqobject.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
					settings.dataCache.clickcollect.requesteditems.ajxreqobject.onreadystatechange = function ()
					{
						if (settings.dataCache.clickcollect.requesteditems.ajxreqobject.readyState == 4) {
							if(settings.dataCache.clickcollect.requesteditems.ajxreqobject.status == 200){
		
								/*if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onGetCartCNCStatus)!=='undefined'){
									stockInStore.getCartCNCStatus(function(data){
										callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onGetCartCNCStatus,JSON.parse(requestObj.responseText))
									})
								}*/
								settings.dataCache.clickcollect.cnccartdata = JSON.parse(settings.dataCache.clickcollect.requesteditems.ajxreqobject.responseText)
								settings.dataCache.clickcollect.requesteditems.ajxreqobject = null;
								if(callback != null) return callback.call(this,settings.dataCache.clickcollect.cnccartdata);
							}else{
								settings.dataCache.clickcollect.requesteditems.ajxreqobject = null;
								if(callback != null) return callback.call(this,null);
								//stockInStoreGlobal.sendErrorLog("stockinstore-core.js","Function: getCartCncStatus " ,"Unable to get cart cnc status: " + JSON.stringify(requestObj));	
							}
						}
					}
				
					
					var postDataString = "";		
					if(typeof(_stockinstore.items)!=="undefined"){
			

						var passItems = [];
				
						for(var i=0;i<_stockinstore.items.length;i++){
							var ob = cloneObject(_stockinstore.items[i])
							if(typeof(ob.name)!=='undefined'){
								//ob.name = escape(ob.name.replace(/(\n|\r|[^a-zA-Z0-9])/g,''))
								ob.name =ob.name.replace(/'/g, "\\'");
								ob.name = ob.name.replace(/[^A-Za-z' ]/g, "");
							}
							
							if(typeof(ob.variations)!=='undefined'){
								ob.variations =ob.variations.replace(/'/g, "\\'");
								ob.variations= ob.variations.replace(/[^A-Za-z' ]/g, "");
							}

							if(typeof(ob.image)!=='undefined'){
								if(ob.image.indexOf('<img')==-1){
									ob.image = escape(ob.image)
								}
								
							}
							
							passItems.push(ob)
						}

			
						postDataString = 'site=' + _stockinstore[0].site + 
						'&widget=' + settings.dataCache.widgetId +
						'&preview='+_stockinstore[0].isPreviewMode+
						'&thresholdType=cnc'+
						'&store_code=' + store_code +
						'&items=' + JSON.stringify(passItems) + 
						'&info=none&isajax=1'
	
						settings.dataCache.clickcollect.requesteditems.items = JSON.stringify(_stockinstore.items)
						settings.dataCache.clickcollect.requesteditems.store_code =  store_code;
					}else{
			
						var objPassed = [];
						objPassed[0] = {"upi": settings.dataIdentifiers.product,"quantity":1};
			
						postDataString = 'site=' + _stockinstore[0].site + 
						'&widget=' + settings.dataCache.widgetId +
						'&preview='+_stockinstore[0].isPreviewMode+
						'&thresholdType=cnc' + 
						'&store_code=' + store_code +
						'&items=' + JSON.stringify(objPassed) + 
						'&info=none&isajax=1'
	
						settings.dataCache.clickcollect.requesteditems.items =  JSON.stringify(objPassed)
						settings.dataCache.clickcollect.requesteditems.store_code =  store_code;
					}
			
					settings.dataCache.clickcollect.requesteditems.ajxreqobject.send(postDataString);
				}
				
	
			}else{
				if(callback != null) return callback.call(this,settings.dataCache.clickcollect.cnccartdata);
				
			}

		}else{
			if(callback != null) return callback.call(this,null);
		}

	

	}


	/**
	 * 
	 * 
	 */
	stockInStore.updateCNCStatus = function(cncconfig,forcerefresh){
		//Check saved store cookie or localstorage
		var storeSelected = false;
		
		if(settings.dataStore.selectedStore !== null){

			storeSelected = true;
		}

		var allCncIndicators= stockInStoreGlobal.querySelect(".sisClickCollectIndicator");

			var template = Handlebars.compile(settings.htmlClickCollectIndicatorTemplate);
		
			
		for(var i=0;i<allCncIndicators.length;i++){
			var indicator= allCncIndicators[i]
			indicator.innerHTML =  template(settings);

			//we reset the cnc status
			stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-status.default"),'hideElement');
			stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-status.notavailable"),'hideElement');
			stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-status.available"),'hideElement');

			if(storeSelected){
				
				stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-preferred-store"),'hideElement');
				stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-unselected-store"),'hideElement');

			}else{
				stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-unselected-store"),'hideElement');
				stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-preferred-store"),'hideElement');

			}
		}

		//now should we update the CNC upi/store status
		if(cncconfig!==null && storeSelected){
				//console.log("calling cncstatus now")

				getCncStatus(cncconfig,forcerefresh,function(data){
					
					if(data.response.upis!==null){
						//Find the availablity for the UPI
						//console.log(cncconfig.index_value)
						//console.log(data.response.upis)	
						var findupi = false;
						var upiavailable = false;
						for(var i=0;i<data.response.upis.length;i++){
							if(data.response.upis[i].upi == cncconfig.index_value){
								findupi = true;
								if(data.response.upis[i].available == true){
									upiavailable = true;
									break;
								}
							}
						}
						//console.log(findupi)
						if(findupi){
							for(var i=0;i<allCncIndicators.length;i++){
								var indicator= allCncIndicators[i]
								stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-status.default"),'hideElement');
								if(upiavailable){
									stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-status.available"),'hideElement');
									stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-status.notavailable"),'hideElement');
								}else{
									stockInStoreGlobal.addClassName(indicator.querySelector(".sis-cc-status.available"),'hideElement');
									stockInStoreGlobal.removeClassName(indicator.querySelector(".sis-cc-status.notavailable"),'hideElement');
		
								}
								
							}
						}
					}
				})

		}
	}

	

	/**
	 * Click on Check stock in store
	 * @public
	 * @param {string} elem check stock in store button
	 */
	stockInStore.checkSingleStockInStore = function( elm ) {
		
					stockInStore.isQuickView = true;
					var pdata = {}
					var	productIdentifiers = {}
						productIdentifiers = settings.dataIdentifiers;
						
						productIdentifiers.pageurl = encodeURIComponent(document.location.href);
						
						productIdentifiers.imageurl = cleanImageURL(settings.dataProduct.image);	
											
						pdata.productIdentifiersInfo = productIdentifiers;
						
						
						getLocationInfo(function(locationdata){
							
							var locationInfo = {}
							locationInfo = locationdata.response;
							pdata.locationInfo = locationInfo;
							
							
							if(	locationdata=="") //default to AU
							{
								stockInStore.countryDetails = ""
								
							}else
							{
								stockInStore.countryDetails  = locationdata.response.country_code + "|" + locationdata.response.country_name;

							}
							stockInStore.sendEvents(elm,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Button Clicked',JSON.stringify(pdata));
							
							
							//Remove the added property
							delete settings.dataIdentifiers.pageurl
							delete settings.dataIdentifiers.imageurl

						
						})

					if(settings.dataIdentifiers.variation!='')
					{
						getProductVariation( function( data ) {
							mapVariationData( data, function(){
								displayWidget();	
							})
						});
					}else
					{
						displayWidget();
					}
		
	};


	/**
	 * 
	 */

	stockInStore.checkCncStockInStore = function(elm){
		stockInStore.gaLabelType = "cnc";
		stockInStore.tags.sis_button = "cnc";
		stockInStore.checkStockInStore(elm);

	}
	/**
	 * Click on Check stock in store
	 * @public
	 * @param {string} elem check stock in store button
	 */
	stockInStore.checkStockInStore = function( elm ) {
		stockInStore.isQuickView = false;
		
		if(settings.enableSISCNC == 'true' && settings.enableSISCNCProductPage =='true'){

			
			displayCncButton(function(showcnc){
				if(showcnc){
					stockInStore.thresholdType = "cnc";
					stockInStore.tags.sis_module = "cnc"
				}else{
					stockInStore.thresholdType = "fis";
					stockInStore.tags.sis_module = "cnc"
				}
			})
		}else{
			stockInStore.thresholdType = "fis";
		}

		if(stockInStore.isCheckInStoreClick){return;}
		stockInStore.isCheckInStoreClick = true;	

		//Before we display the Widget we need to either get the product identifier/and or the variation identifier 
		getProductIdentifier( function() {
			getVariationIdentifier( function() {

				//Then we need to get the product details 
				//We need to use a callback function here as we might need to do ajax calls in some cases
				getProductDetails( function() {
					var pdata = {}
					var	productIdentifiers = {}
						productIdentifiers = settings.dataIdentifiers;
						
						productIdentifiers.pageurl = encodeURIComponent(document.location.href);
						productIdentifiers.imageurl = cleanImageURL(settings.dataProduct.image);	
						pdata.productIdentifiersInfo = productIdentifiers;
						getLocationInfo(function(locationdata){
							
							var locationInfo = {}
							locationInfo = locationdata.response;
							pdata.locationInfo = locationInfo;
							
							
							if(	locationdata=="") //default to AU
							{
								stockInStore.countryDetails = ""
								
							}else
							{
								stockInStore.countryDetails  = locationdata.response.country_code + "|" + locationdata.response.country_name;

							}
							stockInStore.sendEvents(elm,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Button Clicked',JSON.stringify(pdata));
							
							
							//Remove the added property
							delete settings.dataIdentifiers.pageurl
							delete settings.dataIdentifiers.imageurl

						
						})

					if(settings.dataIdentifiers.variation!='')
					{
						getProductVariation( function( data ) {
							mapVariationData( data, function(){
								displayWidget();	
							})
						});
					}else
					{
						displayWidget();
					}
				});	
			});			
		});
		
		
	};
	
	/**
	 * Show SIS Widget
	 * @public
	 */
	stockInStore.showWidget = function() {
		displayWidget();
	};
	
	/**
	 * Hide SIS Widget
	 * @public
	 */
	stockInStore.hideWidget = function() {
		var checkModal = document.getElementById('storeStockModal');
		checkModal.setAttribute('class','')
		stockInStoreGlobal.removeClassName(document.body,'stockInStoreActive');
		stockInStore.isCheckInStoreClick = false;
		settings.dataCache.isWidgetDisplayed = null;
		resetSISTags();		
		settings.dataVariations.arrayVariationInfo = [];

		stockInStore.thresholdType = "fis";
		stockInStore.gaLabelType = "fis";
		stockInStore.tags.sis_button = "fis";
		stockInStore.isCncWidget = false;
		
		//			
		if(settings.dataCache.windowPos!==null){
			
			document.documentElement.scrollTop = document.body.scrollTop = settings.dataCache.windowPos.top;
		}


		if(!stockInStore.isQuickView){
			settings.fnOnHideWidget.call(this,settings);
			if(typeof(_stockinstore.clickcollect)!=='undefined' && typeof(_stockinstore.clickcollect.onModalClosed)!=='undefined'){
				var retobj = {}
				retobj.selectedstore= settings.dataStore.selectedStore;

				if(typeof(settings.dataCache.productVariations.response)!=="undefined"){
					retobj.upis = settings.dataCache.productVariations.response;
				}
					
					retobj.selectedproduct = {}
					retobj.selectedproduct.upi = settings.dataIdentifiers.product 
				
				
				callExtOjectFn(_stockinstore,_stockinstore.clickcollect,_stockinstore.clickcollect.onModalClosed,retobj)
			}
	

		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.eventName = 'onHideWidget';
				sendQuickViewEvent(retObj);
		} 

		stockInStore.isQuickView = false;

	};
	
	/**
	 * Send Analytics/stats Events
	 * @public
	 * @param {string} ga (send to ga only), sis (send to sis app only), gasis (send to both ga ans sis app)
	 * @param {string} event type
 	 * @param {string} category event
	 * @param {string} action event
	 * @param {string} label event	 
	 */	
	 stockInStore.sendEvents_old = function( elm,e,type, eventtype, category, action, label ) {
		if(typeof(e)!='undefined')
		 {
			//console.log(elm.getAttribute('id')?elm.getAttribute('id'):elm.getAttribute('class'))
		 }
		 
	 }
	 
	 /**
	  * Initialise GA Tracker
	  * @public
	  * Sending Events to SIS Account
	  */
	stockInStore.initTracker = function()
	{
		
		//First check for Gtag
		if(typeof(gtag)!='undefined'){

			//SIS 
			gtag('config', 'UA-64867805-3', { 'groups': 'sisTracker' });

			if(settings.strGoogleUAAccount!==""){

				if(settings.isPageViewTracked == "true"){
					gtag('config', settings.strGoogleUAAccount);
				}else{
					gtag('config', settings.strGoogleUAAccount, { 'send_page_view': false });
				}
			}
		}else{
			if(typeof(ga)!='undefined')
			{
				ga('create', 'UA-64867805-3', {'name': 'sisTracker'});

				if(settings.enableGoogleLinker == "true"){
					ga('sisTracker.require', 'linker');
				}
				ga('sisTracker.send', 'pageview');

				//Checks to see if we need to create a tracker for current client
				if(settings.strGoogleUAAccount!==""){
					ga('create', settings.strGoogleUAAccount, {'name': 'sisClientTracker'});
					
					if(settings.enableGoogleLinker == "true"){
						ga('sisClientTracker.require', 'linker');
					}
					if(settings.isPageViewTracked == "true"){
						ga('sisClientTracker.send', 'pageview');
					}
				}

			}else{
				if(typeof(_gaq)!='undefined')
				{
					_gaq.push(['sisTracker._setAccount','UA-64867805-3']); 
					_gaq.push(["sisTracker._trackPageview"]);	
					
					if(settings.strGoogleUAAccount!==""){
						_gaq.push(['sisClientTracker._setAccount',settings.strGoogleUAAccount]); 

						if(settings.isPageViewTracked == "true"){
							_gaq.push(["sisClientTracker._trackPageview"]);	
						}
					}
					
					
				}else{
					//google analytic object
					if(typeof(window['GoogleAnalyticsObject'])!=="undefined" && window['GoogleAnalyticsObject'] !=="ga"){
						var ga_sis = window[window.GoogleAnalyticsObject];

						ga_sis('create', 'UA-64867805-3', {'name': 'sisTracker'});

						if(settings.enableGoogleLinker == "true"){
							ga_sis('sisTracker.require', 'linker');
						}
						ga_sis('sisTracker.send', 'pageview');

						//Checks to see if we need to create a tracker for current client
						if(settings.strGoogleUAAccount!==""){
							ga_sis('create', settings.strGoogleUAAccount, {'name': 'sisClientTracker'});
							
							if(settings.enableGoogleLinker == "true"){
								ga_sis('sisClientTracker.require', 'linker');
							}
							if(settings.isPageViewTracked == "true"){
								ga_sis('sisClientTracker.send', 'pageview');
							}
						}

					}
				
				}
			}
		}
	}
	 
	
	 /**
	  *	For All anchor links we need to pass some values to internal db
	  */
	 stockInStore.sendLinkEvents = function(elm,linkdescription)
	 {
		 var pdata = {};
		 var linkInfo = {}
			 linkInfo.name = linkdescription;
 			 linkInfo.url = encodeURIComponent(elm.getAttribute('href'));

		 getDataAttributes(elm,linkInfo)

			
		 if(linkdescription == "Stores - View Map")
		 {
			linkInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
			linkInfo.storeListingInfo = settings.dataCache.storeListingInfo;
		 }else if(linkdescription == "Stores - View Map (Icon)")
		 {
		   linkInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
		   linkInfo.storeListingInfo = settings.dataCache.storeListingInfo;
  		 }else if(linkdescription == "Stores - View Map (Address)")
		 {
			linkInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
			linkInfo.storeListingInfo = settings.dataCache.storeListingInfo;
   
		 }else if(linkdescription == "Stores - Telephone")
		 {
			linkInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
			linkInfo.storeListingInfo = settings.dataCache.storeListingInfo;
   
		 }else if(linkdescription == "Widget Closed")
		 {
			 linkInfo.url = encodeURIComponent(document.location.href);
		 }else if(linkdescription == "Footer Logo Link" )
		 {
			 linkInfo.domain = document.location.hostname;
			 
		 }else if(linkdescription == "Top Promo Banner")
		 {		 	 
  		 }else if(linkdescription == "Main Promo Banner")	 
		 {
		 }else
		 {
		 }



		 pdata.linkInfo = linkInfo;
		 addLogDataHideStores(pdata);
		 
		 stockInStore.sendEvents(elm,null,'gasis','_trackEvent', 'Stock In Store', 'Click', linkdescription,JSON.stringify(pdata));
		 stockInStoreGlobal.savedLogString = "";
	 }
	 
	 
	/*
	 * Sending Events
	 * @public
	 */ 
	stockInStore.sendEvents = function( elm,e,type, eventtype, category, action, label,value,isNonInteractive ) {

		var SISUID = stockInStoreGlobal.getCookie('_SIS_UID');
		var SISSESSID = stockInStoreGlobal.getCookie('_SIS_SESSID');
		
		if( SISUID=="" || SISSESSID == ""){
			stockInStoreGlobal.setCookie('_SIS_BOT_CHECK',  ''  , 30, '/');
			
			stockInStoreGlobal.initWidgetSession(false,function(data){

				var SISUID = stockInStoreGlobal.getCookie('_SIS_UID');
				var SISSESSID = stockInStoreGlobal.getCookie('_SIS_SESSID');

				//runBotCheck();
				stockInStore.sendEventsWithSession( elm,e,type, eventtype, category, action, label,value,isNonInteractive);
			});//do not reload the assets
		}else{

			stockInStore.sendEventsWithSession( elm,e,type, eventtype, category, action, label,value,isNonInteractive);	

		}
	
	};

	/** 
	 * 
	 */
	stockInStore.sendEventsWithSession = function(elm,e,type, eventtype, category, action, label,value,isNonInteractive){

		var isnoninteractive  = false;
		
		if (typeof isNonInteractive  !== "undefined") 
		{
			isnoninteractive  = true  ;
					

		}
		
		var glabel = stockInStore.gaLabelType.toUpperCase() + " > " + label;
		if(type =='ga')//only to google
			{
				/*if(typeof(_gaq)!='undefined')
				{
					_gaq.push([eventtype, category, action, label,undefined,isnoninteractive]);
					
				}
				
				if(typeof(ga)!='undefined')
				{
					ga('send', 'event', category, action, label ,{nonInteraction:isnoninteractive});
				}*/

				//Check for gtag first
				if(typeof(gtag)!='undefined'){

					//SIS
					gtag('event', action, {
						'event_category':settings.strClientName,
						'event_label': glabel,
						'value': '',
						'non_interaction': isnoninteractive,
						'send_to':'sisTracker'
					  });
					

					  
					//if(settings.strGoogleUAAccount!==""){
						gtag('event', action, {
							'event_category':category,
							'event_label': glabel,
							'value': '',
							'non_interaction': isnoninteractive
						  });
					//}

				}else{
					
					if(typeof(ga)!='undefined')
					{
						
						ga('send', 'event', category, action, glabel,{nonInteraction:isnoninteractive});
						
						if(settings.enableGoogleLinker == "true"){
							ga('sisTracker.require', 'linker');
						}
						ga('sisTracker.send', 'event', settings.strClientName, action, glabel,{nonInteraction:isnoninteractive});

						if(settings.strGoogleUAAccount!==""){

							if(settings.enableGoogleLinker == "true"){
								ga('sisClientTracker.require', 'linker');
							}
							ga('sisClientTracker.send', 'event', category, action, glabel,{nonInteraction:isnoninteractive});
						}
		
					}else
					{
						
						if(typeof(_gaq)!='undefined')
						{
							
							_gaq.push(['sisTracker.' + eventtype,settings.strClientName, action, glabel,undefined,isnoninteractive]); 
							_gaq.push([eventtype, category, action, label,undefined,isnoninteractive]);

							if(settings.strGoogleUAAccount!==""){
								_gaq.push(['sisClientTracker.' + eventtype, category, action, glabel, undefined, isnoninteractive]); 
							}
							
							
						}else{
							//google analytic object
							if(typeof(window['GoogleAnalyticsObject'])!=="undefined" && window['GoogleAnalyticsObject'] !=="ga"){
								var ga_sis = window[window.GoogleAnalyticsObject];

								ga_sis('send', 'event', category, action, glabel,{nonInteraction:isnoninteractive});
						
								if(settings.enableGoogleLinker == "true"){
									ga_sis('sisTracker.require', 'linker');
								}
								ga_sis('sisTracker.send', 'event', settings.strClientName, action, glabel,{nonInteraction:isnoninteractive});

								if(settings.strGoogleUAAccount!==""){

									if(settings.enableGoogleLinker == "true"){
										ga_sis('sisClientTracker.require', 'linker');
									}
									ga_sis('sisClientTracker.send', 'event', category, action, glabel,{nonInteraction:isnoninteractive});
								}

							}//
						}
		
					}
				}

				
			}else if(type =='sis') //only to sis
			{
				stockInStoreGlobal.sendStats(eventtype, category, action, label,value,stockInStore.tags);	
			}else if(type =='gasis') //both to google and sis
			{

				//Check for gtag first
				if(typeof(gtag)!='undefined'){
					
					//SIS
					gtag('event', action, {
						'event_category':settings.strClientName,
						'event_label': glabel,
						'value': '',
						'non_interaction': isnoninteractive,
						'send_to':'sisTracker'
					  });
					
					//if(settings.strGoogleUAAccount!==""){
						gtag('event', action, {
							'event_category':category,
							'event_label': glabel,
							'value': '',
							'non_interaction': isnoninteractive
						  });
					//}

				}else{
					
					if(typeof(ga)!='undefined')
					{
		
						ga('send', 'event', category, action, glabel,{nonInteraction:isnoninteractive});
						
						if(settings.enableGoogleLinker == "true"){
							ga('sisTracker.require', 'linker');
						}
						ga('sisTracker.send', 'event', settings.strClientName, action, glabel,{nonInteraction:isnoninteractive});

						if(settings.strGoogleUAAccount!==""){

							if(settings.enableGoogleLinker == "true"){
								ga('sisClientTracker.require', 'linker');
							}
							
							ga('sisClientTracker.send', 'event', category, action, glabel,{nonInteraction:isnoninteractive});
						}
		
					}else
					{
						if(typeof(_gaq)!='undefined')
						{
		
							_gaq.push(['sisTracker.' + eventtype,settings.strClientName, action, glabel,undefined,isnoninteractive]); 
							_gaq.push([eventtype, category, action, glabel,undefined,isnoninteractive]);

							if(settings.strGoogleUAAccount!==""){
								_gaq.push(['sisClientTracker.' + eventtype, category, action, glabel, undefined, isnoninteractive]); 
							}
							
							
						}else{
							//google analytic object
							if(typeof(window['GoogleAnalyticsObject'])!=="undefined" && window['GoogleAnalyticsObject'] !=="ga"){
								var ga_sis = window[window.GoogleAnalyticsObject];

								ga_sis('send', 'event', category, action, glabel,{nonInteraction:isnoninteractive});
						
								if(settings.enableGoogleLinker == "true"){
									ga_sis('sisTracker.require', 'linker');
								}
								ga_sis('sisTracker.send', 'event', settings.strClientName, action, glabel,{nonInteraction:isnoninteractive});

								if(settings.strGoogleUAAccount!==""){

									if(settings.enableGoogleLinker == "true"){
										ga_sis('sisClientTracker.require', 'linker');
									}
									ga_sis('sisClientTracker.send', 'event', category, action, glabel,{nonInteraction:isnoninteractive});
								}

							}//
						}
		
					}
				}
				
				stockInStoreGlobal.sendStats(eventtype, category, action, label,value,stockInStore.tags);	
		
			}			
	}
	
	/**
	 * 
	 * 
	 */
	stockInStore.getSettings = function(){
		return settings;
	}
	
	/**
	 * Linking function to decide which variation defines the UPI and 
	 * which one updates the next variation selection 
	 * @param {string} e event
	 * @param {string} index current Vartiation Index
	*/
	stockInStore.changeVariation = function(e,index)
	{
		if(index<=(settings.dataVariations.totalVariations-1))

		{
			stockInStore.updateVariation(e,settings.dataVariations.arrayVariationInfo[index].variationLabels);
		}else
		{
			stockInStore.findUPIVariation(e);
		}
		
		//If variation selection is not empty then send to Analytics
		// use e.value if we need to pass the selected variation value

		if(e.value!=="")
		{
			var varLabel = settings.dataVariations.arrayVariationInfo[index-1].variationLabels
			//stockInStore.sendEvents(e,null,'gasis','_trackEvent', 'Stock In Store','Select', 'Variation - ' + varLabel);
			if(!stockInStore.isQuickView){
				settings.fnOnChangeVariation.call(this,settings,e); 
			}else{
				/*var retObj = {};
					retObj.settings = settings;
					retObj.element = e;
					retObj.elementindex = index;
					retObj.eventName = 'onChangeVariation';
					sendQuickViewEvent(retObj);*/
			}
			 
			 
			
		}
		
		//stockInStore.fixIOSScroll();
	}



	/**
	 * Fixing scroll on IOS devices
	 */
	stockInStore.fixIOSScroll = function()
	{
		var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		if(iOS)
		{
			window.scrollTo(0, -10);
		}
	}
	
	/**
	 * From the variation selection get the corresponding variation and populate the variation list
	 * @public
	 * @param {string} elem
 	 * @param {string} variation to be populated
	 */
	 
	stockInStore.updateVariation = function(elem, updatevariationlabel )
	{
			settings.dataIdentifiers.product = '';		
			var data = settings.dataCache.productVariations.response;

			var arrVariations = settings.dataVariations.arrayVariationInfo;
			var arrConditionsObject = [];
			var searchKey = '';
			var lookupid  = elem.getAttribute('data-index');
			var variationArray = [];
			var htmlVariation = '<option value="">Select ' + updatevariationlabel + '</option>';
			var updateid = '';
			var cntVariations = 0;

			for(var i=0;i<settings.dataVariations.arrayVariationInfo.length;i++)
			{
				
				if(settings.dataVariations.arrayVariationInfo[i].variationLabels == updatevariationlabel)
				{
					
					updateid = settings.dataVariations.arrayVariationInfo[i].variationIndex;
				
					
				}
			}
			
			
			
			for(var i=0;i<lookupid;i++)
			{
				var ind = arrVariations[i].variationIndex;
				searchKey += stockInStoreGlobal.querySelect('.sisvar_' + ind)[0].value;
			}
			
			
			for(var i=0;i<data.length;i++)
			{
				var combinekey = '';
				for(var j=0;j<lookupid;j++)
				{
					var ind = arrVariations[j].variationIndex;
					
					var encodedStr = data[i]['variation_' + ind];
					var parser = new DOMParser;
					var dom = parser.parseFromString('<!doctype html><body>' + encodedStr,'text/html');
						combinekey += dom.body.textContent;
					
					//combinekey += data[i]['variation_' + ind];
				}
				if(combinekey == searchKey )
				{

					var varvalue = data[i]['variation_'+updateid];
					
					variationArray.push(varvalue);
					cntVariations++;
				}
			}
			
			
			var nVariationArray = (stockInStoreGlobal.setDistinctArray(variationArray))
			
			
			//Based on the first Variation Value we check if it is a numeric of not
			//so that we sort the value accordingly
			
			//Commented. Sorting is done on the back-end
			/*if(nVariationArray.length>0)
			{
				var getValIndex= nVariationArray[0]
				if(isNaN(getValIndex)) //sort alphabetically
				{
					nVariationArray.sort()
				}else
				{
					nVariationArray.sort(function(a, b){return a-b})
				}
			}*/

			
			for(var j=0;j<nVariationArray.length;j++)
			{
				htmlVariation += '<option value="' + nVariationArray[j] + '">' + nVariationArray[j] + '</option>';
			}
			
			
			
			stockInStoreGlobal.querySelect('.sisvar_' + updateid)[0].innerHTML	 = htmlVariation;
				
			//TO BE TESTED - If there is only one variation from the list then select it	
			if(settings.isVariationSelected == "true")
			{
				if(cntVariations==1)
				{
					stockInStoreGlobal.querySelect('.sisvar_' + updateid)[0].selectedIndex = "1";
					//stockInStoreGlobal.querySelect('.sisvar_' + updateid)[0].onchange();
				}
			}
			stockInStoreGlobal.querySelect('.sisvar_' + updateid)[0].onchange();
			
			updateVariationDisplay(lookupid,elem.value);
	}


	/**
	 * From the variation selection get the product identifier
	 * @public
	 * @param {string} elem
	 */
	stockInStore.findUPIVariation	= function(elem) {

		if(!stockInStore.isQuickView){
			settings.fnFindUPIVariation.call(this,settings,elem);
		}else{
			qvFindUpiVariation();
			/*var retObj = {};
				retObj.settings = settings;
				retObj.element = elem;
				retObj.eventName = 'onFindUPIVariation';
				sendQuickViewEvent(retObj);*/
		} 
		
		
		 updateVariationDisplay(elem.getAttribute('data-index'),elem.value);
		 validateSearch();

	}
	
	/**
	 * Clears the location field on focus
	 * @public
	 * @param {string} elem
	 */
	stockInStore.resetGeolocationField = function( elem ) {
		//settings.dataCache.geolocationObj = null;
		elem.value ='';
		stockInStoreGlobal.removeClassName(elem,'invalid');
		
	}
	
	/**
	 * Implementation of automatic location selection from google location autocomplete
	 * list if none is selected
	 * @public
	 * @param {string} elem
	 */
	stockInStore.validateLocation = function( elem ) {
		//temp code
		
 
		//tem code
		if(elem.value.length>0)
		{
			//if(settings.dataCache.geolocationObj==null)
			//{
				var countryinfo = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?stockInStore.countryDetails:'AU|Australia';
		  		stockInStoreGlobal.addClassName(document.getElementById('searchLocation'),'locating');
				  
				getGeolocation(elem.value,'country:' + (countryinfo.split("|")[0]),function(geodata)
				{
					
			  		stockInStoreGlobal.removeClassName(document.getElementById('searchLocation'),'locating');
					
					if(geodata!==null)
					{
						//here address string
						var resobject = geodata;
						if(typeof(geodata.results)!='undefined'){
							resobject = geodata.results[0];
						}else{
							resobject = geodata[0];
						}


						var addressString = getAddressStringFromComponent(resobject)
						
						if(resobject.formatted_address == '')// || resobject.formatted_address == (countryinfo.split("|")[1]))
						{
							document.getElementById('uiLocationInp').value='';
							
							stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', "" , 8760, '/');						
							stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', "", 8760, '/');	
						}else
						{
							document.getElementById('uiLocationInp').value  = resobject.formatted_address;
							stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', resobject.formatted_address , 8760, '/');						
							stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', addressString, 8760, '/');							
							var getPostCode = getAddressComponents(resobject.address_components,'postal_code');
							if(getPostCode!=="")
							{
								stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', getPostCode , 8760, '/');
							}else{
								stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', "", 8760, '/');
							}
						}
						
						
						var geobj = {}
						
						geobj.lat = resobject.geometry.location.lat();
						geobj.lng = resobject.geometry.location.lng();
						
						stockInStoreGlobal.setCookie('_SISLOCATIONLAT', geobj.lat , 8760, '/');						
						stockInStoreGlobal.setCookie('_SISLOCATIONLNG', geobj.lng , 8760, '/');
						settings.dataCache.geolocationObj = geobj;
						
					}else{
							document.getElementById('uiLocationInp').value='';
							stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', "" , 8760, '/');						
							stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', "", 8760, '/');	
					}
					validateSearch();
				})
			}else
			{
				validateSearch();
			}
		//}else
		//{
		//	validateSearch();
		//}
		stockInStore.sendEvents(elem,null,'gasis','_trackEvent', 'Stock In Store', 'Focus', 'Location Field','');		
	};
	


	/**
	 * Get Current location functionality
	 */
	stockInStore.getCurrentGeolocation = function(elem) {
		if (typeof google === 'object' && typeof google.maps === 'object'){
		}else{
			return;
		}
		
		if (navigator.geolocation)
			{
			  navigator.geolocation.getCurrentPosition(
			  
					function(position) //handle position
					{
						
						var geobj = {}
						geobj.lat = position.coords.latitude;
						geobj.lng = position.coords.longitude;
						settings.dataCache.geolocationObj = geobj;
						stockInStoreGlobal.setCookie('_SISLOCATIONLAT', geobj.lat , 8760, '/');						
						stockInStoreGlobal.setCookie('_SISLOCATIONLNG', geobj.lng , 8760, '/');

						getAddressByLatLng(geobj.lat,geobj.lng,function(data){
							
							if(data!==null)
							{
								
								var addressString = getAddressStringFromComponent(data[0])
								
								document.getElementById('uiLocationInp').value=data[0].formatted_address
								stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', data[0].formatted_address , 8760, '/');
								stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', addressString, 8760, '/');
								
								var getPostCode = getAddressComponents(data[0].address_components,'postal_code');
								if(getPostCode!=="")
								{
									stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', getPostCode , 8760, '/');
								}else{
									stockInStoreGlobal.setCookie('_SISLOCATIONPCODE', "", 8760, '/');
								}

								var getCountryCode = getAddressComponents(data[0].address_components,'country');
								var getCountryName = getAddressComponentsProp(data[0].address_components,'country','long_name');
								
								if(getCountryCode!==""){
									stockInStore.initialiseStoreCountry(getCountryCode,false)
									//Need to set cookie for country when clicking on current location
									stockInStore.countryDetails  = getCountryCode + "|" + getCountryName;
									stockInStoreGlobal.setCookie('_SIS_COUNTRY',  getCountryCode + "|" + getCountryName  , 30, '/')
									


									if(typeof(sisAutocomplete)!=="undefined"){

										var countryinfo = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?stockInStore.countryDetails:'AU|Australia';
											
										getGeolocation(countryinfo.split("|")[1],'country:' + (countryinfo.split("|")[0]),function(geodata)
										{
											if(geodata.length>0){
												localStorage.setItem('SISCountryGeometry', JSON.stringify(geodata[0].geometry));
												sisAutocomplete.setBounds(geodata[0].geometry.bounds)
											}
							
											
										})
							
							
										sisAutocomplete.setComponentRestrictions({country:( typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?(stockInStore.countryDetails.split("|")[0]):'AU'});
									}



								}
								
								
								validateSearch();
							}
						})
					},
					//---------------------
					function(error) //handle errors
					{
						switch(error.code)
						{
							case error.PERMISSION_DENIED: geolocationErrorHandler('PERMISSION_DENIED');
							break;
							
							case error.POSITION_UNAVAILABLE: geolocationErrorHandler('POSITION_UNAVAILABLE');
							break;
							
							case error.TIMEOUT: geolocationErrorHandler('TIMEOUT');
							break;
							
							default: geolocationErrorHandler('UNKNOWN');
							break;
						}
					}
			  );
			}else
			{
				geolocationErrorHandler('NOTSUPPORTED')
			}
			
			stockInStore.sendEvents(elem,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Search - Current Location','');
	};
	
	/**
	 * Select a different radius
	 * @public
	 * @param {string} elem
	 */
	stockInStore.updateRadius = function( elem ) {

		setRadius(elem.value);
		
		stockInStore.sendEvents(elem,null,'gasis','_trackEvent', 'Stock In Store', 'Select', 'Radius','');		

		if(!stockInStore.isQuickView){
			settings.fnOnUpdateRadius.call(this,settings,elem);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.element = elem;
				retObj.eventName = 'onUpdateRadius';
				sendQuickViewEvent(retObj);
		} 


	};


	stockInStore.updateMetric= function( elem ) {


		


		setMetric(elem.value);
		
		stockInStore.sendEvents(elem,null,'gasis','_trackEvent', 'Stock In Store', 'Select', 'Metric','');		

		if(!stockInStore.isQuickView){
			settings.fnOnUpdateMetric.call(this,settings,elem);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.element = elem;
				retObj.eventName = 'fnOnUpdateMetric';
				sendQuickViewEvent(retObj);
		} 


	};
	
	/*Executes FindNearestStores when geolocation process is completed*/
	var checkLocationProgess = function(elem){
		settings.dataCache.locatingInterval= window.setInterval(function(elem){
			var locating = stockInStoreGlobal.checkClassName(document.getElementById('searchLocation'),'locating')
			if(!locating){
				window.clearInterval(settings.dataCache.locatingInterval);				
				if(!stockInStoreGlobal.checkClassName(document.getElementById('uiLocationInp'),'invalid')){

					stockInStore.findNearestStores(elem);
					document.getElementById('uiSearchGoBtn').removeAttribute('disabled');

				}
			}
			
		},1)
	}
	
	/**
	 * Find Nearest Store
	 * @public
	 */
	stockInStore.findNearestStores = function(elem) {
		
		if (typeof google === 'object' && typeof google.maps === 'object'){
		}else{
			return;
		}

		
		var getCookieLocationPCode = stockInStoreGlobal.getCookie('_SISLOCATIONPCODE');
		var searchStoresByState = false;
		var getStateSearch = "";


		var getCountryCode = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?(stockInStore.countryDetails.split("|")[0]):'AU'
		var filterStoresWithinCountry = false;
	
		if(settings.dataCache.radiusSearch == ""  || parseFloat(settings.dataCache.radiusSearch)>=9999){
			filterStoresWithinCountry = true
			
		}

		if(settings.returnAllStoresInStateIfNoPostcode=="true" && getCookieLocationPCode==""){
			searchStoresByState = true;
			var getStateSearchString = stockInStoreGlobal.getCookie("_SISADDRESSCOMPONENTS");
			var arrComp = getStateSearchString.split(",")

			var findColoquial = false;

			for(var ci=0;ci<arrComp.length;ci++){
				var arrcompprop = arrComp[ci].split(":")[0]

				if(arrcompprop == "ca"){
					findColoquial = true;
				}

				if(arrcompprop == "ly"){
					findColoquial = true;
				}
				
				if(arrcompprop == "aal1"){
					getStateSearch = arrComp[ci].split(":")[1]
				}
			}
				
		}

		if(getStateSearch == ""){
			searchStoresByState = false;
		}
		if(findColoquial){
			searchStoresByState = false;
		}
		//console.log('%c Search store by state ' +searchStoresByState , 'background: #222; color: #bada55');

		if(!stockInStore.isQuickView){
			settings.fnOnSearchStores.call(this,settings,elem);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.element = elem;
				retObj.eventName = 'onSearchStores';
				sendQuickViewEvent(retObj);
		} 

		
		if(stockInStoreGlobal.checkClassName(document.getElementById('searchLocation'),'locating')){
			var attrdis = document.createAttribute('disabled');
			attrdis.value = 'disabled';
			document.getElementById('uiSearchGoBtn').setAttributeNode(attrdis);
			checkLocationProgess(elem);
			return
		}else{
			if(stockInStoreGlobal.checkClassName(document.getElementById('uiLocationInp'),'invalid')){
				return
			}
		};

		if(settings.dataCache.widgetType == "product"){
			//Disable the update search button and enable after the storelist is displayed
			var attrdis = document.createAttribute('disabled');
				attrdis.value = 'disabled';

			var attrdisb = document.createAttribute('disabled');
				attrdisb.value = 'disabled';

			//for sis button widget			
			
				document.getElementsByClassName('uiShowProductSelectionBtn')[0].setAttributeNode(attrdis);
				document.getElementsByClassName('uiShowProductSelectionBtn')[1].setAttributeNode(attrdisb);

		}
		
		
		var storeData 	= settings.dataCache.storesMasterLocation;
		var geoposition = settings.dataCache.geolocationObj;
		
		var arrDispOrderedStoreList = [];
		var arrDispOrderedStoreListNotInRange = []
		
		document.getElementById('storeListResult').innerHTML = settings.objConfigPreLoaders.storeList;



	

		//We find the closest stores by location
		for(var i=0;i<storeData.length;i++)
		{
			

			if(filterStoresWithinCountry){
				if(storeData[i].country_code !== getCountryCode){
					continue;
				}
			}


			//console.log(storeData[i])
			var caldis = 9999;
			
			if(storeData[i].latitude!=="" && storeData[i].longitude!=="")
			{
				if(geoposition!==null){
					caldis = stockInStoreGlobal.calculateGeoDistance(geoposition.lat,geoposition.lng,storeData[i].latitude,storeData[i].longitude)
				}
				
				if(isNaN(caldis)){
					caldis = 9999;
				}else{
					if(settings.dataCache.metricSearch=="mi"){
						caldis = parseFloat(caldis * 0.621371).toFixed(2)
					}else{
						caldis = parseFloat(caldis).toFixed(2)
					}
				}
			}
			
			

			var objRes  = {
				code:storeData[i].code,
				distance:caldis,
				geoposition:	{
							lat:storeData[i].latitude,
							lng:storeData[i].longitude
						},
				info:null,
				regioncode:storeData[i].region_code,
				name:storeData[i].name.toLowerCase(),
				country_code:storeData[i].country_code
		  	}
			
			
			if(searchStoresByState){
			
				if(getStateSearch!==""){
					//if(storeData[i].region_code.toLowerCase() == getStateSearch.toLowerCase() ){
					if(stockInStoreGlobal.searchArray(getStateSearch,storeData[i].region_names)){

						arrDispOrderedStoreList.push(objRes);	
					}else{
						arrDispOrderedStoreListNotInRange.push(objRes)
					}

				}else{
					arrDispOrderedStoreList.push(objRes);
				}

				
			}else{
				//limit the stores to certain radius
				if(settings.dataCache.radiusSearch!='')
				{
					if(caldis<=parseFloat(settings.dataCache.radiusSearch)){ //set temporary value to pass limit radis later
					
						arrDispOrderedStoreList.push(objRes);				  
					}else
					{
						arrDispOrderedStoreListNotInRange.push(objRes)
					}
				}else //no limit radius
				{
					arrDispOrderedStoreList.push(objRes);				  
				}

			}  
		}
		
		if(searchStoresByState){

			arrDispOrderedStoreList.sort(compareStoreName) //sort by distance
			arrDispOrderedStoreListNotInRange.sort(compareStoreName)

		}else{

			arrDispOrderedStoreList.sort(compareDistance) //sort by distance
			arrDispOrderedStoreListNotInRange.sort(compareDistance)

		}

		
		var arrPassStorelist = [];
		var noStoresFoundInRange = false;

		//if we cannot any stores within the range then display all
		if(arrDispOrderedStoreList.length == 0){
			noStoresFoundInRange = true;
				
			if(settings.dataCache.widgetType == "product"){
				
					if(settings.showNearestStore=='true')
					{
					
						stockInStore.showGlobalMessage(settings.htmlNoStoreFoundTemplate,true);
				
						if(settings.showOnlyNearestStore == 'true')
						{
							var findStoreWithinCountry = false;
							for(var os=0;os<arrDispOrderedStoreListNotInRange.length;os++){

								
								if(arrDispOrderedStoreListNotInRange[os].country_code == getCountryCode){

									settings.dataCache.stores = [arrDispOrderedStoreListNotInRange[os]];
									arrPassStorelist.push(settings.dataCache.stores[0].code)
	
									findStoreWithinCountry = true;
									break;
								}

							}


							if(!findStoreWithinCountry){
								settings.dataCache.stores = [arrDispOrderedStoreListNotInRange[0]];
								arrPassStorelist.push(settings.dataCache.stores[0].code)
							}
						}else //show all ordered by nearest
						{
							settings.dataCache.stores = arrDispOrderedStoreListNotInRange;
							for(var j=0;j<settings.dataCache.stores.length;j++)
							{
								arrPassStorelist.push(settings.dataCache.stores[j].code)
							}	
							
						}
					}else
					{
						displayNoStores(true);
					}
			}else{
				settings.dataCache.stores = arrDispOrderedStoreListNotInRange;
				for(var j=0;j<settings.dataCache.stores.length;j++)
				{
					arrPassStorelist.push(settings.dataCache.stores[j].code)
				}	

			}


			//displayNoStores();
		}else{
			noStoresFoundInRange = false;
			
			settings.dataCache.stores = arrDispOrderedStoreList; //stores are now in order of closest first		
			for(var j=0;j<settings.dataCache.stores.length;j++)
			{
				arrPassStorelist.push(settings.dataCache.stores[j].code)
			}	
		}
		
	
		
		// we pass the closest stores  with the location object
		getStoresStock(arrPassStorelist,geoposition,function(resultdata)
		{
			settings.dataCache.storesUnordered = resultdata.response;
			
			//Enable the update search button
			//for sis button widget			
			if(settings.dataCache.widgetType == "product"){
				document.getElementsByClassName('uiShowProductSelectionBtn')[0].removeAttribute('disabled');
				document.getElementsByClassName('uiShowProductSelectionBtn')[1].removeAttribute('disabled');
			}
			
			var lstoresres = 0;
			var storesres= settings.dataCache.stores //ordered list of stores;

			if(settings.dataCache.widgetType == "product"){
				if(noStoresFoundInRange){
					if(settings.showNearestStore == 'true')
					{
						if(settings.showOnlyNearestStore == 'true')
						{
							lstoresres = 1; //only the next closest
						}else
						{
							lstoresres = storesres.length;
						}
					}
				}else
				{
					lstoresres = storesres.length;
				}
			}else{
				lstoresres = storesres.length;
			}
			
				
			var storesStr = "";
			var pdata = {};
			var storeListingInfo = {};
				storeListingInfo.stores = [];
				
				
				
			for(var i=0;i<lstoresres;i++)
			{
				var storeobj = {}
				
				storesres[i].info = getStoreInformationFromUnorderedList(storesres[i].code);
					storesStr += (i>0?",":"") + storesres[i].code
				storeobj.code = storesres[i].code;
				storeobj.index = (i+1);
				storeobj.stock = storesres[i].info.stock;
				storeobj.stocklevel = escape(storesres[i].info["fis"].label);
				storeobj.stocklevels = {}
				storeobj.stockvalues = {}
				storeobj.stocklevels.fis = escape(storesres[i].info["fis"].label);
				storeobj.stockvalues.fis = storesres[i].info["fis"].value;
				if(typeof(storesres[i].info["cnc"].label)!=="undefined"){
					storeobj.stocklevels.cnc = escape(storesres[i].info["cnc"].label);
					storeobj.stockvalues.cnc = storesres[i].info["cnc"].value;
				}else{
					storeobj.stocklevels.cnc = "";
				}
				
				storeobj.distance = parseFloat(storesres[i].distance).toFixed(2);
				
				storeListingInfo.stores.push(storeobj)
				
			}
			storeListingInfo.totalstores = lstoresres;
			pdata.storeListingInfo = storeListingInfo;
			pdata.searchInfo = settings.dataCache.searchForm.searchInfo;
			settings.dataCache.storeListingInfo = storeListingInfo;

			var nostoredata = {}
				nostoredata = settings.dataCache.searchForm.searchInfo
			
			if(noStoresFoundInRange)
			{
				pdata.outOfRange = "true";
			}else
			{
				pdata.outOfRange = "false";
			}



			addLogDataHideStores(pdata);


			//if(settings.showNearestStore!=='true')
			//{
				if(typeof(nostoredata.stores)!='undefined')
				{

					delete nostoredata["stores"];
				}
			//}
			
			
			
			
			if(lstoresres>0)
			{
				stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Load', 'Display Stores - stores:' + storesStr,'');
				stockInStore.sendEvents(null,null,'sis','_trackEvent', 'Stock In Store', 'Load', 'Display Stores',JSON.stringify(pdata));
				displayStores();
			}else
			{
				var ndata = {};
					ndata.searchInfo = nostoredata
					addLogDataHideStores(ndata);
				stockInStore.sendEvents(null,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Stores - No Stores Found',JSON.stringify(ndata));
			}
			
			//as the result store list in not ordered by distance, first we need to reorder the list
			//reorderStoreInformation();
		
		})

		
	};	 

	var addLogDataHideStores = function(pdata){
		var getCookieHideStores =  	stockInStoreGlobal.getCookie('_SISHIDESTORESNOSTOCK');
		var getCookieHideStoresCC = stockInStoreGlobal.getCookie('_SISHIDESTORESNOCC');

		//Check the hide stores settings
		
		pdata.hideStoresNoStock = "false";
		pdata.hideStoresNoCnc = "false";	

		pdata.hideStoresNoStockDefault = "hide";
		pdata.hideStoresNoCncDefault = "hide";

		if(settings.setHideStoresNoStockDefault == 'true'){
			if(getCookieHideStores == ""){
				pdata.hideStoresNoStock = true;
			}else{
				pdata.hideStoresNoStock = getCookieHideStores;
			}
			pdata.hideStoresNoStockDefault = 'show';
		}

		if(settings.setHideStoresNoCncDefault == 'true'){
			if(getCookieHideStoresCC == ""){
				pdata.hideStoresNoCnc = true;
			}else{
				pdata.hideStoresNoCnc = getCookieHideStoresCC;
			}
			pdata.hideStoresNoCncDefault = 'show';
		}

	}
	
	/**
	 * Show Global Message
	 * @param content, usetemplate=true, content should be a template name
	 * @param usetemplate
	 */

	 stockInStore.showGlobalMessage = function(content,usetemplate)
	 {
		var globalMessageCon =  document.getElementById('globalSisMessage');
		
		if(usetemplate)
		{
			var template = Handlebars.compile(content);
			globalMessageCon.innerHTML = template(settings.dataCache);
		}else
		{
			globalMessageCon.innerHTML  = content;
		}
		
  		stockInStoreGlobal.addClassName(document.getElementById('globalSisMessage'),'show');
		
		
		var globalMessTmout = window.setTimeout(function(){
			stockInStore.hideGlobalMessage();
			window.clearTimeout(globalMessTmout);		
		},(settings.intMessageTimeout*1000))
	 }
	 
	/**
	 * Hide Global Message
	 */
	 stockInStore.hideGlobalMessage = function()
	 {
 		stockInStoreGlobal.removeClassName(document.getElementById('globalSisMessage'),'show');
	 }
		 
	


	/**
	 * 
	 */

	stockInStore.showhideNoStockStore = function( elm ) {

		var allStores = stockInStoreGlobal.querySelect(".storeDetails")
		var foundNoStockCC = false;

		var messContainer = stockInStoreGlobal.querySelect("#storeListWrap .sisNoStockMessages")[0]
		var messNoStock = stockInStoreGlobal.querySelect("#storeListWrap .sisNoStockNoStoresMessage")[0]
		var messNoCC = stockInStoreGlobal.querySelect("#storeListWrap .sisNoCCNoStoresMessage")[0]

		stockInStoreGlobal.removeClassName(messContainer,'showElement');

		stockInStoreGlobal.removeClassName(messNoStock,'showElement');
		stockInStoreGlobal.removeClassName(messNoCC,'showElement');


		var chkInpNoStock = document.getElementById("sisUIHideShowNoStockStores");
		var chkInpNoCC = document.getElementById("sisUIHideShowNoCCStores");

		if(chkInpNoStock.checked){
			stockInStoreGlobal.setCookie('_SISHIDESTORESNOSTOCK', 'true', 525600, '/');							
			
		}else{
			stockInStoreGlobal.setCookie('_SISHIDESTORESNOSTOCK', 'false', 525600, '/');
		}

		if(chkInpNoCC.checked){
			stockInStoreGlobal.setCookie('_SISHIDESTORESNOCC', 'true', 525600, '/');							
			
		}else{
			stockInStoreGlobal.setCookie('_SISHIDESTORESNOCC', 'false', 525600, '/');
		}

		if(elm!=null){
			if(elm.id == "sisUIHideShowNoStockStores"){
				if(elm.checked){
					stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Click', 'Hide Stores: No Stock - True','');
				}else{
					stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Click', 'Hide Stores: No Stock - False','');
				}
			}

			if(elm.id == "sisUIHideShowNoCCStores"){
				if(elm.checked){
					stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Click', 'Hide Stores: No Click Collect - True','');
				}else{
					stockInStore.sendEvents(null,null,'ga','_trackEvent', 'Stock In Store', 'Click', 'Hide Stores: No Click Collect - False','');
				}

			}

			//

		}

		var optConditions = 0;
		if(chkInpNoCC.checked && chkInpNoStock.checked){
			optConditions = 1;
		}else{
			if(chkInpNoStock.checked){
				optConditions = 2;
			}

			if(chkInpNoCC.checked){
				optConditions = 3;
			}
		
		}

		for(var i=0;i<allStores.length;i++){

			if(optConditions == 0){
				stockInStoreGlobal.removeClassName(allStores[i],'hideElement');
			}else{
				var getStockAvail = allStores[i].querySelector(".storeStock").getAttribute("data-stock-value")

				if(optConditions == 1){
					var getCCAvail = allStores[i].querySelector(".storeStock").getAttribute("data-stock-cnc-value")
					if(parseInt(getStockAvail)<=0 && parseInt(getCCAvail)<=0){

						foundNoStockCC = true;
						stockInStoreGlobal.addClassName(allStores[i],'hideElement');
					}else{
						stockInStoreGlobal.removeClassName(allStores[i],'hideElement');
					}

				}else if(optConditions == 2){
					if(parseInt(getStockAvail)<=0){
						foundNoStockCC = true;
						stockInStoreGlobal.addClassName(allStores[i],'hideElement');
					}else{
						stockInStoreGlobal.removeClassName(allStores[i],'hideElement');
					}
				}else if(optConditions == 3){
					var getCCAvail = allStores[i].querySelector(".storeStock").getAttribute("data-stock-cnc-value")
					if(parseInt(getCCAvail)<=0){
						foundNoStockCC = true;
						stockInStoreGlobal.addClassName(allStores[i],'hideElement');
					}else{
						stockInStoreGlobal.removeClassName(allStores[i],'hideElement');
					}
				}
			}

			
		}
		var showMessContainer = false;
		if(foundNoStockCC){
			// we need to reposition the store list
			var storeList 	= document.getElementById('storesList');
			storeList.style.marginLeft = '0px';
		
			if(allStores.length == stockInStoreGlobal.querySelect(".storeDetails.hideElement").length){
				if(settings.showHideStoresNoStock == 'true'){
					if(chkInpNoStock.checked){
						stockInStoreGlobal.addClassName(messNoStock,'showElement');
						showMessContainer = true;
					}
				}
		
				if(settings.showHideStoresNoCnc == 'true'){

					if(chkInpNoCC.checked){
						stockInStoreGlobal.addClassName(messNoCC,'showElement');
						showMessContainer = true;
					}
				}
	
			}

		}

		if(showMessContainer){
			stockInStoreGlobal.addClassName(messContainer,'showElement');
		}

		var pdata = {};
		pdata.searchInfo = settings.dataCache.searchForm.searchInfo;
		pdata.storeListingInfo = settings.dataCache.storeListingInfo;
		pdata.storeListingFilterInfo = {};
		pdata.storeListingFilterInfo.stores = [];
		
		var filteredStores   = stockInStoreGlobal.querySelect(".storeDetails:not(.hideElement)")
		for(var s=0;s<filteredStores.length;s++){
			
			var getStoreCode = filteredStores[s].getAttribute('data-storecode');

			for(var j=0;j<settings.dataCache.storeListingInfo.stores.length;j++){
				if(settings.dataCache.storeListingInfo.stores[j].code == getStoreCode){
					pdata.storeListingFilterInfo.stores.push(settings.dataCache.storeListingInfo.stores[j]);
					break;
				}
			}
			
			//push here
		}

		pdata.storeListingFilterInfo.totalstores = filteredStores.length;
		addLogDataHideStores(pdata);

		if(elm!=null){

	

			if(elm.id == "sisUIHideShowNoStockStores"){
			
				stockInStore.sendEvents(null,null,'sis','_trackEvent', 'Stock In Store', 'Click', 'Hide Stores - No Stock',JSON.stringify(pdata));
				stockInStoreGlobal.savedLogString = ""; //to allow the same event to consecutively sent

			}

			if(elm.id == "sisUIHideShowNoCCStores"){
				
				stockInStore.sendEvents(null,null,'sis','_trackEvent', 'Stock In Store', 'Click', 'Hide Stores -  No Click Collect',JSON.stringify(pdata));
				stockInStoreGlobal.savedLogString = "";
			}

			//

		}else{
			stockInStore.sendEvents(null,null,'sis','_trackEvent', 'Stock In Store', 'Load', 'Hide Stores',JSON.stringify(pdata));
		}
		
		

		styleStoreElemContainer();

	}



	/**
	 * Store Navigation : Hide Store
	 * @public
	 * @param {string} elem
	 */
	stockInStore.hideStore = function( elm ) {
			
			var storeList = document.getElementById('storesList');
			
			//if there is only one remaining visible container then disable hideElement store
			if(storeList.style.width == settings.objConfigStoreListContainer.storeElemcontainer.width + 'px')
			{
				return;
			}
			
			var parentelm =  elm.parentNode.parentNode.parentNode
			parentelm.className = 'storeDetails hideElement';
			styleStoreElemContainer();
			
			if(getWidthVal() + getLeftPost() == 0)
			{
				stockInStore.prevStore();
			}
			
			var pdata = {}
			var storeEventsInfo = {}
			 getDataAttributes(elm,storeEventsInfo)

			storeEventsInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
			storeEventsInfo.storeListingInfo = settings.dataCache.storeListingInfo;
			pdata.storeEventsInfo = storeEventsInfo;
			addLogDataHideStores(pdata);
			
			stockInStore.sendEvents(elm,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Stores - Hide',JSON.stringify(pdata));	
			stockInStoreGlobal.savedLogString = "";

			if(!stockInStore.isQuickView){
				settings.fnOnHideStore.call(this,settings,elm);
			}else{
				var retObj = {};
					retObj.settings = settings;
					retObj.element = elm;
					retObj.eventName = 'onHideStore';
					sendQuickViewEvent(retObj);
			} 
	
			
	};
	
	/**
	 * Store Navigation : Previous Store
	 * @public
	 * @param {string} elem
	 */
	stockInStore.prevStore = function( elm ) {
		
			var leftPos 	= getLeftPost();
			var storeList 	= document.getElementById('storesList');
	
			//if(leftPos==0){return;}
			var multiplier = settings.objConfigStoreListContainer.storeElemcontainer.width * settings.objConfigStoreListContainer.storeElemcontainer.moveby
			storeList.style.marginLeft = (leftPos + multiplier)+ 'px';
			if(stockInStore.isQuickView){
			
				var retObj = {};
				retObj.settings = settings;
				retObj.eventName = 'onPrevStore';
				sendQuickViewEvent(retObj);
	
			}

			checkStoreNavigation();
			stockInStore.sendEvents(elm,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Stores - Prev','');			
	};

	/**
	 * Store Navigation : Next Store
	 * @public
	 * @param {string} elem
	 */
	stockInStore.nextStore = function( elm ) {

	 		var leftPos = getLeftPost();
			var storeList 	= document.getElementById('storesList');
			var widthStr = getWidthVal();
	
			var diffDis = widthStr  - Math.abs(leftPos) ;
			var multiplier = settings.objConfigStoreListContainer.storeElemcontainer.width * settings.objConfigStoreListContainer.storeElemcontainer.moveby;
			
			//if(diffDis<=settings.objConfigStoreListContainer.storeElemcontainer.width)
			//{
			//	return;
			//}
			
			//if(diffDis<=multiplier)
			//{
			//	return;
			//}
			
			storeList.style.marginLeft = (leftPos - multiplier)+ 'px';


			if(stockInStore.isQuickView){
			
				var retObj = {};
				retObj.settings = settings;
				retObj.eventName = 'onNextStore';
				sendQuickViewEvent(retObj);
	
			}

			checkStoreNavigation();
			stockInStore.sendEvents(elm,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Stores - Next','');			
	};
	
	/**
	 * Hide Product Selection Container 
	 * @public
	 * @param {string} elem
	 * @param {string} class or id element to hide
	 */
	stockInStore.hideProductSelection = function( elm,target ) {
		
		stockInStoreGlobal.removeClassName(document.getElementById('mobileSearch'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('mobileSearch'),'showElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('productSelection'),'showElement');
		stockInStoreGlobal.addClassName(document.getElementById('productSelection'),'hideElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('storeList'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('storeList'),'showElement');

		
		
		
		
		
		stockInStoreGlobal.removeClassName(document.getElementById('productFeatureControls'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('productFeatureControls'),'showElement');
		
		stockInStore.sendEvents(elm,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Hide Search','');		
		
		
		if(!stockInStore.isQuickView){
			settings.fnOnCancelSearch.call(this,settings,elm);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.element = elm;
				retObj.eventName = 'onCancelSearch';
				sendQuickViewEvent(retObj);
		} 

		
	};

	/**
	 * Show Product Selection Container 
	 * @public
	 * @param {string} elem
	 * @param {string} class or id element to show
	 */
	stockInStore.showProductSelection = function( elm, target ) {
	
		stockInStoreGlobal.removeClassName(document.getElementById('mobileSearch'),'showElement');
		stockInStoreGlobal.addClassName(document.getElementById('mobileSearch'),'hideElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('productSelection'),'hideElement');
		stockInStoreGlobal.addClassName(document.getElementById('productSelection'),'showElement');
		
		stockInStoreGlobal.removeClassName(document.getElementById('storeList'),'showElement');
		stockInStoreGlobal.addClassName(document.getElementById('storeList'),'hideElement');
		
		
		stockInStoreGlobal.removeClassName(document.getElementById('storeStockModal'),'storelistactive');	

		stockInStoreGlobal.removeClassName(document.getElementById('productFeatureControls'),'showElement');
		stockInStoreGlobal.addClassName(document.getElementById('productFeatureControls'),'hideElement');
		
		stockInStore.closeBagItems();

		if(typeof(document.getElementsByClassName('geolocationError')[0])!= 'undefined')
		{
			stockInStoreGlobal.addClassName(document.getElementsByClassName('geolocationError')[0],'hideElement');
		}
		
		
		stockInStore.hideGlobalMessage();
		stockInStore.sendEvents(elm,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Update Search','');
		

		if(!stockInStore.isQuickView){
			settings.fnOnUpdateSearch.call(this,settings,elm);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.element = elm;
				retObj.eventName = 'onUpdateSearch';
				sendQuickViewEvent(retObj);
		} 

		
		/*
		var chckTarget	 = stockInStoreGlobal.getClassOrID(target);
		if(chckTarget == 'ID'){
			document.getElementById(target.substring(1)).style.display = 'block';
		}else if(chckTarget  == 'CLASS')
		{
			document.getElementsByClassName(target.substring(1)).style.display = 'block';
		}else
		{
			document.getElementById(target).style.display = 'block';
		}
		*/
	};
	
	
	/**
	 * Show Store Address
	 * @public
	 * @param {string} show Address button or element
	 */
	stockInStore.showAddress = function( elm ) {
		
		var AddressShown = stockInStoreGlobal.checkClassName(elm.parentNode.getElementsByClassName('addressDetails')[0], 'show');
		
		var pdata = {}
		var storeEventsInfo = {}
		 getDataAttributes(elm,storeEventsInfo)

		storeEventsInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
		storeEventsInfo.storeListingInfo = settings.dataCache.storeListingInfo;
		pdata.storeEventsInfo = storeEventsInfo;
		addLogDataHideStores(pdata);

		if(AddressShown == true) {
			elm.parentNode.getElementsByClassName('addressDetails')[0].className = 'addressDetails';
			

			if(!stockInStore.isQuickView){
				settings.fnOnHideStoreAddress.call(this,settings,elm);
			}else{
				var retObj = {};
					retObj.settings = settings;
					retObj.element = elm;
					retObj.eventName = 'onHideStoreAddress';
					sendQuickViewEvent(retObj);
			} 
	


		}else{
			elm.parentNode.getElementsByClassName('addressDetails')[0].className = 'addressDetails show';
			stockInStore.sendEvents(this,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Stores - Show Address',JSON.stringify(pdata));
			stockInStoreGlobal.savedLogString = "";
	
			if(!stockInStore.isQuickView){
				settings.fnOnShowStoreAddress.call(this,settings,elm);
			}else{
				var retObj = {};
					retObj.settings = settings;
					retObj.element = elm;
					retObj.eventName = 'onShowStoreAddress';
					sendQuickViewEvent(retObj);
			} 
	
			
		}
		
	};
	
	
	/**
	 * Show Stores Hours 
	 * @public
	 * @param {string} show hours button or element
	 */
	stockInStore.showHours = function( elm ) {
		
		var HoursShown = stockInStoreGlobal.checkClassName(elm.parentNode.getElementsByClassName('openHours')[0], 'show');
		
		if(HoursShown == true) {
			elm.parentNode.getElementsByClassName('openHours')[0].className = 'openHours';


			if(!stockInStore.isQuickView){
				settings.fnOnHideStoreHours.call(this,settings,elm);
			}else{
				var retObj = {};
					retObj.settings = settings;
					retObj.element = elm;
					retObj.eventName = 'onHideStoreHours';
					sendQuickViewEvent(retObj);
			} 


		}else{
			elm.parentNode.getElementsByClassName('openHours')[0].className = 'openHours show';
			
		 var pdata = {};
		 var storeEventsInfo = {}
		 
		 getDataAttributes(elm,storeEventsInfo)
		 storeEventsInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
		 storeEventsInfo.storeListingInfo = settings.dataCache.storeListingInfo;

		 pdata.storeEventsInfo = storeEventsInfo;
		 addLogDataHideStores(pdata);
		 stockInStore.sendEvents(this,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Stores - Hours',JSON.stringify(pdata));
		 

		if(!stockInStore.isQuickView){
			settings.fnOnShowStoreHours.call(this,settings,elm);
		}else{
			var retObj = {};
				retObj.settings = settings;
				retObj.element = elm;
				retObj.eventName = 'onShowStoreHours';
				sendQuickViewEvent(retObj);
		} 


		}
		
	};
	
	/**
	* Open Email Client and populate email to and subject with store details
	* @public
	*/
	stockInStore.emailStore = function(storeid,email,clientname,storename,sku,bccemail){
		
		var ndata = {};
		var emailInfo = {};
		
			emailInfo.storeid = storeid;
			emailInfo.storename = storename;
			emailInfo.email= email;
			emailInfo.sku = sku;
			ndata.emailInfo = emailInfo;

			//Can add to basket without doing a find in store search
			if(settings.dataCache.searchForm!==null && settings.dataCache.storeListingInfo!==null){
				var storeEventsInfo = {}
				storeEventsInfo.searchInfo = settings.dataCache.searchForm.searchInfo;
				storeEventsInfo.storeListingInfo = settings.dataCache.storeListingInfo;
				ndata.storeEventsInfo = storeEventsInfo;
				addLogDataHideStores(ndata);

			}
			
			
		stockInStore.sendEvents(null,null,'gasis','_trackEvent', 'Stock In Store', 'Click', 'Stores - Email',JSON.stringify(ndata));
		stockInStoreGlobal.savedLogString = "";
		
		
			var cntitems = 0;
			var divs = stockInStoreGlobal.querySelect('#productInformationResults > div')
			var featureString = "";
			for(var i=0;i<divs.length;i++){
				if(divs[i].id !=='productFeatureControls'){
					if(divs[i].innerText!==""){
						if((divs[i].innerText.split(" ").join(""))!==""){
							cntitems++;
							featureString += encodeURIComponent(divs[i].innerText.trim()) + '%0D%0A';
							if(cntitems > 0){
								featureString += '%0D%0A';

							}
						}
					}
				}

			}
			var bodycontent = 'Hi ' + stockInStoreGlobal.titleCase(storename) + ',' + '%0D%0A%0D%0A';

			if(cntitems>1){
				bodycontent += 'I am looking for these items below to see if they are available in store.'+ '%0D%0A%0D%0A';
			}else{
				bodycontent += 'I am looking for the item below to see if it is available in store.'+ '%0D%0A%0D%0A';
			}

			
			bodycontent	+= 'Please contact me on the following phone number: +'+ '%0D%0A%0D%0A'; 	

			bodycontent += featureString;

			var siteName = clientname;
			if(typeof(settings.siteName!=="undefined")){
				if(settings.siteName!==""){
					siteName = settings.siteName;
				}	
			}	
		
		var mailtostring = 'mailto:' + email + '?subject=STOCKINSTORE%20Enquiry%3A%20' + encodeURIComponent(siteName.toUpperCase()) + '%20' + encodeURIComponent(storename.toUpperCase()) + (bccemail!==""?('&bcc=' + bccemail):"") + '&body=' + bodycontent;		
			
			
		
		//window.location = mailtostring;
		location.href = mailtostring;
	}
	
	/**
	 * Callback is call when google location script is loaded
	 * @public
	 */
	 stockInStore.initialiseLocationServices = function() {
	  // Create the sisAutocomplete object, restricting the search to geographical
	  // location types.
	  
	  

		//initialiase UI DATA
		settings.dataCache.radiusSearch = settings.objConfigRadius.defaultValue;
		
		
		//We check if Page is https to hide or show the current location Button
		 if("https:" !== document.location.protocol){
			 var parentUIL = document.getElementById('uiCurrentLocationBtn').parentNode
			 if(parentUIL!==null){
	 			stockInStoreGlobal.addClassName(parentUIL,'hideElement');
			 }
		 }
		



	 var getCountryCode = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?(stockInStore.countryDetails.split("|")[0]):'AU'
	 stockInStore.initialiseStoreCountry(getCountryCode,true)

	 

	 if(!stockInStore.isQuickView){
		settings.fnOnDisplayWidget.call(this,settings);
	}else{
		var retObj = {};
			retObj.settings = settings;
			retObj.eventName = 'onDisplayWidget';
			sendQuickViewEvent(retObj);
	} 


		
		
	 checkAddToBasketButton();

	 checkSelectedIdentifiers(); //to be able to set the default value of variations we need to populate the object before data binding 
	 loadAds();


	 var compoObj = {
			  types: [settings.strGoogleAutocompleteTypes], //(regions)
			  componentRestrictions: {country:getCountryCode}
			  
			}
			
		//if(settings.restrictGoogleComponentToLocal!=='true')
		//{
		//	compoObj = {
		//	  types: ['geocode']
		//	}
		//}
			

	  		
	  sisAutocomplete = new google.maps.places.Autocomplete(
		/** @type {!HTMLInputElement} */(
		document.getElementById('uiLocationInp')),compoObj
		);
	
	  	// When the user selects an address from the dropdown, populate the address
	  	// fields in the form.
			 sisAutocomplete.addListener('place_changed', stockInStore.getLocationFromInput);
			 
			 if ('ontouchend' in document.documentElement) {
				setTimeout(function() {
					if(document.getElementsByClassName('pac-container').length > 0 ){
						var container = document.getElementsByClassName('pac-container')[0];
						container.addEventListener('touchend', function(e) {
							e.stopImmediatePropagation();
						});
					}
				}, 2000);
					
			  }

			 sisAutocomplete.setFields(["geometry","types", "formatted_address", "address_components"]);

			 var countryinfo = (typeof(stockInStore.countryDetails)!='undefined' && stockInStore.countryDetails!=='')?stockInStore.countryDetails:'AU|Australia';
				
			 var countryGeometryLocalStorage = localStorage.getItem('SISCountryGeometry');

			 if(countryGeometryLocalStorage!==null){
				 
				//sisAutocomplete.setBounds(JSON.parse(countryGeometryLocalStorage).bounds)

			 }else{
				getGeolocation(countryinfo.split("|")[1],'country:' + (countryinfo.split("|")[0]),function(geodata)
				{
					localStorage.setItem('SISCountryGeometry', JSON.stringify(geodata[0].geometry));
					if(geodata!==null){
						if(geodata.length>0){
							sisAutocomplete.setBounds(geodata[0].geometry.bounds)
						}
					}	

					
				})

			 }



			 validatePostSearch();
	};
	
	/**
	 * Destroy the current initialization.
	 * @public //TO BE IMPLEMENTED
	 */
	stockInStore.destroy = function() {
		// If plugin isn't already initialized, stop
		if ( !settings ) return;
		// Remove init class for conditional CSS
		//document.documentElement.classList.remove( settings.initClass );

		// Reset variables
		settings = null;
	};

	
	return stockInStore;
});

/*
	This  function needs to exist globally
 */
function gm_authFailure() {
	stockInStoreGlobal.sendErrorLog_new("stockinstore-core.js","Google Api Key " ,"There is an issue with the Google API Key ",function(){});
	if(document.getElementById('uiLocationInp')!==null){
		document.getElementById('uiLocationInp').value='';
	}
	stockInStoreGlobal.setCookie('_SISLOCATIONADDRESS', "" , 8760, '/');						
	stockInStoreGlobal.setCookie('_SISADDRESSCOMPONENTS', "", 8760, '/');
	stockInStore.ErrorLoadingMapAPI  = true;

};