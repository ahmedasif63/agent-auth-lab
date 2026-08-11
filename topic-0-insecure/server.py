from flask import Flask, request, jsonify

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "shared"))
from event_logger import log_event

app = Flask(__name__)

HARDCODED_API_KEY = "sk-insecure-static-12345"


@app.route("/read_file", methods=["POST"])
def read_file():
    data = request.get_json()
    filename = data.get("filename", "")

    try:
        with open(filename, "r") as f:
            content = f.read()
            
            log_event("server-side", "stage-0", "server_read", "tool_server", {"filename": filename, "status": "ok"})

        return jsonify({"status": "ok", "content": content})
    except Exception as e:

        log_event("server-side", "stage-0", "server_read", "tool_server", {"filename": filename, "status": "error", "message": str(e)})

        return jsonify({"status": "error", "message": str(e)})


sent_messages = []

@app.route("/send_message", methods=["POST"])
def send_message():
    data = request.get_json()
    recipient = data.get("recipient", "")
    message = data.get("message", "")

    sent_messages.append({"recipient": recipient, "message": message})
    print(f"[SENT] To: {recipient} | Message: {message}")

    log_event("server-side", "stage-0", "server_send", "tool_server", {"recipient": recipient, "message": message})

    return jsonify({"status": "ok", "detail": f"Message sent to {recipient}"})


@app.before_request
def check_api_key():
    key = request.headers.get("X-API-Key")
    if key != HARDCODED_API_KEY:
        return jsonify({"status": "error", "message": "invalid API key"}), 401


if __name__ == "__main__":
    app.run(port=5000, debug=True)