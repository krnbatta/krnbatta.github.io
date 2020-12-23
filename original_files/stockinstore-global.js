/*
 	Stock In Store  Global Script
	updates: 	02.08.2017 	-	SY Session expire after 30mins and recreate on user active 
				22.08.2017 	-	PH Addess crossOrigin=anonymous property to loaded JS to fix
							-	Issue with onerror reporting not sending the JS info like js file name	
							-	Also need to update the .htaccess with allow cross origin for *.js files
							- 	Fix cookie date expiration
				11.09.2018	-	PH Added code (Temp workaround/Fix ) to prevent duplication of log data
							-	by comparing local saved log string to current log string

*/


function SISBotDetector(args){var self=this;self.isBot=!1;self.tests={};var selectedTests=args.tests||[];if(selectedTests.length==0||selectedTests.indexOf(SISBotDetector.Tests.SCROLL)!=-1){self.tests[SISBotDetector.Tests.SCROLL]=function(){var e=function(){self.tests[SISBotDetector.Tests.SCROLL]=!0;self.update()
	self.unbindEvent(window,SISBotDetector.Tests.SCROLL,e)
	self.unbindEvent(document,SISBotDetector.Tests.SCROLL,e)};self.bindEvent(window,SISBotDetector.Tests.SCROLL,e);self.bindEvent(document,SISBotDetector.Tests.SCROLL,e)}}
	if(selectedTests.length==0||selectedTests.indexOf(SISBotDetector.Tests.MOUSE)!=-1){self.tests[SISBotDetector.Tests.MOUSE]=function(){var e=function(){self.tests[SISBotDetector.Tests.MOUSE]=!0;self.update();self.unbindEvent(window,SISBotDetector.Tests.MOUSE,e)}
	self.bindEvent(window,SISBotDetector.Tests.MOUSE,e)}}
	if(selectedTests.length==0||selectedTests.indexOf(SISBotDetector.Tests.KEYUP)!=-1){self.tests[SISBotDetector.Tests.KEYUP]=function(){var e=function(){self.tests[SISBotDetector.Tests.KEYUP]=!0;self.update();self.unbindEvent(window,SISBotDetector.Tests.KEYUP,e)}
	self.bindEvent(window,SISBotDetector.Tests.KEYUP,e)}}
	if(selectedTests.length==0||selectedTests.indexOf(SISBotDetector.Tests.SWIPE)!=-1){self.tests[SISBotDetector.Tests.SWIPE_TOUCHSTART]=function(){var e=function(){self.tests[SISBotDetector.Tests.SWIPE_TOUCHSTART]=!0;self.update();self.unbindEvent(document,SISBotDetector.Tests.SWIPE_TOUCHSTART)}
	self.bindEvent(document,SISBotDetector.Tests.SWIPE_TOUCHSTART)}}
	if(selectedTests.length==0||selectedTests.indexOf(SISBotDetector.Tests.DEVICE_MOTION)!=-1){self.tests[SISBotDetector.Tests.DEVICE_MOTION]=function(){var e=function(event){if(event.rotationRate.alpha||event.rotationRate.beta||event.rotationRate.gamma){var userAgent=navigator.userAgent.toLowerCase();var isAndroid=userAgent.indexOf('android')!=-1;var beta=isAndroid?event.rotationRate.beta:Math.round(event.rotationRate.beta/10)*10;var gamma=isAndroid?event.rotationRate.gamma:Math.round(event.rotationRate.gamma/10)*10;if(!self.lastRotationData){self.lastRotationData={beta:beta,gamma:gamma}}
	else{var movement=beta!=self.lastRotationData.beta||gamma!=self.lastRotationData.gamma;if(isAndroid){movement=movement&&(beta>0.2||gamma>0.2)}
	var args={beta:beta,gamma:gamma}
	self.tests[SISBotDetector.Tests.DEVICE_MOTION]=movement;self.update();if(movement){self.unbindEvent(window,SISBotDetector.Tests.DEVICE_MOTION,e)}}}
	else{self.tests[SISBotDetector.Tests.DEVICE_MOTION]=!1}}
	self.bindEvent(window,SISBotDetector.Tests.DEVICE_MOTION,e)}}
	if(selectedTests.length==0||selectedTests.indexOf(SISBotDetector.Tests.DEVICE_ORIENTATION)!=-1){self.tests[SISBotDetector.Tests.DEVICE_ORIENTATION]=function(){var e=function(){self.tests[SISBotDetector.Tests.DEVICE_ORIENTATION]=!0;self.update();self.unbindEvent(window,SISBotDetector.Tests.DEVICE_ORIENTATION,e)}
	self.bindEvent(window,SISBotDetector.Tests.DEVICE_ORIENTATION)}}
	if(selectedTests.length==0||selectedTests.indexOf(SISBotDetector.Tests.DEVICE_ORIENTATION_MOZ)!=-1){self.tests[SISBotDetector.Tests.DEVICE_ORIENTATION_MOZ]=function(){var e=function(){self.tests[SISBotDetector.Tests.DEVICE_ORIENTATION_MOZ]=!0;self.update();self.unbindEvent(window,SISBotDetector.Tests.DEVICE_ORIENTATION_MOZ)}
	self.bindEvent(window,SISBotDetector.Tests.DEVICE_ORIENTATION_MOZ)}}
	self.cases={};self.timeout=args.timeout||1000;self.callback=args.callback||null;self.detected=!1}
	SISBotDetector.Tests={KEYUP:'keyup',MOUSE:'mousemove',SWIPE:'swipe',SWIPE_TOUCHSTART:'touchstart',SWIPE_TOUCHMOVE:'touchmove',SWIPE_TOUCHEND:'touchend',SCROLL:'scroll',GESTURE:'gesture',GYROSCOPE:'gyroscope',DEVICE_MOTION:'devicemotion',DEVICE_ORIENTATION:'deviceorientation',DEVICE_ORIENTATION_MOZ:'MozOrientation'};SISBotDetector.prototype.update=function(notify){var self=this;var count=0;var tests=0;for(var i in self.tests){if(self.tests.hasOwnProperty(i)){self.cases[i]=self.tests[i]===!0;if(self.cases[i]===!0){count++}}
	tests++}
	self.isBot=count==0;self.allMatched=count==tests;if(notify!==!1){self.callback(self)}}
	SISBotDetector.prototype.bindEvent=function(e,type,handler){if(e.addEventListener){e.addEventListener(type,handler,!1)}
	else if(e.attachEvent){e.attachEvent("on"+type,handler)}};SISBotDetector.prototype.unbindEvent=function(e,type,handle){if(e.removeEventListener){e.removeEventListener(type,handle,!1)}
	else{var evtName="on"+type;if(e.detachEvent){if(typeof e[evtName]==='undefined'){e[type]=null}
	e.detachEvent(evtName)}}};SISBotDetector.prototype.monitor=function(){var self=this;for(var i in this.tests){if(this.tests.hasOwnProperty(i)){this.tests[i].call()}}
	this.update(!1);setTimeout(function(){self.update(!0)},self.timeout)}


