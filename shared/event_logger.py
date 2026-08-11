import json
import os
import time

EVENTS_PATH = os.path.join(
    os.path.dirname(__file__), "..", "dashboard", "data", "events.jsonl"
)


def log_event(run_id, stage, event_type, actor, data):
    os.makedirs(os.path.dirname(EVENTS_PATH), exist_ok=True)
    event = {
        "timestamp": time.time(),
        "run_id": run_id,
        "stage": stage,
        "type": event_type,
        "actor": actor,
        "data": data,
    }

    with open(EVENTS_PATH, "a") as f:
        f.write(json.dumps(event) + "\n")