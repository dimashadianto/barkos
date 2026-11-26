def send(user_id, text):
    print(f"[MOCK PUSH/WA] ke user {user_id}: {text}")
    return {"delivered": True, "provider": "mock-fcm"}
