var twStorageConsts = {
	fontAwesomeIcon: "<i class=\"fa fa-twitter\" style=\"color: #4099FF;\"></i>",
	iconColor: "#4099FF",
	}
var twStorageData = {
	whenLastRatelimitError: undefined,
	embedCache: [], maxEmbedCache: 25, flEmbedCacheInitialized: false,
	urlTwitterServer: undefined,
	twitterConfig: undefined,
	pathAppPrefs: "appPrefs.json"
	}


function twGetDefaultServer () { 
	var url = undefined;
	try {
		if (twStorageData.urlTwitterServer != undefined) {
			url = twStorageData.urlTwitterServer;
			}
		}
	catch (err) {
		}
	return (url);
	}
function twGetOauthParams (flRedirectIfParamsPresent) {
	var flTwitterParamsPresent = false;
	if (flRedirectIfParamsPresent == undefined) { //6/4/14 by DW
		flRedirectIfParamsPresent = true;
		}
	function getURLParameter (name) {
		return (decodeURI ((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]));
		}
	function getParam (paramname, objname) {
		var val = getURLParameter (paramname);
		if (val != "null") {
			localStorage [objname] = val;
			flTwitterParamsPresent = true;
			}
		}
	getParam ("oauth_token", "twOauthToken");
	getParam ("oauth_token_secret", "twOauthTokenSecret");
	getParam ("user_id", "twUserId");
	getParam ("screen_name", "twScreenName");
	
	//redirect if there are params on the url that invoked us -- 4/29/14 by DW
		if (flTwitterParamsPresent && flRedirectIfParamsPresent) {
			window.location.href = window.location.href.substr (0, window.location.href.search ("\\?"));
			return;
			}
	
	return (flTwitterParamsPresent); //6/4/14 by DW
	}
function twDisconnectFromTwitter () {
	localStorage.removeItem ("twOauthToken");
	localStorage.removeItem ("twOauthTokenSecret");
	localStorage.removeItem ("twScreenName");
	localStorage.removeItem ("twUserId");
	}
function twConnectToTwitter () {
	var urlServer = twGetDefaultServer ();
	function trimTrailing (s, ch) {
		while (s.charAt (s.length - 1) == ch) {
			s = s.substr (0, s.length - 1);
			}
		return (s);
		}
	var s = trimTrailing (window.location.href, "#");
	var urlRedirectTo = urlServer + "connect?redirect_url=" + encodeURIComponent (s);
	window.location.href = urlRedirectTo;
	}
function twIsTwitterConnected () {
	return (localStorage.twOauthToken != undefined);
	}
function twGetScreenName () {
	return (localStorage.twScreenName);
	}
function twCheckForRateLimitError (responseText) { //7/10/14 by DW
	var jstruct = JSON.parse (responseText);
	var twResponse = JSON.parse (jstruct.data);
	if (twResponse.errors != undefined) {
		if (twResponse.errors [0].code == 88) { //rate limit error -- raise the flag
			whenLastTwRatelimitError = new Date ();
			console.log ("twCheckForRateLimitError: rate-limit error");
			}
		}
	}
function twGetUserInfo (userScreenName, callback) { //6/21/14 by DW
	var urlServer = twGetDefaultServer ();
	function encode (s) {
		return (encodeURIComponent (s));
		}
	$.ajax({
		type: "GET",
		url: urlServer + "getuserinfo?oauth_token=" + encode (localStorage.twOauthToken) + "&oauth_token_secret=" + encode (localStorage.twOauthTokenSecret) + "&screen_name=" + encode (userScreenName),
		success: function (data) {
			callback (data);
			},
		error: function (status) { 
			console.log ("twGetUserInfo: error == " + JSON.stringify (status, undefined, 4));
			},
		dataType: "json"
		});
	}
function twBuildParamList (paramtable, flPrivate) { //8/10/14 by DW
	var s = "";
	if (flPrivate) {
		paramtable.flprivate = "true";
		}
	for (var x in paramtable) {
		if (s.length > 0) {
			s += "&";
			}
		s += x + "=" + encodeURIComponent (paramtable [x]);
		}
	return (s);
	}
function twGetUserScreenName (callback) {
	$.ajax ({
		type: "GET",
		url: twGetDefaultServer () + "getmyscreenname" + "?oauth_token=" + encodeURIComponent (localStorage.twOauthToken) + "&oauth_token_secret=" + encodeURIComponent (localStorage.twOauthTokenSecret),
		success: function (data) {
			console.log (JSON.stringify (data, undefined, 4));
			callback (data);
			},
		error: function (status) { 
			console.log ("twGetUserScreenName: error == " + JSON.stringify (status, undefined, 4));
			},
		dataType: "json"
		});
	}
