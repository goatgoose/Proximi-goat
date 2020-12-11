var peer;

function addStream(remoteStream) {
    var stream_element = $("<audio>");
    stream_element.attr("id", remoteStream.id);
    stream_element.attr("autoplay", "autoplay");
    stream_element.attr("muted", "true");
    stream_element.attr("controls", "controls");
    $("#calls").append(stream_element);
    console.log("appended");

    var player = document.querySelector("#" + remoteStream.id);
    player.srcObject = remoteStream;
    player.play();
}

$(document).ready(function () {
    peer = new Peer(peer_id);
    console.log(peer_id);

    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    peer.on('call', function (call) {
        console.log("call received");
        getUserMedia({video: false, audio: true}, function (stream) {
            call.answer(stream); // Answer the call with an A/V stream.
            call.on('stream', function (remoteStream) {
                addStream(remoteStream);
            });
        }, function (err) {
            console.log('Failed to get local stream: receive', err);
        });
    });
    peer.on("connection", function(conn) {
        conn.on("data", function(data) {
            console.log("data: " + data);
        });
        conn.on("open", function() {
            conn.send("hello!");
        });
    });

    $("#call-button").on("click", function () {
        var call_id = $("#peer-id-textbox").val();
        console.log("calling: " + call_id);

        var conn = peer.connect(call_id);
        conn.on("open", function() {
            conn.send("hi!");
        });

        callPeer(call_id);
    });
});

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
