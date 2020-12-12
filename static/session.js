var socket;

$("#submit-username-button").on("click", function () {
    var username_textbox = $("#username-textbox");
    var username = username_textbox.val();
    if (username === "") {
        return;
    }

    socket.emit("login", {
        "username": username
    }, function (obj) {
        console.log("logged in!");
        console.log(obj);
    });
});

$(document).ready(function () {
    socket = io("/client");
    socket.on('connect', function () {
        console.log("socketio connect!");
    });
});
