from google import genai

# Masukkan API Key Anda
client = genai.Client(api_key="AIzaSyDn4xVTp7rGDYPeh-n6Dyhr2v0hCzGShVc")

# Mengirim perintah (prompt) - gunakan model yang valid
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Halo Gemini, jika kamu bisa membaca pesan ini, artinya API Key saya sudah aktif!"
)

print(response.text)