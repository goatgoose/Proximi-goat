var socket;

var active_peer_ids = {}; // username : peer ids
var usernames = {}; // peer id : username

var my_username = undefined;
var my_peer = undefined;
var my_negotiation_value = Math.random();

var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

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
        console.log(peer_ids);
        console.log("active peers:");
        console.log(active_peer_ids);

        if (my_peer === undefined) {
            my_peer = new Peer(peer_ids[my_username]);

            my_peer.on("connection", function (conn) {
                conn.on("open", function () {
                    handleConn(peer_ids, conn);
                });
            });
            my_peer.on('call', function (call) {
                console.log("call received");
                getUserMedia({video: false, audio: true}, function (stream) {
                    call.answer(stream);
                    call.on('stream', function (remoteStream) {
                        addStream(remoteStream, usernames[call.peer]);
                    });
                }, function (err) {
                    console.log('Failed to get local stream: receive', err);
                });
            });
        }

        for (let username in peer_ids) {
            if (username === my_username) {
                continue;
            }

            let peer_id = peer_ids[username];
            if (username in active_peer_ids) {
                if (peer_ids[username] !== active_peer_ids[username]) {
                    console.log("update stream: ");
                    console.log(username);
                    removeStream(username);
                } else {
                    continue;
                }
            }

            active_peer_ids[username] = peer_id;
            usernames[peer_id] = username;

            let peer_conn = my_peer.connect(peer_id);
            peer_conn.on("open", function () {
                handleConn(peer_ids, peer_conn);
            });
        }

        var to_remove = [];
        for (let username in active_peer_ids) {
            if (!(username in peer_ids)) {
                to_remove.push(username);
            }
        }
        for (let username of to_remove) {
            console.log("remove stream:");
            console.log(username);
            removeStream(username);
        }
    });
});

function addStream(remoteStream, username) {
    var stream_div = $("<li></li>");
    stream_div.attr("id", "li_" + active_peer_ids[username]);
    stream_div.attr("class", "list-group-item");

    stream_div.append($("<strong class='text-gray-dark'>" + username + "</strong>"))
    stream_div.append($("<br>"));

    var stream_element = $("<audio>");
    stream_element.attr("id", "audio_" + active_peer_ids[username])
    stream_element.attr("autoplay", "autoplay");
    stream_element.attr("muted", "true");
    stream_element.attr("controls", "controls");
    stream_div.append(stream_element);

    $("#audio_clients").append(stream_div);

    var player = document.querySelector("#audio_" + active_peer_ids[username]);
    player.srcObject = remoteStream;
    player.play();
}

function removeStream(username) {
    console.log("peer id:");
    console.log(active_peer_ids[username]);

    $("#li_" + active_peer_ids[username]).remove();
    delete usernames[active_peer_ids[username]];
    delete active_peer_ids[username];
}

function callPeer(call_id, username) {
    getUserMedia({video: false, audio: true}, function (stream) {
        var call = my_peer.call(call_id, stream);
        call.on('stream', function (remoteStream) {
            addStream(remoteStream, username);
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
                callPeer(data["peer_id"], data["username"]);
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
