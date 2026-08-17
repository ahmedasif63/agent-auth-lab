import time
from flask import Flask, request, jsonify
import ssl
from spiffe import X509Source 
import tempfile
from spiffe import TrustDomain
from cryptography.hazmat.primitives import serialization
import os
import sys
import threading
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "shared"))
from event_logger import log_event

app = Flask(__name__)

svid_source = X509Source()
trust_domain = TrustDomain("agentauthlab.local")

def build_ssl_context():
    svid = svid_source.get_x509_context().default_svid
    bundle = svid_source.get_bundle_for_trust_domain(trust_domain)

    cert_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
    key_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
    ca_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")

    cert_file.write(svid.cert_chain[0].public_bytes(serialization.Encoding.PEM))
    key_file.write(svid.private_key.private_bytes(
        encoding = serialization.Encoding.PEM,
        format = serialization.PrivateFormat.PKCS8,
        encryption_algorithm = serialization.NoEncryption()
    ))

    for ca_cert in bundle.x509_authorities:
        ca_file.write(ca_cert.public_bytes(serialization.Encoding.PEM))

    cert_file.close()
    key_file.close()
    ca_file.close()

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=cert_file.name, keyfile = key_file.name)
    context.load_verify_locations(cafile=ca_file.name)
    context.verify_mode = ssl.CERT_REQUIRED

    return context

def refresh_loop(context, interval_seconds=60):
    print("[refresh] background refresh thread started", flush=True)
    while True:
        time.sleep(interval_seconds)
        try:
            svid = svid_source.get_x509_context().default_svid
            bundle = svid_source.get_bundle_for_trust_domain(trust_domain)

            cert_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
            key_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
            ca_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")

            cert_file.write(svid.cert_chain[0].public_bytes(serialization.Encoding.PEM))
            key_file.write(svid.private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))

            for ca_cert in bundle.x509_authorities:
                ca_file.write(ca_cert.public_bytes(serialization.Encoding.PEM))

            cert_file.close()
            key_file.close()
            ca_file.close()

            context.load_cert_chain(certfile=cert_file.name, keyfile=key_file.name)
            context.load_verify_locations(cafile=ca_file.name)

            print(f"[refresh] SSL context reloaded with fresh SVID at {time.time()}", flush=True)
        except Exception as e:
            print(f"[refresh] ERROR during refresh: {e}", flush=True)      

@app.route("/read_file", methods=["POST"])
def read_file():
    data = request.get_json()
    filename = data.get("filename", "")

    try:
        with open(filename, "r") as f:
            content = f.read()
            
            log_event("server-side", "stage-1", "server_read", "tool_server", {"filename": filename, "status": "ok"})

        return jsonify({"status": "ok", "content": content})
    except Exception as e:

        log_event("server-side", "stage-1", "server_read", "tool_server", {"filename": filename, "status": "error", "message": str(e)})

        return jsonify({"status": "error", "message": str(e)})


sent_messages = []

@app.route("/send_message", methods=["POST"])
def send_message():
    data = request.get_json()
    recipient = data.get("recipient", "")
    message = data.get("message", "")

    sent_messages.append({"recipient": recipient, "message": message})
    print(f"[SENT] To: {recipient} | Message: {message}")

    log_event("server-side", "stage-1", "server_send", "tool_server", {"recipient": recipient, "message": message})

    return jsonify({"status": "ok", "detail": f"Message sent to {recipient}"})





if __name__ == "__main__":
    context = build_ssl_context()

    refresh_thread = threading.Thread(target=refresh_loop, args=(context, 60), daemon=True)
    refresh_thread.start()
    app.run(host="0.0.0.0", port=5001, ssl_context=context, debug=True, use_reloader=False)