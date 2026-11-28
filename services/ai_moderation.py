"""Layanan pihak ketiga #1 (MOCK): AI moderasi foto & deskripsi. Contoh pengganti: Google Vision / OpenAI Moderation."""
SUSPECT = ("transfer dulu", "dp dulu", "wa.me", "palsu", "judi", "rekber")
def check_listing(title, descr, photo):
    hit = [w for w in SUSPECT if w in f"{title} {descr}".lower()]
    if hit: return {"flag": True, "note": "Perlu dicek: kata mencurigakan (" + ", ".join(hit) + ")"}
    if not photo: return {"flag": True, "note": "Perlu dicek: belum ada foto barang"}
    return {"flag": False, "note": "Aman: foto dan deskripsi tampak wajar"}
