import google.generativeai as genai

# Masukkan API Key Anda
genai.configure(api_key="AIzaSyDdcscyot7gJrBtXJlXY8hy6a_Q5z-ZgrE")

# Memilih model Gemini
model = genai.GenerativeModel('gemini-3-flash-preview')

# Mengirim perintah (prompt)
response = model.generate_content("Halo Gemini, jika kamu bisa membaca pesan ini, artinya API Key saya sudah aktif!")

# Menampilkan hasil
print(response.text)