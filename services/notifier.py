"""Layanan pihak ketiga #2 (MOCK): push notification / WhatsApp. Contoh pengganti: Firebase FCM / Fonnte / Twilio."""
def send(user_id, text):
    print(f"[MOCK PUSH/WA] ke user {user_id}: {text}")
    return {"delivered": True, "provider": "mock-fcm"}
