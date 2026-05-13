from google import genai

# Inisialisasi client (bukan configure)
client = genai.Client(api_key="AIzaSyCfOiWsr2AJ_UNEzID35VcQ7fhVeH8G3hA")

print("Listing models...")
try:
    for m in client.models.list():
        # Cek dengan cara berbeda untuk library baru
        if hasattr(m, 'supported_generation_methods') and 'generateContent' in m.supported_generation_methods:
            print(f"Name: {m.name}, Display Name: {m.display_name}")
except Exception as e:
    print(f"Error: {e}")
