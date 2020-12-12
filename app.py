from flask import Flask, render_template, redirect
import uuid

app = Flask(__name__)


@app.route("/call_example")
def call_example():
    return render_template("call_example.html", peer_id=str(uuid.uuid4()))


@app.route("/")
def home():
    return redirect("/session_view")


@app.route("/session_view")
def session_view():
    temp_sessions = [
        {
            "name": "Test Session 1",
            "players": 12
        },
        {
            "name": "Test Session 2",
            "players": 17
        }
    ]
    return render_template("session_view.html", sessions=temp_sessions)


if __name__ == '__main__':
    app.run(host="192.168.7.233", port=1142, ssl_context="adhoc")