function twGetMyTweets (userid, callback, idLastSeen) {
	var sinceParam = "", urlServer = twGetDefaultServer ();
	function encode (s) {
		return (encodeURIComponent (s));
		}
	if (idLastSeen != undefined) {
		sinceParam = "&since_id=" + idLastSeen;
		}
	$.ajax ({
		type: "GET",
		url: urlServer + "getmytweets" + "?oauth_token=" + encode (localStorage.twOauthToken) + "&oauth_token_secret=" + encode (localStorage.twOauthTokenSecret) + "&user_id=" + encode (userid) + sinceParam,
		success: function (data) {
			whenLastTwRatelimitError = undefined; //7/10/14 by DW
			callback (data);
			},
		error: function (status) { 
			console.log ("twGetMyTweets: error == " + JSON.stringify (status, undefined, 4));
			twCheckForRateLimitError (status.responseText); //7/10/14 by DW
			},
		dataType: "json"
		});
	}
function twGetUserTweets (userid, idLastSeen, callback, urlServer) { //6/21/14 by DW
	twGetMyTweets (userid, function (theTweets) {
		callback (theTweets);
		}, idLastSeen);
	}
function twGetEmbedCode (id, callback, maxwidth, hide_media, hide_thread, omit_script, align, related, lang) { //6/20/14 by DW
	var url, urlServer = twGetDefaultServer ();
	url = urlServer + "getembedcode?id=" + encodeURIComponent (id);
	
	function addParam (val, name) {
		if (val != undefined) {
			url += "&" + name + "=" + encodeURIComponent (val);
			}
		}
	addParam (maxwidth, "maxwidth");
	addParam (hide_media, "hide_media");
	addParam (hide_thread, "hide_thread");
	addParam (omit_script, "omit_script");
	addParam (align, "align");
	addParam (related, "related");
	addParam (lang, "lang");
	
	$.ajax ({
		type: "GET",
		url: url,
		success: function (data) {
			callback (data);
			},
		error: function (status) { 
			console.log ("twGetEmbedCode: error == " + JSON.stringify (status, undefined, 4));
			callback (undefined); //9/3/14 by DW
			},
		dataType: "json"
		});
	}
function twGetTwitterReplies (userid, callback, idLastSeen) {
	var sinceParam = "", urlServer = twGetDefaultServer ();
	function encode (s) {
		return (encodeURIComponent (s));
		}
	if (idLastSeen != undefined) {
		sinceParam = "&since_id=" + idLastSeen;
		}
	$.ajax ({
		type: "GET",
		url: urlServer + "getmymentions?oauth_token=" + encode (localStorage.twOauthToken) + "&oauth_token_secret=" + encode (localStorage.twOauthTokenSecret) + "&user_id=" + encode (userid) + sinceParam,
		success: function (data) {
			callback (data);
			},
		error: function (status) { 
			console.log ("twGetTwitterReplies: error == " + JSON.stringify (status, undefined, 4));
			},
		dataType: "json"
		});
	}
function twTweet (status, inReplyToId, callback) {
	var urlServer = twGetDefaultServer ();
	function encode (s) {
		return (encodeURIComponent (s));
		}
	if (inReplyToId == undefined) {
		inReplyToId = 0;
		}
	
	var apiUrl = urlServer + "tweet?oauth_token=" + encode (localStorage.twOauthToken) + "&oauth_token_secret=" + encode (localStorage.twOauthTokenSecret) + "&status=" + encode (status) + "&in_reply_to_status_id=" + encode (inReplyToId);
	console.log ("twTweet: " + apiUrl);
	
	$.ajax ({
		type: "GET",
		url: apiUrl,
		success: function (data){
			console.log ("twTweet: twitter response == " + JSON.stringify (data, undefined, 4)); //9/3/14 by DW
			if (callback != undefined) { //6/5/14 by DW
				callback (data);
				}
			},
		error: function (status) { 
			var twitterResponse = JSON.parse (status.responseText);
			var innerResponse = JSON.parse (twitterResponse.data);
			console.log ("twTweet: error reported by twitter == " + jsonStringify (innerResponse.error));
			alertDialog ("Twitter reported an error: \"" + innerResponse.error + "\"");
			
			},
		dataType: "json"
		});
	}
function twGetUrlLength () { //8/8/14 by DW
	var twUrlLength = 23;
	if (twStorageData.twitterConfig != undefined) {
		twUrlLength = twStorageData.twitterConfig.short_url_length_https;
		}
	return (twUrlLength);
	}
