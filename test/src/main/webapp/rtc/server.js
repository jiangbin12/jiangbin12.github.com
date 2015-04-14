// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var io      = require("socket.io");         // web socket external module
var easyrtc = require("easyrtc");           // EasyRTC external module

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();
//httpApp.configure(function() {
//    httpApp.use(express.static(__dirname + "/static/"));
//});
httpApp.use(express.static(__dirname + "/static/"));

var fs = require('fs'); // bring in the file system api

var mustache = require('mustache'); // bring in mustache template engine

httpApp.get('/interviews/:slug', function(req, res){ // get the url and slug info
	var interviewId = req.query.i;
	var username = req.query.u;
	var time = req.query.t;

	var slug =[req.params.slug][0]; // grab the page slug
	var rData = {
		"interviewId": interviewId,
		"username" : username,
		"time" : time
	}; // wrap the data in a global object... (mustache starts from an object then parses)
	var page = fs.readFileSync('interviews/'+slug, "utf8"); // bring in the HTML file
	var html = mustache.to_html(page, rData); // replace all of the data
	res.send(html); // send to client
});

// Start Express http server on port 8080
var webServer = http.createServer(httpApp).listen(9090);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {"log level":1});

var iceServers = [
	{
		"url":"stun:stun.stunprotocol.org:3478"
	}
	//,{
	//	"url":"turn:[ADDRESS]:[PORT]",
	//	"username":"[USERNAME]",
	//	"credential":"[CREDENTIAL]"
	//}
	//,{
	//	"url":"turn:[ADDRESS]:[PORT][?transport=tcp]",
	//	"username":"[USERNAME]",
	//	"credential":"[CREDENTIAL]"
	//}
];

easyrtc.setOption("appIceServers", iceServers);

// Custom server behavior
easyrtc.events.on("roomJoin", function (connectionObj, roomName, roomParameter, callback) {
	var app = connectionObj.getApp();
	easyrtc.util.logInfo("Using App: "+app.getAppName());

	app.isRoom(roomName, function (error, isRoom) {
		if (!isRoom) {
			easyrtc.util.logInfo("There is no Room \""+roomName+"\" yet, create and join.");
			easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
		} else {
			app.room(roomName, function (error, room) {
				room.getConnectionObjects(function (error, connections) {
					var employerUserCount = 0;
					var candidateUserCount = 0;
					connections.forEach(function (conn) {
							if (conn.getUsername() == "candidate") {
								candidateUserCount ++;
							} else {
								employerUserCount ++;
							}
						}
					);
					easyrtc.util.logInfo("Other candidates: "+candidateUserCount);
					easyrtc.util.logInfo("Other employers: "+employerUserCount);
					easyrtc.util.logInfo("I am "+connectionObj.getUsername());
					if (connectionObj.getUsername() == 'candidate' && candidateUserCount == 0) {
						easyrtc.util.logInfo("There is no candidate yet, I can join!");
						easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
					} else if (connectionObj.getUsername() != 'candidate' && employerUserCount <= 2) {
						easyrtc.util.logInfo("There are less than 3 employers, I can join!");
						easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
					} else {
						easyrtc.util.logInfo("I cannot join!");
					}
				});
			});
			//app.getRoomOccupantCount(roomName, function (error, count) {
			//	if (count < 4) {
			//		easyrtc.util.logInfo("Room "+roomName+": There are "+count+" occupant(s) only, join it.");
			//		easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
			//	} else {
			//		easyrtc.util.logInfo("Room "+roomName+": There are "+count+" occupant(s) already, cannot join it.");
			//	}
			//});
		}
	});
});

// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, socketServer);