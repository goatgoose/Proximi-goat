var socket;

var active_peer_ids = {}; // username : peer ids
var my_username = undefined;
var my_peer = undefined;
var my_negotiation_value = Math.random();

$("#submit-username-button").on("click", function () {
    var username_textbox = $("#username-textbox");
    var username = username_textbox.val();
    if (username === "") {
        return;
    }
    my_username = username;

    socket.emit("login", {
        "username": username,
        "session": session_url
    }, function (obj) {
        console.log("logged in!");
    });
});

$(document).ready(function () {
    socket = io();
    socket.on('connect', function () {
        console.log("socketio connect!");
    });
    socket.on("update_peers", function (peer_ids) {
        console.log("update peers");
        if (my_peer === undefined) {
            my_peer = new Peer(peer_ids[my_username]);

            my_peer.on("connection", function (conn) {
                conn.on("open", function() {
                    handleConn(peer_ids, conn);
                });
            });
        }

        for (let username in peer_ids) {
            if (username === my_username) {
                continue;
            }
            console.log(username);

            let peer_id = peer_ids[username]
            if (peer_id === active_peer_ids[username]) {
                continue;
            }
            active_peer_ids[username] = peer_id;

            let peer_conn = my_peer.connect(peer_id);
            peer_conn.on("error", function (error) {
                console.log("error");
                console.log(error);
            });
            peer_conn.on("open", function () {
                handleConn(peer_ids, peer_conn);
            });
        }

        for (let username in active_peer_ids) {
            if (!username in peer_ids) {
                active_peer_ids[username].disconnect();
                console.log("user disconnect: " + username);
                delete active_peer_ids[username];
            }
        }
    });
});

function addStream(remoteStream) {
    var stream_element = $("<audio>");
    stream_element.attr("id", remoteStream.id);
    stream_element.attr("autoplay", "autoplay");
    stream_element.attr("muted", "true");
    stream_element.attr("controls", "controls");
    $("#audio_clients").append(stream_element);

    var player = document.querySelector("#" + remoteStream.id);
    player.srcObject = remoteStream;
    player.play();
}

function callPeer(call_id) {
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    getUserMedia({video: false, audio: true}, function (stream) {
        var call = peer.call(call_id, stream);
        call.on('stream', function (remoteStream) {
            addStream(remoteStream);
        });
    }, function (err) {
        console.log('Failed to get local stream: send', err);
    });
}

function handleConn(peer_ids, conn) {
    conn.on("data", function (data) {
        console.log("data receive");
        console.log(data);
        if ("negotiation_value" in data) {
            console.log(my_negotiation_value);
            var peer_negotiation_value = data["negotiation_value"];
            if (my_negotiation_value > peer_negotiation_value) {
                console.log("I will call " + data["username"]);
            }
        }
    });

    let message = {
        "negotiation_value": my_negotiation_value,
        "username": my_username,
        "peer_id": peer_ids[my_username]
    }
    console.log("sending:");
    console.log(message);

    conn.send(message);
}
