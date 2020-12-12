from flask import Flask, render_template, redirect, request
from flask_socketio import SocketIO, emit
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

user_peer_ids = {}  # session url : { username : peer id }


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


@socketio.on("login", namespace="/client")
def login(obj):
    username = obj.get("username")
    peer_id = str(uuid.uuid4())
    user_peer_ids[username] = peer_id

    return json.dumps({
        "peer_id": peer_id
    })


@socketio.on("connect")
def on_connect():
    print("on connect!")
    return user_peer_ids


if __name__ == '__main__':
    socketio.run(app, host="192.168.7.233", port=1142, ssl_context="adhoc")