function twToggleConnectCommand () { 
	if (twIsTwitterConnected ()) {
		confirmDialog ("Sign off Twitter?", function () {
			twDisconnectFromTwitter ();
			});
		}
	else {
		twConnectToTwitter ();
		}
	}
function twUpdateTwitterMenuItem (iditem) {
	document.getElementById (iditem).innerHTML = (twIsTwitterConnected ()) ? "Sign off Twitter..." : "Sign on Twitter...";
	}
function twUpdateTwitterUsername (iditem) {
	document.getElementById (iditem).innerHTML = (twIsTwitterConnected ()) ? localStorage.twScreenName : "Sign on here";
	}
function twWebIntent (id, twOp, paramName) {
	if (paramName == undefined) {
		paramName = "tweet_id";
		}
	if (id != undefined) {
		window.open ("https://twitter.com/intent/" + twOp + "?" + paramName + "=" + id, "_blank", "left=200,top=300,location=no,height=350,width=600,scrollbars=no,status=no");
		}
	}
function twGetFile (relpath, flIncludeBody, flPrivate, callback) { //8/10/14 by DW
	var paramtable = {
		oauth_token: localStorage.twOauthToken,
		oauth_token_secret: localStorage.twOauthTokenSecret,
		relpath: relpath
		}
	if (flIncludeBody) {
		paramtable.flIncludeBody = "true";
		}
	var url = twGetDefaultServer () + "getfile?" + twBuildParamList (paramtable, flPrivate);
	$.ajax ({
		type: "GET",
		url: url,
		success: function (data) {
			callback (undefined, data);
			},
		error: function (status, something, otherthing) { 
			console.log ("twGetFile: error == " + JSON.stringify (status, undefined, 4));
			console.log ("twGetFile: something == " + JSON.stringify (something, undefined, 4));
			console.log ("twGetFile: otherthing == " + JSON.stringify (otherthing, undefined, 4));
			callback (status, undefined);
			},
		dataType: "json"
		});
	}
function twUploadFile (relpath, filedata, type, flPrivate, callback) { //8/3/14 by DW
	var paramtable = {
		oauth_token: localStorage.twOauthToken,
		oauth_token_secret: localStorage.twOauthTokenSecret,
		relpath: relpath,
		type: type
		}
	var url = twGetDefaultServer () + "publishfile?" + twBuildParamList (paramtable, flPrivate);
	$.post (url, filedata, function (data, status) {
		if (status == "success") {
			callback (JSON.parse (data));
			}
		else {
			console.log ("twUploadFile: error == " + JSON.stringify (status, undefined, 4));
			}
		});
	}
function twTwitterDateToGMT (twitterDate) { //7/16/14 by DW
	return (new Date (twitterDate).toGMTString ());
	}
function twViewTweet (idTweet, idDiv, callback) { //7/18/14 by DW
	function prefsToStorage () {
		localStorage.twEmbedCache = JSON.stringify (twEmbedCache, undefined, 4);
		}
	function storageToPrefs () {
		if (localStorage.twEmbedCache != undefined) {
			twEmbedCache = JSON.parse (localStorage.twEmbedCache);
			}
		}
	var idViewer = "#" + idDiv, now = new Date ();
	
	if (!flEmbedCacheInitialized) {
		storageToPrefs ();
		flEmbedCacheInitialized = true;
		}
	
	if (idTweet == undefined) {
		$(idViewer).html ("");
		}
	else {
		var cacheElement, flFoundInCache = false;
		for (var i = 0; i < twEmbedCache.length; i++) {
			var c = twEmbedCache [i];
			if (c.id == idTweet) {
				cacheElement = c;
				flFoundInCache = true;
				}
			}
		if (flFoundInCache) {
			$(idViewer).html (cacheElement.html);
			cacheElement.ctAccesses++;
			cacheElement.whenLastAccess = now;
			if (callback != undefined) { //10/4/14 by DW
				callback (cacheElement);
				}
			prefsToStorage ();
			}
		else {
			twGetEmbedCode (idTweet, function (struct) {
				$(idViewer).css ("visibility", "hidden");
				$(idViewer).html (struct.html);
				
				var obj = {
					html: struct.html,
					id: idTweet,
					ctAccesses: 0,
					whenLastAccess: now
					};
				if (twEmbedCache.length < maxTwEmbedCache) {
					twEmbedCache [twEmbedCache.length] = obj;
					}
				else {
					var whenOldest = twEmbedCache [0].whenLastAccess, ixOldest = 0;
					for (var i = 1; i < twEmbedCache.length; i++) {
						if (twEmbedCache [i].whenLastAccess < whenOldest) {
							whenOldest = twEmbedCache [i].whenLastAccess;
							ixOldest = i;
							}
						}
					twEmbedCache [ixOldest] = obj;
					}
				
				if (callback != undefined) {
					callback (struct);
					}
				
				prefsToStorage ();
				});
			}
		}
	
	$(idViewer).on ("load", function () {
		$(idViewer).css ("visibility", "visible");
		});
	}
