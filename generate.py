from google import genai

client = genai.Client(api_key="AIzaSyA_LohpNDAOUN2MuHzyuwAbWpn_T6meqDI")
response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Explain quantum computing"
)
print(response.text)