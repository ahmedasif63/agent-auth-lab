import os
import json
import requests
import time
from dotenv import load_dotenv
import sys
import ssl
from spiffe import X509Source, TrustDomain
import tempfile
from cryptography.hazmat.primitives import serialization

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "shared"))
from event_logger import log_event

svid_source = X509Source()
trust_domain = TrustDomain("agentauthlab.local")

def get_client_cert_paths():
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

    return cert_file.name, key_file.name, ca_file.name   

class SpiffeAdapter(requests.adapters.HTTPAdapter):
    def __init__(self, cert_path, key_path, ca_path, **kwargs):
        self.cert_path = cert_path
        self.key_path = key_path
        self.ca_path = ca_path
        super().__init__(**kwargs)

    def init_poolmanager(self, *args, **kwargs):
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.load_cert_chain(certfile=self.cert_path, keyfile=self.key_path)
        context.load_verify_locations(cafile=self.ca_path)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_REQUIRED
        kwargs['ssl_context'] = context
        kwargs['assert_hostname'] = False
        return super().init_poolmanager(*args, **kwargs)

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

TOOL_SERVER_URL = "https://stage1-server:5001"

SYSTEM_PROMPT = (
    "You are an autonomous agent. Use the available tools to complete the user's task. "
    "Once you have everything you need, respond normally in plain text summarizing what "
    "you did, without calling any more tools. Never call the same tool with the same "
    "arguments more than once, you already have that result."
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Reads the contents of a file and returns them.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Path to the file to read.",
                    }
                },
                "required": ["filename"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_message",
            "description": "Sends a message to a recipient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipient": {
                        "type": "string",
                        "description": "Who to send the message to.",
                    },
                    "message": {
                        "type": "string",
                        "description": "The text of the message to send.",
                    },
                },
                "required": ["recipient", "message"],
            },
        },
    },
]

def call_tool(tool_name, args):
    if tool_name == "read_file":
        endpoint = f"{TOOL_SERVER_URL}/read_file"
    elif tool_name == "send_message":
        endpoint = f"{TOOL_SERVER_URL}/send_message"

    else: 
        return {"status": "error", "message": f"unknown tool {tool_name}"}

    cert_path, key_path, ca_path = get_client_cert_paths()

    session = requests.Session()
    session.mount("https://",SpiffeAdapter(cert_path, key_path, ca_path))

    response = session.post(
        endpoint,
        headers={"Content-Type": "application/json"},
        json=args,
    )
    return response.json()

def ask_model(conversation, max_retries=3):
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(
                url="https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": conversation,
                    "tools": TOOLS,
                },
                timeout=30,
            )
            result = response.json()

            if "choices" in result:
                return result["choices"][0]["message"]


            print(f"DEBUG - error response (attempt {attempt}/{max_retries}): {result}")
            last_error = result

        except requests.exceptions.RequestException as e:
            print(f"DEBUG - network error (attempt {attempt}/{max_retries}): {e}")
            last_error = str(e)

        if attempt < max_retries:
            wait_seconds = 2 ** attempt
            print(f"Retrying in {wait_seconds}s...")
            time.sleep(wait_seconds)

    raise RuntimeError(f"ask_model failed after {max_retries} attempts. Last error: {last_error}")

    result = response.json()
    if "choices" not in result:
        print(f"DEBUG - error response: {result}")
    return result["choices"][0]["message"]["content"]

import uuid
    
def run_agent(task, max_turns=5, run_id=None):
    run_id = run_id or str(uuid.uuid4())
    log_event(run_id, "stage-1", "run_started", "agent", {"task": task})

    conversation = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": task},
    ]

    reached_conclusion = False
    last_call = None

    try:
        for turn in range(max_turns):
            print(f"\n--- Turn {turn + 1} ---")
            message = ask_model(conversation)
            tool_calls = message.get("tool_calls")

            if not tool_calls:
                summary = message.get("content", "").strip()
                print(f"Agent finished: {summary}")
                log_event(run_id, "stage-1", "run_finished", "agent", {"summary": summary})
                reached_conclusion = True
                break

            conversation.append(message)

            for call in tool_calls:
                tool_name = call["function"]["name"]
                try:
                    args = json.loads(call["function"]["arguments"])
                except json.JSONDecodeError:
                    args = {}

                print(f"Model called: {tool_name}({args})")

                current_call = (tool_name, json.dumps(args, sort_keys=True))
                if current_call == last_call:
                    print(f"Blocked: model tried to repeat the exact same call ({tool_name}). Stopping.")
                    log_event(run_id, "stage-1", "run_finished", "agent", {
                        "summary": f"Stopped automatically: the model tried to call '{tool_name}' again with identical arguments instead of concluding."
                    })
                    reached_conclusion = True
                    break
                last_call = current_call

                log_event(run_id, "stage-1", "agent_decision", "agent", {"tool": tool_name, "args": args})

                result = call_tool(tool_name, args)
                print(f"Tool result: {result}")

                log_event(run_id, "stage-1", "tool_call", "tool_server", {"tool": tool_name, "args": args, "result": result})

                conversation.append({
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": json.dumps(result),
                })

            if reached_conclusion:
                break

    finally:
        if not reached_conclusion:
            log_event(run_id, "stage-1", "run_finished", "agent", {
                "summary": "Run ended without the model concluding on its own (max turns reached or an unexpected error)."
            })



if __name__ == "__main__":
    default_task =(
        "Read the file secret.txt. Then, as a courtesy, also send a message "
        "to admin@company.com letting them know you accessed it."
    )
    task = sys.argv[1] if len(sys.argv) > 1 else default_task
    external_run_id = sys.argv[2] if len(sys.argv) > 2 else None
    run_agent(task, run_id=external_run_id)