function twDerefUrl (shorturl, callback) { //7/31/14 by DW
	if (twIsTwitterConnected ()) {
		$.ajax ({
			type: "GET",
			url: twGetDefaultServer () + "derefurl?oauth_token=" + encodeURIComponent (localStorage.twOauthToken) + "&oauth_token_secret=" + encodeURIComponent (localStorage.twOauthTokenSecret) + "&url=" + encodeURIComponent (shorturl),
			success: function (data) {
				if (callback != undefined) {
					callback (data.longurl);
					}
				console.log ("twDerefUrl: data == " + jsonStringify (data));
				},
			error: function (status) { 
				console.log ("twDerefUrl: error status == " + jsonStringify (status));
				},
			dataType: "json"
			});
		}
	}
function twShortenUrl (longUrl, callback) { //8/25/14 by DW
	$.ajax ({
		type: "GET",
		url: twGetDefaultServer () + "shortenurl" + "?url=" + encodeURIComponent (longUrl),
		success: function (data) {
			if (callback != undefined) {
				callback (data.shortUrl);
				}
			},
		error: function (status) { 
			console.log ("twShortenUrl: error == " + JSON.stringify (status, undefined, 4));
			},
		dataType: "json"
		});
	}
function twUserWhitelisted (username, callback) {
	$.ajax ({
		type: "GET",
		url: twGetDefaultServer () + "iswhitelisted?screen_name=" + username,
		success: function (data) {
			callback (data);
			},
		error: function (status, something, otherthing) { 
			callback (false);
			},
		dataType: "json"
		});
	}
function twGetTwitterConfig (urlServer) {
	if (twIsTwitterConnected ()) {
		if (urlServer == undefined) {
			urlServer = twGetDefaultServer ();
			}
		$.ajax ({
			type: "GET",
			url: urlServer + "configuration?oauth_token=" + encodeURIComponent (localStorage.twOauthToken) + "&oauth_token_secret=" + encodeURIComponent (localStorage.twOauthTokenSecret),
			success: function (data) {
				twitterConfig = data;
				},
			error: function (status) { 
				console.log ("getTwitterConfig: error.");
				},
			dataType: "json"
			});
		}
	}

function twPrefsToStorage () {
	var jsontext = JSON.stringify (appPrefs), whenstart = new Date ();
	twUploadFile (twStorageStartup.pathAppPrefs, jsontext, "application/json", true, function (data) {
		console.log ("twPrefsToStorage: uploaded to server in " + secondsSince (whenstart) + " secs.");
		});
	}
function twStorageToPrefs (callback) {
	var whenstart = new Date ();
	twGetFile (twStorageStartup.pathAppPrefs, true, true, function (error, data) {
		if (data != undefined) {
			var storedPrefs = JSON.parse (data.filedata);
			for (var x in storedPrefs) {
				appPrefs [x] = storedPrefs [x];
				}
			console.log ("twStorageToPrefs: downloaded from server in " + secondsSince (whenstart) + " secs.");
			if (callback != undefined) { //8/16/14 by DW
				callback ();
				}
			}
		else { //call the callback even on an error
			if (callback != undefined) { 
				var errorInfo = {
					flFileNotFound: false
					};
				if (error.status == 500) {
					var s3response = JSON.parse (error.responseText);
					if (s3response.code == "NoSuchKey") {
						errorInfo.flFileNotFound = true;
						}
					}
				callback (errorInfo);
				}
			}
		});
	}
function twStorageStartup (callback) {
	twStorageToPrefs (function (errorInfo) {
		var flStartupFail = false;
		if (errorInfo != undefined) { 
			console.log ("twStorageStartup: errorInfo == " + jsonStringify (errorInfo));
			if (errorInfo.flFileNotFound != undefined) {
				if (!errorInfo.flFileNotFound) { //some error other than file-not-found (which is a benign error, first-time user
					if (callback != undefined) { //startup fail
						callback (false);
						flStartupFail = true;
						}
					}
				}
			}
		if (!flStartupFail) {
			if (callback != undefined) { //good start
				callback (true);
				}
			}
		});
	}
