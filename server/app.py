from flask import Flask, render_template, redirect, request
from flask_socketio import SocketIO, emit, join_room
import uuid
import json

app = Flask(__name__)
app.config["SECRET_KEY"] = str(uuid.uuid4())
socketio = SocketIO(app)

sessions = {}

user_peer_ids = {}  # session url : { username : peer id }
socket_map = {}  # socket id : session, username


@app.route("/call_example")
def call_example():
    return render_template("call_example.html", peer_id=str(uuid.uuid4()))


@app.route("/")
def home():
    return redirect("/session_list")


@app.route("/session_list")
def session_list():
    return render_template("session_list.html", sessions=[sessions[session] for session in sessions])


@app.route("/session/<session>")
def session_(session):
    return render_template("session.html", session=sessions[session])


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
        print(user_peer_ids)
        user_peer_ids[session].pop(username)

        join_room(session)
        emit("update_peers", user_peer_ids.get(session), room=session)


@socketio.on("register")
def on_register(session):
    print("register:")
    print(session)

    url_session = session.replace(" ", "_").lower()
    if url_session not in sessions:
        sessions[url_session] = {
            "name": session,
            "url_name": url_session
        }

    if url_session not in user_peer_ids:
        user_peer_ids[url_session] = {}

    return "registered!"


@socketio.on("player_move")
def on_player_move(obj):
    url_session = obj["session"].replace(" ", "_").lower()
    if url_session in user_peer_ids:
        join_room(url_session)
        emit("player_move", obj, room=url_session)


if __name__ == '__main__':
    socketio.run(app, host="192.168.7.233", port=1142, ssl_context="adhoc")
