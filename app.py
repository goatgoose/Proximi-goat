from flask import Flask, render_template, redirect, request
from flask_socketio import SocketIO, emit, join_room
import uuid
import json

app = Flask(__name__)
app.config["SECRET_KEY"] = str(uuid.uuid4())
socketio = SocketIO(app)

temp_sessions = [
    {
        "name": "Test Session 1",
        "url_name": "test_session_1",
        "players": 12
    },
    {
        "name": "Test Session 2",
        "url_name": "test_session_2",
        "players": 17
    }
]

user_peer_ids = {
    "test_session_1": {}
}  # session url : { username : peer id }
socket_map = {}  # socket id : session, username


@app.route("/call_example")
def call_example():
    return render_template("call_example.html", peer_id=str(uuid.uuid4()))


@app.route("/")
def home():
    return redirect("/session_list")


@app.route("/session_list")
def session_list():
    return render_template("session_list.html", sessions=temp_sessions)


@app.route("/session/<session>")
def session_(session):
    return render_template("session.html", session=temp_sessions[0])


@socketio.on("login")
def login(obj):
    username = obj.get("username")
    session = obj.get("session")
    peer_id = str(uuid.uuid4())

    if session in user_peer_ids and username:
        print(f"login: {username}, {session}")
        user_peer_ids[session][username] = peer_id
        socket_map[request.values.get("t")] = (session, username)

        join_room(session)
        emit("update_peers", user_peer_ids.get(session), room=session)


@socketio.on("connect")
def on_connect():
    print("connect!")


@socketio.on("disconnect")
def on_disconnect():
    print("disconnect!")
    socket_id = request.values.get("t")
    if socket_id in socket_map:
        session, username = socket_map.pop(socket_id)
        user_peer_ids[session].pop(username)

        join_room(session)
        emit("update_peers", user_peer_ids.get(session), room=session)


if __name__ == '__main__':
    socketio.run(app, host="192.168.7.233", port=1142, ssl_context="adhoc")
