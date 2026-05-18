import os
from openai import OpenAI

# Inisialisasi Client (Secara default akan mencari environment variable OPENAI_API_KEY)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

response = client.responses.create(
    model="gpt-5.4-mini", # atau model terbaru lainnya seperti gemini-3-flash-preview
    input="write a haiku about ai",
    store=True,
)

print(response.output_text)