import google.generativeai as genai

# Masukkan API Key Anda
genai.configure(api_key="AIzaSyB6K4RZkTEtajMU1J4tpqwqEyNl_BcWfb8")

# Memilih model Gemini
model = genai.GenerativeModel('gemini-1.5-flash')

# Mengirim perintah (prompt)
response = model.generate_content("Halo Gemini, jika kamu bisa membaca pesan ini, artinya API Key saya sudah aktif!")

# Menampilkan hasil
print(response.text)