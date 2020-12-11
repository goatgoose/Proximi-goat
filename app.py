from flask import Flask, render_template
import uuid

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("home.html", peer_id=str(uuid.uuid4()))


if __name__ == '__main__':
    app.run(host="192.168.7.233", port=1142, ssl_context="adhoc")
