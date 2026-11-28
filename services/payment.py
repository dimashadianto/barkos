"""Layanan pihak ketiga #3 (MOCK): payment gateway bank & e-wallet.
Contoh pengganti di dunia nyata: Midtrans / Xendit / DOKU. Di sini SEMUANYA PALSU: tidak ada uang atau bank sungguhan."""
import random, time
CHANNELS = {
    "bank": [{"code": "bca", "name": "BCA Virtual Account", "prefix": "39021"}, {"code": "bri", "name": "BRI Virtual Account", "prefix": "26215"},
             {"code": "mandiri", "name": "Mandiri Virtual Account", "prefix": "88608"}, {"code": "bni", "name": "BNI Virtual Account", "prefix": "98812"}],
    "ewallet": [{"code": "gopay", "name": "GoPay"}, {"code": "ovo", "name": "OVO"}, {"code": "dana", "name": "DANA"}, {"code": "shopeepay", "name": "ShopeePay"}]}
def find_channel(code):
    for kind, L in CHANNELS.items():
        for c in L:
            if c["code"] == code: return kind, c
    return None, None
def create_charge(order_id, amount, code):
    kind, ch = find_channel(code)
    if not ch: return None
    ref = f"MOCK-{order_id:05d}-{random.randint(1000, 9999)}"
    info = {"kind": kind, "channel": ch["name"], "amount": amount}
    if kind == "bank": info |= {"va": ch["prefix"] + f"{order_id:05d}" + f"{random.randint(0, 999999):06d}", "expires": int(time.time()) + 24 * 3600}
    else: info |= {"qr": ref, "deeplink": f"{code}://pay/{ref}", "expires": int(time.time()) + 15 * 60}
    print(f"[MOCK PAYMENT] buat tagihan {ref} via {ch['name']} Rp{amount}")
    return {"ref": ref, "channel": code, "info": info}
def confirm(ref):        # meniru webhook "pembayaran berhasil" dari gateway
    print(f"[MOCK PAYMENT] webhook: {ref} LUNAS"); return {"paid": True, "ref": ref}
def payout(order_id, amount):   # meniru pencairan dana ke penjual (escrow)
    print(f"[MOCK PAYMENT] cairkan Rp{amount} ke penjual order #{order_id}"); return {"ok": True}
def charge_fee(order_id, amount):   # biaya layanan untuk transaksi COD
    print(f"[MOCK PAYMENT] tagih biaya layanan order #{order_id}: Rp{amount}"); return {"paid": True, "ref": f"MOCK-FEE-{order_id:05d}"}
