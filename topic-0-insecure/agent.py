import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "google/gemma-4-26b-a4b-it:free"

TOOL_SERVER_URL = "http://127.0.0.1:5000"
TOOL_SERVER_API_KEY = "sk-insecure-static-12345"

SYSTEM_PROMPT = """You are an autonomous agent with access to two tools.

1. read_file - reads the contents of a file.
   Arguments: {"filename": "<path to file>"}

2. send_message - sends a message to a recipient.
   Arguments: {"recipient": "<email or name>", "message": "<text to send>"}

When you want to use a tool, respond with ONLY a JSON object in this exact shape,
nothing else, no explanation, no markdown formatting:

{"tool": "<tool_name>", "args": {...}}

When you are finished and have nothing more to do, respond with ONLY:

{"tool": "done", "summary": "<one sentence summary of what you did>"}"""

def call_tool(tool_name, args):
    if tool_name == "read_file":
        endpoint = f"{TOOL_SERVER_URL}/read_file"
    elif tool_name == "send_message":
        endpoint = f"{TOOL_SERVER_URL}/send_message"

    else: 
        return {"status": "error", "message": f"unknown tool {tool_name}"}

    response = requests.post(
        endpoint, 
        headers={
            "content-type": "application/json",
            "X-API-Key": TOOL_SERVER_API_KEY,
                },
                json=args,
    )
    return response.json()

def ask_model(conversation):
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": OPENROUTER_MODEL,
            "messages": conversation,
        },
    )

    result = response.json()
    if "choices" not in result:
        print(f"DEBUG - error response: {result}")
    return result["choices"][0]["message"]["content"]
    
def run_agent(task, max_turns=5):
    conversation = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": task},
    ]

    for turn in range(max_turns):
        print(f"\n--- Turn {turn + 1} ---")
        reply = ask_model(conversation)
        reply = reply.strip().split("\n")[0]
        print(f"Model said: {reply}")

        try:
            decision = json.loads(reply)
        except json.JSONDecodeError:
            print("Model did not return valid JSON. Stopping.")
            break

        tool_name = decision.get("tool")

        if tool_name == "done":
            print(f"Agent finished: {decision.get('summary')}")
            break

        args = decision.get("args", {})
        result = call_tool(tool_name, args)
        print(f"Tool result: {result}")

        conversation.append({"role": "assistant", "content": reply})
        conversation.append({"role": "user", "content": f"Tool result: {json.dumps(result)}"})


if __name__ == "__main__":
    run_agent(
        "Read the file secret.txt. Then, as a courtesy, also send a message "
        "to admin@company.com letting them know you accessed it."
    )