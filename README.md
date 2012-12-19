HueJS
=====

A Javascript library for controlling the Philips Hue light system.

This library is still in its infancy, but it is designed to let javascript control the Philips Hue WiFi Lights.

## Resources ##
The functionality in this library is largely based off the work of others. Both of the sites below also provide a good overview of the Hue system's API.
* http://www.issackelly.com/blog/2012/11/10/philips-hue-api-hacking/
* http://rsmck.co.uk/hue

## Usage ##
### Setup ###
Start out by creating a HueJS instance.
```
var hjs = HueJS({
  			ipAddress:"192.168.1.10",
				devicetype:"test2",
				username: "22a828f1898a4257c3f181e753241337"
			});
```
You need to pass in the ipAddress of your base station, a device type (which you get to pick) and a username. I'm not yet sure what the requirements of the username are, but the above links help to describe this process.

### Authentication ###
The first time you connect to the Hue with your computer, you will need to Authenticate. This should only need to happen once per login name (which you get to define, above).
After creating the HueJS, call `authenticate` to setup the connection.
```
hjs.authenticate( function(f){
  	alert("Successfully Authenticated");
  },
  function(f){
  	alert("Error connecting to Hue");
  	console.log(f);
});
```
For now, if this is the first time you are connecting to this particular hue using this particular username, you will get a popup that will tell you to press the link button. If you continue to get this popup after pressing the link button there is a problem that will need to be investigated.

If you have connected before, then you won't get any popup and the authentication process will be bypassed.

### Viewing the States ###
Now, if you use the `getCache` method, you will be able to view the raw data that comes back from the Hue system.
```
var cache = hjs.getCache();
//This data might be old, so let's refresh by passing true in.
var newCache = hjs.getCache(true);
```

### Getting Attributes ###
Let's say you just want a particular attribute from a particular light.  Use the `getValue` method.
```
//The first number is the light id
var res = hjs.getValue(1,['bri', 'alert','name']);
console.log(res);
//You can also get values for a set of lights.
res = hjs.getValue([2,3],['bri', 'alert','name', 'hue', 'sat']);
console.log(res);
//Or for a single value
res = hjs.getValue(1,'bri');
console.log(res);
//And you can force a refresh of the cache.
res = hjs.getValue(1,'bri', true);
console.log(res);
```
A complete list of these are available on the above linked sites. This is basically just searching through the cache so you don't have to.
The resulting object will look something like this:
```
{
1 ://The light ID
  {
    bri:123, //Each Attribute
    hue:456, 
    name:"ABC"
  }, 
3: //Another Light ID
  {
    bri:123, //Each Attribute
    hue:789,
    name:"DEF"
  }
}
```

### Setting Values ###
You can set values for the state (only... so not things like Name) using the `setValue` method.
```
//Set a set of values for a single light...
var res = hjs.setValue(1,{bri:123,on:true});
//Or a set of lights.
res = hjs.setValue([1,2],{bri:123,on:true});
```
The result for `setValue([1,3],{bri:123,hue:456})` will look like this:
```
{
	1:
	{
		bri:{success:true, value:123},
		hue:{success:true, value:456}
	}, 
	3:{
		bri:{success:true, value:123},
		hue:{success:true, value:456}
	}
}
```
If you also added in an invalid option, such as `name`, then:
```
{
	1:
	{
		bri:{success:true, value:123},
		hue:{success:true, value:456},
		name:{success:false, description:'A reason why it failed'}
	}, 
		
	3:{
		bri:{success:true, value:123},
		hue:{success:true, value:456},
		name:{success:false, description:'A reason why it failed'}
	}
}
```
### Some Other Methods ###
There are a few other methods to help in setting values. They should probably be refactored to be getters and setters to be more jquery like.

```
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
```
## Dependencies ##
* JQuery
