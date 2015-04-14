function my_init(roomName) {
	easyrtc.setRoomOccupantListener(roomListener);
	easyrtc.joinRoom(roomName);
	easyrtc.dontAddCloseButtons();
	easyrtc.easyApp("defaultApp", "self", ["caller1","caller1"],
		function (myId) {
			console.log("My easyrtcid is " + myId);
		}
	);
}

function roomListener(roomName, otherPeers) {
	var otherClientDiv = document.getElementById('otherClients');
	while (otherClientDiv.hasChildNodes()) {
		otherClientDiv.removeChild(otherClientDiv.lastChild);
	}
	for (var i in otherPeers) {
		var button = document.createElement('button');
		button.onclick = function (easyrtcid) {
			return function () {
				performCall(easyrtcid);
			}
		}(i);

		//instead using the above code, you can just use this
		//button.onclick = performCall(i);

		label = document.createTextNode(i);
		button.appendChild(label);
		otherClientDiv.appendChild(button);
	}
}

//function callEverybodyElse(roomName, otherPeople) {
//
//	easyrtc.setRoomOccupantListener(null); // so we're only called once.
//
//	var list = [];
//	var connectCount = 0;
//	for (var easyrtcid in otherPeople) {
//		list.push(easyrtcid);
//	}
//	//
//	// Connect in reverse order. Latter arriving people are more likely to have
//	// empty slots.
//	//
//	function establishConnection(position) {
//		function callSuccess() {
//			connectCount++;
//			if (connectCount < maxCALLERS && position > 0) {
//				establishConnection(position - 1);
//			}
//		}
//
//		function callFailure(errorCode, errorText) {
//			easyrtc.showError(errorCode, errorText);
//			if (connectCount < maxCALLERS && position > 0) {
//				establishConnection(position - 1);
//			}
//		}
//
//		easyrtc.call(list[position], callSuccess, callFailure);
//
//	}
//
//	if (list.length > 0) {
//		establishConnection(list.length - 1);
//	}
//}

function performCall(easyrtcid) {
	easyrtc.call(
		easyrtcid,
		function (easyrtcid) {
			console.log("completed call to " + easyrtcid);
		},
		function (errorMessage) {
			console.log("err:" + errorMessage);
		},
		function (accepted, bywho) {
			console.log((accepted ? "accepted" : "rejected") + " by " + bywho);
		}
	);
	easyrtc.getConnectionCount()
}