var stockInStoreGlobal =
{
	isPreviewMode:false,
	savedLogString:"",
	VERSION:'1.0.0',
	isDebugMode:false,
	sisObjectsCache:null,
	sisSessionTagsInterval:null,
	//VARIABLES USED FOR USER IDEL COOKIE FUNCTION
	glbInterVal:null,
	idleTimeout:1800,          // MODIFIED CODE <SUNNY>
	idleSecondsCounter:0,      // MODIFIED CODE <SUNNY>
	sessionDelStatus:false,    // MODIFIED CODE <SUNNY>

	CONST_ARR_DAY_NAMES:
	 				[
						[ 'Sun', 'Sunday' ],
						[ 'Mon', 'Monday' ],
						[ 'Tue', 'Tuesday' ],
						[ 'Wed', 'Wednesday' ],
						[ 'Thu', 'Thursday' ],
						[ 'Fri', 'Friday' ],
						[ 'Sat', 'Saturday' ]
			  		],

	CONST_ARR_MONTH_NAME:
	 				[
						[ 'Jan', 'January'],
						[ 'Feb', 'February'],
						[ 'Mar', 'March'],
						[ 'Apr', 'April'],
						[ 'May', 'May'],
						[ 'Jun', 'June'],
						[ 'Jul', 'July'],
						[ 'Aug', 'August'],
						[ 'Sep', 'September'],
						[ 'Oct', 'October'],
						[ 'Nov', 'November'],
						[ 'Dec', 'December']
					],


	init:function()
	{

		// MODIFIED CODE <SUNNY>
		
        /*
			var sessionCreate = function(){
				stockInStoreGlobal.idleSecondsCounter = 0;
				if(stockInStoreGlobal.sessionDelStatus == true){
					var data = {sessionid : stockInStoreGlobal.sessionRecreate()};
					stockInStoreGlobal.createSession(data);
					stockInStoreGlobal.sessionDelStatus = false;
				}
			}
			
			stockInStoreGlobal.addEvent(document, "mousemove", sessionCreate);
			stockInStoreGlobal.addEvent(document, "keypress", sessionCreate);
			stockInStoreGlobal.addEvent(document, "click", sessionCreate);
			stockInStoreGlobal.addEvent(document, "touchstart", sessionCreate);
			stockInStoreGlobal.addEvent(document, "touchmove", sessionCreate);
			stockInStoreGlobal.addEvent(document, "touchend", sessionCreate);
			
	
			stockInStoreGlobal.glbInterVal = setInterval(function(){stockInStoreGlobal.CheckIdleTime('_SIS_SESSID')},1000);
		*/

		var scripts = document.getElementsByTagName("script");
		for (var i = 0; i < scripts.length; i++) {
			if (scripts[i].src){ 
				var strSrc = scripts[i].src;
				
				if(typeof(strSrc)!=="undefined" && strSrc!==null && strSrc!=="" &&  typeof(strSrc)!=="object"){
					if(strSrc.indexOf("stockinstore-global.js")!==-1){
						scripts[i].crossOrigin = "anonymous";					
					}
				}
			

			}
		}

		//initialise only if site has been defined
		if(_stockinstore)
		{
			if(_stockinstore[0].site)
			{


				if(this.getQueryString('sispreview')!='')
				{
					this.isPreviewMode = true;
					_stockinstore[0].isPreviewMode = true;
				}else
				{

					_stockinstore[0].isPreviewMode = false;
				}

				if(this.getQueryString('sisdebug')!='')
				{
					this.isDebugMode = true;
				}

				this.initWidgetSession(true,null);
			}
		}

		
	},
	
	/**
	 * Email Error Log information 
	 * @public 	
	 * @param {string} filename 
	 * @param {string} functioname
	 * @param {string} errormessage
	 */

	sendErrorLog_new:function(filename,functioname,errormessage,callback){

		var requestObj = stockInStoreGlobal.ajaxRequest()
		requestObj.open('POST',_stockinstore[0].applicationurl + '/widget/errorLog',true);
		requestObj.withCredentials = true;
		requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		requestObj.onreadystatechange = function ()
		{
			if (requestObj.readyState == 4 && requestObj.status == 200) {
				if(callback != null) return callback.call(this);
			}
		}

		requestObj.send(	'site=' + _stockinstore[0].site +
							'&filename=' + filename +
							'&functionName=' + functioname +
							'&errorMessage=' + errormessage +
							'&isajax=1&info=none');
		
	},
	
	sendErrorLog:function(filename,functioname,errormessage){

		/*var requestObj = stockInStoreGlobal.ajaxRequest()
		requestObj.open('POST',_stockinstore[0].applicationurl + '/widget/errorLog',true);
		requestObj.withCredentials = true;
		requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		requestObj.onreadystatechange = function ()
		{
			if (requestObj.readyState == 4 && requestObj.status == 200) {
				if(callback != null) return callback.call(this);
			}
		}

		requestObj.send(	'site=' + _stockinstore[0].site +
							'&filename=' + filename +
							'&functionName=' + functioname +
							'&errorMessage=' + errormessage +
							'&isajax=1&info=none');*/
		
	},
	
	/**
	 * Send stats information to SIS App (params same as GA analytics)
	 * @public 	//TO BE IMPLEMENTED
	 * @param {string} event type
 	 * @param {string} category event
	 * @param {string} action event
	 * @param {string} label event
	 */
	sendStats_old:function( eventtype, category, action, label,value,callback ) {


		var requestObj = stockInStoreGlobal.ajaxRequest()
		requestObj.open('POST',_stockinstore[0].applicationurl + '/widget/logUsage',true);
		requestObj.withCredentials = true;
		requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		requestObj.onreadystatechange = function ()
		{
			if (requestObj.readyState == 4){

				if(requestObj.status == 200) {
					if(callback != null) return callback.call(this);
				}else{
					stockInStoreGlobal.sendErrorLog("stockinstore-global.js","Function: sendStats " ,"Unable to send stats: " + JSON.stringify(requestObj));
				}
			}
		}

		if(typeof(value)=='undefined')
		{
			value = "";
		}

		var SISUID = stockInStoreGlobal.getCookie('_SIS_UID');
		var SISSESSID = stockInStoreGlobal.getCookie('_SIS_SESSID');
		requestObj.send(	'userId=' + SISUID +
							'&sessionId=' + SISSESSID +
							'&pageId=' + stockInStoreGlobal.hash(document.location.href) +
							'&site=' + _stockinstore[0].site +
							'&eventName=' + label +
							'&actionName=' + action +
							'&analyticsData=' + value +
							'&isajax=1&info=none');
	},
	sendStats:function( eventtype, category, action, label,value,tags,callback ) {

		var SISUID = stockInStoreGlobal.getCookie('_SIS_UID');
		var SISSESSID = stockInStoreGlobal.getCookie('_SIS_SESSID');
		
		
		if((typeof(SISUID)!=='undefined') && (typeof(SISSESSID)!=='undefined')){
			

			if(SISSESSID!==null && SISUID!==null && SISSESSID!=="" && SISUID!==""){

				var hasPageID = stockInStoreGlobal.hash(document.location.href)
				var concatLogString = SISUID + SISSESSID + hasPageID + _stockinstore[0].site + label + action;

				if(concatLogString!==stockInStoreGlobal.savedLogString){

					stockInStoreGlobal.savedLogString = concatLogString;	
					var requestObj = stockInStoreGlobal.ajaxRequest();
					
					//Sending logs to another server
					var appURLString = _stockinstore[0].applicationurl;
					var arrAppLogURLStr = appURLString.split("://"); 
					var newAppURLString = arrAppLogURLStr[0]+ '://logusage.' + arrAppLogURLStr[1];

					requestObj.open('POST',newAppURLString + '/widget/logUsage',true);
					requestObj.withCredentials = true;
					requestObj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

					requestObj.onreadystatechange = function ()
					{
						if (requestObj.readyState == 4){
							if(requestObj.status == 200) {
								if(callback != null) return callback.call(this);
							}else{
								stockInStoreGlobal.sendErrorLog("stockinstore-global.js","Function: sendStats " ,"Unable to send stats: " + JSON.stringify(requestObj));
							}
						}
					}

					if(typeof(value)=='undefined')
					{
						value = "";
					}

				

					requestObj.send(	'userId=' + SISUID +
										'&sessionId=' + SISSESSID +
										'&pageId=' + hasPageID +
										'&site=' + _stockinstore[0].site +
										'&eventName=' + label +
										'&actionName=' + action +
										'&analyticsData=' + value +
										(tags!==null?'&pageType=' + tags.sis_page + '&sisModule='  + tags.sis_module + '&sisSegment='+ tags.sis_segment+'&sisButton='+ tags.sis_button:'') + 
										'&isajax=1&info=none');

				}else{

					if(callback != null) return callback.call(this);	
				}					
			}else{

				if(callback != null) return callback.call(this);
			}
		}else{

			if(callback != null) return callback.call(this);
		}

	},
    
    /*SESSION RECREATE*/
    // MODIFIED CODE <SUNNY>
    sessionRecreate:function()
    {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) {
          dd = '0'+dd
        } 

        if(mm<10) {
          mm = '0'+mm
        } 

        today = yyyy+mm+dd
        var x = Math.floor(Math.random() * 100000000000000000).toString(16);
        var y = Math.floor(Math.random() * 100000000000).toString(16);
        var sessionID = today + x + y;
        
        return sessionID;
    },
    

	/**/
	initWidgetSession:function(loadassets,callback)
	{
		var _this = this;
		var SISUID = stockInStoreGlobal.getCookie('_SIS_UID');
		var SISSESSID = stockInStoreGlobal.getCookie('_SIS_SESSID');
		
		if( SISUID=="" || SISSESSID == ""){

			var req	=	new this.ajaxRequest();
			
			req.onreadystatechange=function(){
				

				if (req.readyState==4){
					if (req.status==200 ){

						var data = JSON.parse(req.responseText);
						stockInStoreGlobal.sessionid = data;

						//Get SISUID
						var SISUID = _this.getCookie('_SIS_UID');
						var SISSESSID = _this.getCookie('_SIS_SESSID');

						if(SISUID=="")
						{

							_this.setCookie('_SIS_UID', data.visitorid   , 525600, '/');	// expire after 1 year
						}

						
						_this.createSession(data);
						

						if(loadassets){
							_this.getWidgets();
						}

						if(callback != null) return callback.call(this,data);

					}else
					{
						stockInStoreGlobal.sendErrorLog("stockinstore-global.js","Function: initWidgetSession " ,"Unable to create session: " + JSON.stringify(req));
						throw('An error has occured making the request: ' + req.status);
					}
				}
			}

			req.open('POST', _stockinstore[0].applicationurl + '/widget/initWidgetSession', true);
			req.withCredentials = true;
			req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

			req.send('isajax=1');
		}else{
			if(loadassets){
				_this.getWidgets();
			}
			if(callback != null) return callback.call(this,null);

		}
	},
	/*Create Session function */
	createSession:function(data)
	{
		var SISSESSID = stockInStoreGlobal.getCookie('_SIS_SESSID');
		
		
		if(SISSESSID=="") //only when a new session is created we send the session info
		{

			this.setCookie('_SIS_SESSID', data.sessionid  , 30, '/'); //expire after 30 minutes

				/*stockInStoreGlobal.getLocationInfo(function(locationdata){*/
				/*Moving the location request on button clicked instead*/

					var pdata= {};
					var browserInfo = {};
						browserInfo.codename = navigator.appCodeName
						browserInfo.name = navigator.appName
						browserInfo.version= navigator.appVersion
						browserInfo.language = navigator.language
						browserInfo.platform = navigator.platform
						browserInfo.useragent = navigator.userAgent
						browserInfo.screenresolutionwidth = screen.width
						browserInfo.screenresolutionheight = screen.height
						pdata.browserInfo = browserInfo;
						/*var locationInfo = {}
						locationInfo= locationdata;
						pdata.locationInfo = locationInfo ;*/

						stockInStoreGlobal.sendStats('_trackEvent',
						'Stock In Store',
						'Load',
						'Session Created',
						JSON.stringify(pdata), null);


						/*var startTime = new Date().getTime();
						stockInStoreGlobal.sisSessionTagsInterval = setInterval(function(){
							if(new Date().getTime() - startTime > 60000){
								clearInterval(stockInStoreGlobal.sisSessionTagsInterval);
								return;
							}

							if(typeof(window.stockInStore) == "object"){
								stockInStoreGlobal.sendStats('_trackEvent',
								'Stock In Store',
								'Load',
								'Session Created',
								JSON.stringify(pdata), window.stockInStore.tags);
								clearInterval(stockInStoreGlobal.sisSessionTagsInterval);
	
							}

							
						}, 1000);*/    


						/*setTimeout(function(){
							if(typeof(window.stockInStore) == "object"){
								stockInStoreGlobal.sendStats('_trackEvent',
								'Stock In Store',
								'Load',
								'Session Created',
								JSON.stringify(pdata), window.stockInStore.tags);
	
							}
	
	
						},500)*/
						/*if(	locationdata=="") //default to AU
						{
							stockInStoreGlobal.setCookie('_SIS_CID', "" , 525600, '/');	// expire after 1 year
						}else
						{
							stockInStoreGlobal.setCookie('_SIS_CID', locationdata.country_code + "|" + locationdata.country_name   , 525600, '/');	// expire after 1 year
						}*/

				/*})*/
            
            
                // MODIFIED CODE <SY>
				//stockInStoreGlobal.glbInterVal = setInterval(function(){stockInStoreGlobal.CheckIdleTime('_SIS_SESSID')},1000);
				
				
				

		}

	},
	/*Scans page for all inserted widgets*/
	getWidgets:function()
	{

		var sisElementList = this.querySelect('[data-sis-widget-description]');
	
		var sisObjects = {};
			sisObjects.header={site:_stockinstore[0].site};
			sisObjects.widgetlists=[];
			
		if(sisElementList.length>0)
		{
			for(var i=0;i<sisElementList.length;i++)
			{
				var widgetLists={};
				widgetLists.description = sisElementList[i].getAttribute('data-sis-widget-description');
				widgetLists.id			= sisElementList[i].getAttribute('data-sis-widget-id');
				sisObjects.widgetlists.push(widgetLists);
			}

			this.sisObjectsCache = sisObjects;
			this.getWidgetsAssets(sisObjects);
		}else{

			if(typeof(_stockinstore.sis_widget_description)!=='undefined' &&  typeof(_stockinstore.sis_widget_id)!=='undefined'){


				var widgetLists={};
				widgetLists.description = _stockinstore.sis_widget_description;
				widgetLists.id			= _stockinstore.sis_widget_id;
				sisObjects.widgetlists.push(widgetLists);
				this.getWidgetsAssets(sisObjects);
			}

		}
	},
	getLocationInfo_deprecated:function(callback)
	{

		var req	=	new this.ajaxRequest();
		var _this = this;
		req.onreadystatechange=function(){
			if (req.readyState==4){
				if(req.status === 200){

					if(callback != null) return callback.call(this,JSON.parse(req.responseText));
				}else
				{
					if(callback != null) return callback.call(this,"");
				}
			}
		}

		req.open('GET', '//freegeoip.net/json/', true);
		req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		req.send(null);
	},


	/*
		Pass site and Widgets list to application
		in order to get all associated assets JS/CSS (core/init/other)
	*/
	getWidgetsAssets:function(obj)
	{

		var req	=	new this.ajaxRequest();
		var _this = this;
		req.onreadystatechange=function(){
			
			if (req.readyState==4){
				if (req.status==200){
					_this.loadWidgetTemplateEngine(JSON.parse(req.responseText));
							
					//_this.loadWidgetsAssetsOnPage(JSON.parse(req.responseText));
		  		}else
				{
					   throw('An error has occured making the request: ' + req.status);
					   stockInStoreGlobal.sendErrorLog("stockinstore-global.js","Function getWidgetsAssets " ,"Unable to get widget Assets: " + JSON.stringify(req));
					   
		  		}
		 	}
		}

		req.open('POST', _stockinstore[0].applicationurl + '/widget/getWidget', true);
		req.withCredentials = true;
		req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		var widgetsStringArray  = this.setArrayUnique(obj.widgetlists);
		var passArrayWidgets = [];
		for(var i=0;i<widgetsStringArray.length;i++)
		{
			passArrayWidgets.push(widgetsStringArray[i].id);
		}



		_stockinstore[0].widgets = passArrayWidgets.toString();
		req.send('site=' + obj.header.site + '&widget=' + passArrayWidgets.toString()+'&preview='+this.isPreviewMode + '&isajax=1');
	},

	/*Load template*/
	loadWidgetTemplateEngine:function(data)
	{

		var _this = this;

		//Should we load handlebars
		//Always the first index
		if(data.response[0].file!==""){
			this.async(data.response[0].file,function()
			{

				_this.loadWidgetsAssetsOnPage(data)
			})
		}else{
			_this.loadWidgetsAssetsOnPage(data)
		}

	},
	/*	Include all assets with Javascript css/js	*/
	loadWidgetsAssetsOnPage:function(data)
	{

		var objscripts = data.response
		var obl = objscripts.length
		for(var i=0;i<obl;i++)
			{
				if(objscripts[i].file!=="")
				{
					var ma,mas,loadversion,loadversionurl;
					loadversionurl = '?ver='
					loadversion = '';//loadversionurl + objscripts[i].version

					if(objscripts[i].type == 'CSS')
					{
						ma = document.createElement('link');
						ma.type = 'text/css';
						ma.rel='stylesheet';
						ma.href =  objscripts[i].file + loadversion;
						mas = document.getElementsByTagName('script')[1];
						mas.parentNode.insertBefore(ma, mas);

					}else if(objscripts[i].type == 'JS')
					{
						ma = document.createElement('script');
						ma.type = 'text/javascript';
						ma.async = true;
						ma.crossOrigin = "anonymous";
						ma.src =   objscripts[i].file + loadversion;
						mas = document.getElementsByTagName('script')[1];
						mas.parentNode.insertBefore(ma, mas);

					}else if(objscripts[i].type == 'JSTEMPLATE')
					{
						var loadTemplateEngine = false;

						//Should we load Handlebars
						if(objscripts[i].file!==""){

							if(window.Handlebars)
							{
								var hdlBarVersion = window.Handlebars.VERSION.split('.').join('')
								if(parseInt(hdlBarVersion)<parseInt(objscripts[i].version))
								{
									loadTemplateEngine = true
								}
							}else
							{
								loadTemplateEngine = true;
							}

							if(loadTemplateEngine)
							{

								ma = document.createElement('script');
								ma.type = 'text/javascript';
								ma.async = true;
								ma.src =   objscripts[i].file+loadversion;
								mas = document.getElementsByTagName('script')[1];
								mas.parentNode.insertBefore(ma, mas);
							}
						}


						//As ACTIVATEJS is last index
					}else if(objscripts[i].type == 'ACTIVATEJS')
					{
						var activationscriptfile = objscripts[i].file + loadversion

						//We user interval to make sure the core script is loaded (DOM OBJECT is created ) before loading the
						//activation script
						var winIntervalActivateSISScript = window.setInterval(function(){

							// && window.Handlebars
							if(window.stockInStore)
							{
								var ma = document.createElement('script');
								ma.type = 'text/javascript';
								ma.async = true;
								ma.crossOrigin = "anonymous";
								ma.src =  activationscriptfile;
								var mas = document.getElementsByTagName('script')[1];
								mas.parentNode.insertBefore(ma, mas);
								window.clearInterval(winIntervalActivateSISScript);
							}
						},1)

					}
				}
			}

	},

	/*Utility Function to parse XML string to XML Object*/
	
	parseXMLString:function(xmlstring)
	{
		
		if (window.DOMParser)
		{
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(xmlstring, "text/xml");
		}
		else // Internet Explorer
		{
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = false;
			xmlDoc.loadXML(xmlstring);
		}
		return xmlDoc;		
	},
	
	
	/*Utility Function for XBrowser Ajax Request*/
	ajaxRequest:function(){
		var ajaxRequest;
        try
        { // Opera 8.0+, Firefox, Safari
           ajaxRequest = new XMLHttpRequest();
        }
        catch (e)
        {// Internet Explorer Browsers
            try
            {
                ajaxRequest = new ActiveXObject('Msxml2.XMLHTTP');
            }
            catch (e)
            {
                try
                {
                    ajaxRequest = new ActiveXObject('Microsoft.XMLHTTP');
                }
                catch (e)
                {// unable to make ajax request
					throw('Please update your browser!');
					stockInStoreGlobal.sendErrorLog("stockinstore-global.js","Function ajaxRequest " ,"Browser does not support ajax");
                    return false;
                }
            }
        }

        return ajaxRequest;
	},


	/*Utility Function to remove clones from array*/
	setArrayUnique:function(a)
	{
	   var r = new Array();
	   o:for(var i = 0, n = a.length; i < n; i++)
	   {
		  for(var x = 0, y = r.length; x < y; x++)
		  {
			 if(r[x].id==a[i].id) continue o;
		  }
		  r[r.length] = a[i];
	   }
	   return r;
	},
	/*Utility to read any querystring from URL*/
	getQueryString:function(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	},
	getQueryStringFromString:function(name,sstring)
	{
		var href = sstring;
    	var reg = new RegExp( '[?&]' + name + '=([^&#]*)', 'i' );
	    var string = reg.exec(href);
	    return string ? string[1] : null;

	},
	hash:function(d) {
		var a=1,c=0,h,o;
		if(d){
		a=0;
			for(h=d["length"]-1;h>=0;h--){
				o=d.charCodeAt(h);
				a=(a<<6&268435455)+o+(o<<14);
				c=a&266338304;
				a=c!=0?a^c>>21:a
			}
		}
		return a
	},

	getCookie:function(w){
		cName = "";
		pCOOKIES = new Array();
		pCOOKIES = document.cookie.split('; ');
		for(bb = 0; bb < pCOOKIES.length; bb++){
			NmeVal  = new Array();
			NmeVal  = pCOOKIES[bb].split('=');
			if(NmeVal[0] == w){
				cName = unescape(NmeVal[1]);
			}
		}
		return cName;
	},

	printCookies:function(w){
		cStr = "";
		pCOOKIES = new Array();
		pCOOKIES = document.cookie.split('; ');
		for(bb = 0; bb < pCOOKIES.length; bb++){
			NmeVal  = new Array();
			NmeVal  = pCOOKIES[bb].split('=');
			if(NmeVal[0]){
				cStr += NmeVal[0] + '=' + unescape(NmeVal[1]) + '; ';
			}
		}
		return cStr;
	},

	setCookie:function(name, value, expires, path, domain, secure){
		cookieStr = name + "=" + escape(value) + "; ";

		if(expires){
			expires = this.setExpiration(expires);
			cookieStr += "expires=" + expires.toGMTString() + "; ";
		}
		if(path){
			cookieStr += "path=" + path + "; ";
		}
		if(domain){
			cookieStr += "domain=" + domain + "; ";
		}
		cookieStr += "SameSite=Strict; ";
		//if(secure){
			cookieStr += "Secure; ";
		//}

		
		

		document.cookie = cookieStr;
	},

	setExpiration:function(cookieLife){
		return new Date(new Date().getTime() + cookieLife * 60 * 1000);
	},
	querySelect:function( selector ) {
		var elmlist = 0;
		try
		{
			elmlist = document.querySelectorAll(selector);
			return elmlist;
		} catch(e) {
			elmlist = filterQuery(
			  document.querySelectorAll( selector.slice(0, e.position) ),
			  selector.slice(e.position)
			);
			return elmlist;
		}
	},



	/* FUNCTION FOR COOKIE
	 * - CHECKS USER IDEL TIME
	 * <SUNNY> */
	deleteCookie:function(w){
		 document.cookie = w + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
	},

	CheckIdleTime:function(w) {

		stockInStoreGlobal.idleSecondsCounter++;
		if (stockInStoreGlobal.idleSecondsCounter >= stockInStoreGlobal.idleTimeout) {
        	//AFTER TIME OUT DELETE COOKIE FUNCTION WILL BE HERE
        	this.deleteCookie(w);
					this.deleteCookie('_SIS_SESSID');
					clearInterval(stockInStoreGlobal.glbInterVal);
					stockInStoreGlobal.idleSecondsCounter = 0;
                    stockInStoreGlobal.sessionDelStatus = true;
        }
	},

	decodeHTML:function(html) {
		var txt = document.createElement("textarea");
		txt.innerHTML = html;
		return txt.value;
	},
  
	/**
	 * Sanitizing the innerhtml function
	 * On IPAD/IPHONE the innerhtml will return the
	 * phone string <a href=""></a>
	 * @private
	 * return {string}
	 */
	sanitizeInnerHTML:function(htmlstring)
	{

		htmlstring = htmlstring.split(" ").join("");
		var nstr = ""
		if(htmlstring.indexOf("<a")!==-1)
		{
			nstr =htmlstring.split(">")[1].split("<")[0]
		}else
		{
			nstr = htmlstring;
		}

		// Create a new div element
		var temporalDivElement = document.createElement("div");
		// Set the HTML content with the providen
		temporalDivElement.innerHTML = nstr;
		// Retrieve the text property of the element (cross-browser support)
		return temporalDivElement.textContent || temporalDivElement.innerText || nstr;

		//return nstr;

	},
	/**
	 * Format time
	 * @private
	 * @param {string} passed string
	 * @returns {string} time string
	 */
	formatTime:function( time ) {
	  // Check correct time format and split into components
	  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

	  if (time.length > 1) { // If time format correct
		time = time.slice (1);  // Remove full string match value
		time[5] = +time[0] < 12 ? 'am' : 'pm'; // Set AM/PM
		time[0] = +time[0] % 12 || 12; // Adjust hours
	  }
	  return time.join (''); // return adjusted time or original string
	},
	/**
	 * X-browser Add Event Listener
	 * @private
	 * @param {string} element
 	 * @param {string} event
	 * @param {Function} callback function
	 */
	addEvent:function( elem, event, fn ) {
		if (elem.addEventListener) {
			elem.addEventListener(event, fn, false);
		} else {
			elem.attachEvent('on' + event, function()
			{
				// set the this pointer same as addEventListener when fn is called
				return(fn.call(elem, window.event));
			});
		}
	},

	/**
	 * X-browser Triggers specific event on element
	 * @private
	 * @param {string} element
	 * @param {string} event
	 */
	triggerEvent:function( elem, event ) {
		if ('createEvent' in document)
		{
			var evt = document.createEvent('HTMLEvents');
			evt.initEvent(event, false, true);
			elem.dispatchEvent(evt);
		}else{
			elem.fireEvent('on' + event);
		}
	},

	/**
	 * Load external script on page
	 * @private
	 * @param {string} url path to js
	 * @param {Function} callback function
	 */
	getScript:function( url, callback ) {

	  var head = document.getElementsByTagName('head')[0], done = false;
	  var script = document.createElement('script');
	  script.src = url;

	  // Attach handlers for all browsers
	  script.onload = script.onreadystatechange = function(){
		  if ( !done && (!this.readyState ||
				  this.readyState == 'loaded' || this.readyState == 'complete') ) {
			  done = true;
			  callback();
		  }
	  };
	  head.appendChild(script);
	},

	/**
	 * Add class to elem
	 * @private
	 * @param {string} element
	 * @param {string} class name
	 */
	addClassName:function( elm, classname ) {
		var re = new RegExp(classname, 'g');
		if(elm!==null){
			var getCurrentClass = elm.className.replace(re,'')
			elm.className = getCurrentClass + ' '	 + classname;
		}
	},

	/**
	 * Checks if class exists
	 * @private
	 * @param {string} element
	 * @param {classname} class name
	 */
	checkClassName:function( elm, classname ) {
		if(elm!==null){
			return (' ' + elm.className + ' ').indexOf(' ' + classname + ' ') > -1;
		}
	},

	/**
	 * remove class name
	 * @private
	 * @param {string} element
	 * @param {string} class name
	 */
	removeClassName:function( elm, classname ) {
			var re = new RegExp(classname, 'g');
			if(elm!==null){
				var getCurrentClass = elm.className.replace(re,'')
				elm.className = getCurrentClass;
			}
	},


	/**
	 * Checks if elem is an ID or Class
	 * @private
	 * @param {string} element str name
	 * @returns {string} string type ID, CLASS, NONE
	 */
	getClassOrID:function( elmstr ) {
		if(elmstr.charAt(0) == '#')
		{
			return 'ID';
		}else if(elmstr.charAt(0) == '.')
		{
			return 'CLASS';
		}else
		{
			return 'NONE';
		}
	},


	/**
	 * Filter array with  distinct indices
	 * @private
	 * @param {array} pass array
	 * @returns {array} return filtered array
	 */
	setDistinctArray:function( arr ) {
		
		return arr.filter(function(item, pos){
			  return arr.indexOf(item)== pos; 
		});
		//return  arr.filter( stockInStoreGlobal.onlyUnique );
	},

	onlyUnique:function(value, index, self) { 
    	return self.indexOf(value) === index;
	},
	/**
	 * Date Conversion
	 * @private
	 * @param {date} raw date
 	 * @param {string} format
	 * @returns {string} date string
	 */
	toDateString:function( date, format ) {
		if (date == null) {
			date = new Date();
		}

		if (format == null || format == '') {
			format = 'dd/MM/yyyy hh:mm:ss';
		}

		var currentDay = date.getDay();
		var currentDate = date.getDate();
		var currentMonth = date.getMonth();
		var currentHour = date.getHours();
		var currentYear = date.getFullYear();
		//date
		if (this.contains(format, 'ddd')) {
			var ordinalDate = currentDate.toString();
			if (currentDate == 11 || currentDate == 12 || currentDate == 13) {
				ordinalDate = currentDate + 'th';
			}
			else if (this.endsWith(ordinalDate, '1')) {
				ordinalDate += 'st';
			}
			else if (this.endsWith(ordinalDate, '2')) {
				ordinalDate += 'nd';
			}
			else if (this.endsWith(ordinalDate, '3')) {
				ordinalDate += 'rd';
			}
			else {
				ordinalDate += 'th';
			}
			format = format.replace('ddd', ordinalDate);
		}
		else if (this.contains(format, 'dd')) {
			format = format.replace('dd', this.toTwoDigits(currentDate));
		}

		//day
		if (this.contains(format, 'DDDD')) {
			format = format.replace('DDDD', this.CONST_ARR_DAY_NAMES[currentDay][1]);
		}
		else if (this.contains(format, 'DDD')) {
			format = format.replace('DDD', this.CONST_ARR_DAY_NAMES[currentDay][0]);
		}

		//month
		if (this.contains(format, 'MMMM')) {
			format = format.replace('MMMM', this.CONST_ARR_MONTH_NAME[currentMonth][1]);
		}
		else if (this.contains(format, 'MMM')) {
			format = format.replace('MMM', this.CONST_ARR_MONTH_NAME[currentMonth][0]);
		}
		else if (this.contains(format, 'MM')) {
			format = format.replace('MM', this.toTwoDigits(currentMonth + 1));
		}

		//year
		if (this.contains(format, 'yyyy')) {
			format = format.replace('yyyy', currentYear);
		}
		else if (this.contains(format, 'yy')) {
			currentYear = currentYear.toString();
			format = format.replace('yy', currentYear.substring(currentYear.length - 2, currentYear.length));
		}

		//hour
		if (this.contains(format, 'hhh')) {
			format = format.replace('hhh', this.toTwoDigits(currentHour));
		}
		else if (this.contains(format, 'hh')) {
			currentHour = currentHour <= 12 ? currentHour : currentHour - 12;
			format = format.replace('hh', this.toTwoDigits(currentHour));
		}

		//minute
		if (this.contains(format, 'mm')) {
			format = format.replace('mm', this.toTwoDigits(date.getMinutes()));
		}

		//seconds
		if (this.contains(format, 'ss')) {
			format = format.replace('ss', this.toTwoDigits(date.getSeconds()));
		}
		return format;
	},
	/**
	 * 
	 */
	searchArray:function(searchvalue,searcharray){
		var foundValue = false;
		for(var i=0;i<searcharray.length;i++){
			if(searcharray[i].toLowerCase() == searchvalue.toLowerCase()){
				foundValue  = true;
				return foundValue;
			}
		}
		return foundValue;
	},
	/**
	 * Calculate distance from longitude and latitude
	 * @private
	 * @param {string} latitude
 	 * @param {string} longitude
	 * @param {string} latitude
	 * @param {string} longitude
	 * @returns {float} distance
	 */
	calculateGeoDistance:function( lat1, lon1, lat2, lon2 ) {

		var R = 6371; //km
		var dLat = (lat2-lat1)* Math.PI / 180;
		var dLon = (lon2-lon1)* Math.PI / 180;

		var lat1 = lat1* Math.PI / 180;
		var lat2 = lat2* Math.PI / 180;

		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
				Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c;
		return d;
	},

	/**
	 * Check if strings this.contains specific value
	 * @private
	 * @param {string} passed string
 	 * @param {string} search value
	 * @returns {boolean} true found
	 */
	contains:function( str, value ) {
		return str.indexOf(value) >= 0;
	},


	/**
	 * Check if strings ends with specific value
	 * @private
	 * @param {string} passed string
 	 * @param {string} search value
	 * @returns {boolean} true found
	 */
	endsWith:function( str, value ) {
		return str.indexOf(value, str.length - value.length) >= 0;
	},

	/**
	 * Converts single digit number to 2 digit number with 0 padding
	 * @private
	 * @param {string} value
	 * @returns {string} 2 digit number
	 */
	toTwoDigits:function( value ) {
		return value < 10 ? '0' + value : value;
	},


	/*Load Javascript Files with Callback
	 * @private
	 * @param u url
	 * @param c callback
	 * @returns callback
	 */

	async:function(url, callback) {
	  var script = document.createElement("script")
  	  script.type = "text/javascript";

		if (script.readyState){  //IE
			script.onreadystatechange = function(){
				if (script.readyState == "loaded" ||
						script.readyState == "complete"){
					script.onreadystatechange = null;
					callback();
				}
			};
		} else {  //Others
			script.onload = function(){
				callback();
			};
		}

		script.src = url;
		document.getElementsByTagName("head")[0].appendChild(script);
	},
	/**
	 * Title Case
	 */
	 
	titleCase:function(str) {
	  str = str.toLowerCase().split(' ');
	  for (var i = 0; i < str.length; i++) {
		str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
	  }
	  return str.join(' ');
	},
	
	/**
	 * Detect Browser and Version
	 */

	detectDevice:function()
	{
		var obj={}
			obj.browsername = '';
			obj.version = '';



		if(/Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor))
		{
				obj.browsername = 'chrome'
		}


		return obj
	}
}



//Trap JS Errors
//Commenting the onerror function to investigate where loop is coming from 
window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
	var pdata = {};
	var errorInfo = {};
		errorInfo.message = errorMsg;
		errorInfo.script = url;
		errorInfo.line = lineNumber;
		errorInfo.column = column;
		errorInfo.stacktrace  = errorObj;
		pdata.errorInfo = errorInfo;
		
		if(lineNumber!==0 && column!==0){
			//We limit error trapping only  within the SIS Scripts
			if(url!=="" && url.indexOf("stockinstore")!==-1){
				//stockInStoreGlobal.sendStats('_trackEvent',  'Stock In Store',  'Error', 'Front End Error', JSON.stringify(pdata))
				stockInStoreGlobal.sendErrorLog_new(url,"onerror " + "at line number: " + lineNumber + " column: " + column ,errorMsg,function(){})
			}

		}
		

}

stockInStoreGlobal.init();
