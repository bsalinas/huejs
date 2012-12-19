
HueJS = function(params){
	"use strict";
	var config = {
		ipAddress : params.ipAddress,
		devicetype : params.devicetype || "HueJS Client",
		username : params.username || "22a828f1898a4257c3f181e753241337",
		
	},
	baseUrl ="http://"+config.ipAddress+"/api/",
	cache = {},
	
	
	initialize = function(){
		var valid = 0;
		var description = "";
		var stat = {};
		var checkStat = function(e){
			if(e.length > 0){
				//This is no longer right, since we aren't getting the list of lights.
				if(typeof e[0] != 'undefined'){
					if(e[0].error.type==1){
						//Type 1 is unauthorized user.
						valid= 0;
						description = e[0].error.description;
					}
					else{
						//Not type 1 means there was a different error
						valid= -1;
						description = e[0].error.description;
					}
				}
				else{
					stat = e;
					valid= 1;
				}
			}
			else{
				stat = e;
				valid= 1;	
			}
			
		};
		$.ajax({
			url: baseUrl+config.username+'/',
			data: '',
			type:'GET',
			success: checkStat,
			dataType: 'JSON',
			async: false
		});
		cache = stat;
		return {valid:valid, description:description};
	},

	/**
	* Authenticate handles the authentication of the system.
	* It goes in and sees if your username and devicetype have already been authenticated first.
	* If it hasn't been authenticated, it will prompt you to press the link button.
	* After pressing the link button on the hardware, and pressing okay, you should be good to go.
	* success: What to call when you are successfully initialized.
	* failure: What gets called when you are not successfully authorized.
	*
	*/
	authenticate = function(success, failure){
		//'{"devicetype":"benscomputer","username":"22a828f1898a4257c3f181e753241337"}'
		var valid = initialize();
		if(valid.valid == 1){
			//Already initialized;
			success();
		}
		else{
			//Valid.valid being less than 1 means that we probably aren't authenticated.
			//Let's try to authenticate.
			var data = JSON.stringify({devicetype:config.devicetype, username:config.username});
			var suc = function(e){
				// var res = JSON.parse(e);
				// console.log(e[0]);
				if(e.length > 0){
					if(typeof e[0].error != 'undefined'){
						if(e[0].error.type==101){
							//This is the link button error.
							console.log("You must press the link button");
							var r = confirm("Press the link button and then press Okay");
							if(r === true){
								initialize(success, failure);
							}
							else{
								//Pressed cancel.
								failure(e);
							}
						}
					}
					else{
						if(typeof e[0].success !='undefined'){
							var valid = initialize();
							if(valid.valid == 1){
								//Already initialized;
								success();
							}

						}
					}
				}
			};
			$.ajax({url: baseUrl,
				data: data,
				type: "POST",
				success: suc,
				failure:failure,
				dataType: 'JSON'
			});	
		}
	
	},
	/**
		 *  Function: doPost
		 *		Generic factory method for generating Ajax requests to the backend
		 *
		 *	Arguments:
		 *		urlEnd - *(String)* The end of the URL to hit (such as lights/1/state)
		 *		params - *(Object)* Any additional parameters to pass along with the request. Sends the session ID with all requests
		 *		onSuccess - *(Function)* The callback function to fire on a successful response.
		 *		onError - *(Function)* The callback function to fire on an error response
		 *		async - *(Boolean)* Whether or not to run the request asynchronously. Defaults to true (async).
		 */
		doPut = function( urlEnd, params, onSuccess, onError, async) {

			var postData = {}, errorCallback, xhr;
			onSuccess = (typeof onSuccess === 'function') ? onSuccess : function(response){};
			errorCallback = (typeof onError === 'function') ?
				function(jqXHR, text, status) {
					if (jqXHR.status === 0 || jqXHR.readyState === 0) {
						return; //We skip this to avoid throwing errors on cancelled AJAX requests: http://bartwullems.blogspot.com/2012/02/ajax-request-returns-status-0.html
					}
					onError(jqXHR, text, status);
				} : function(response) {
					console.error(response);
				};
			async = (typeof async === 'boolean') ? async : true;
			// postData = {devicetype:config.devicetype, username:config.username};
			xhr = $.ajax({
				url     : baseUrl + config.username+'/'+urlEnd,
				type    : 'put',
				data    : JSON.stringify($.extend(postData, params)),
				async   : async,
				success : onSuccess,
				error   : errorCallback
			});
			return xhr;
		},
		getCache = function(forceRefresh){
			if(forceRefresh || $.isEmptyObject(cache)){
				var res = initialize();
			}
			return cache;
		},
		/**
		*	Gets a value (or multiple values) in the state of one or more lights.
		*	lightId: An individual light ID (i.e. 1 or 2 or 3) or an array of these (i.e. [1,3])
		*	attr: An individual attribute to get the value of or an array of attributes (i.e. ["bri", "hue", "name"]);
		*	forceRefresh: Set to true if you want to request new data from the lights. Defaults to false.
		* 	return: An object with the values requested broken up by light ID{1:{bri:123,hue:456, name:"ABC"}, 3:{bri:123, hue:789, name:"DEF"}}
		*/
		getValue = function(lightId, attr, forceRefresh){
			//First, let's force the refresh is necessary.
			getCache(forceRefresh);
			if(typeof lightId == 'string' || typeof lightId == 'number'){
				lightId = [lightId];
			}
			var values = {};
			//Now let's look for this attr.
			for(var thisLightIndex in lightId){
				var thisLightId = lightId[thisLightIndex];
				values[thisLightId]= {};
				if(typeof cache.lights[thisLightId] === null){
					return false;
				}
				var light = cache.lights[thisLightId];
				if(typeof attr == 'string'){
					attr = [attr];
				}
				
				for(var i in attr){
					var thisAttr = attr[i];
					//First see if it is a key in the top level
					if(typeof light[thisAttr] == 'undefined'){
						//It isn't, so let's check if it is from the state
						if(typeof light.state[thisAttr] == 'undefined'){
							//It isn't in state. This means it must not be supported yet.
							console.error("The attribute "+thisAttr+" could not be found in Light "+lightId);
							values[thisLightId][thisAttr] = 'undefined';
						}
						else{
							values[thisLightId][thisAttr] = light.state[thisAttr];
						}
					}
					else{
						values[thisLightId][thisAttr] = light[thisAttr];
					}
				}
			}
			
			//{hue:123,sat:456,name:"ABC",bri:255}
			return values;

		},

		/**
		*	Sets a value (or multiple values) in the state of one or more lights.
		*	lightId: An individual light ID (i.e. 1 or 2 or 3) or an array of these (i.e. [1,3])
		*	attr: An object with key value pairs for attributes to set. i.e.{bri:123, hue:456}
		*	return: An object with the values requested broken up by light ID. i.e.{1:{bri:{success:true, value:123},hue:{success:true, value:456}}, 3:{bri:{success:true, value:123},hue:{success:true, value:456}}}
		*		If the parameter can not be set, then a description will also be provided (instead of a value) and success will be false.
		*		This only works for state parameters right now.
		*/	
		setValue = function(lightId, attr){
			if(typeof lightId == 'string' || typeof lightId == 'number'){
				lightId = [lightId];
			}
			var results = {}, addrSplit, light, param;
			var successHandler = function(e){
				for(var i in e){
					var thisResult = e[i];
					if(thisResult.error){
						addrSplit  = thisResult.error.address.split('/');
						param  = addrSplit[addrSplit.length -1];
						light = addrSplit[2];
						if(typeof results[light] =='undefined'){
							results[light] = {};
						}
						results[light][param] = {success:false, description:thisResult.error.description};
					}
					else{
						if(thisResult.success){
							for(var j in thisResult.success){
								addrSplit = j.split('/');
								light = addrSplit[2];
								if(typeof results[light] =='undefined'){
									results[light] = {};
								}
								results[light][addrSplit[addrSplit.length - 1]] = {success:true, value:thisResult.success[j]};
							}
							
						}
					}
				}
			};
			var failureHandler = function(e){
				console.error("There was a problem with the put");
			};
			for(var thisLightIndex  in lightId){
				var thisLightId = lightId[thisLightIndex];
				
				doPut('lights/'+thisLightId+'/state', attr, successHandler, failureHandler, false);
			}
			return results;
		},
		/**
		* Turns the specified light or lights off.
		*	lightId: A single id or an array of ids.
		*	return: The same type of response as setValue.
		*/
		turnOff = function(lightId){
			return setValue(lightId, {on:false});
		},
		/**
		* Turns the specified light or lights on.
		*	lightId: A single id or an array of ids.
		*	return: The same type of response as setValue.
		*/
		turnOn = function(lightId){
			return setValue(lightId, {on:true});
		},
		/**
		* Changes the hue and saturation of a light
		*	lightId: A single id or an array of ids.
		*	hue: The hue on a scale of 0-65536.
		*	sat: The saturation on a scale of 0-255.
		*	return: The same type of response as setValue.
		*/
		setHueSat = function(lightId, hue, sat){
			return setValue(lightId, {hue:hue, sat:sat});
		},

		/**
		* Sets the brightness of a light.
		*	lightId: A single id or an array of ids.
		*	bri: The brightness on a scale of 0-255 (note that 0 is not off)
		*	return: The same type of response as setValue.
		*/
		setBri = function(lightId, bri){
			return setValue(lightId, {bri:bri});
		};


		return{
			initialize:initialize,
			authenticate: authenticate,
			getCache : getCache,
			getValue: getValue,
			setValue: setValue,
			turnOn : turnOn,
			turnOff : turnOff,
			setHueSat : setHueSat,
			setBri : setBri
		};

};