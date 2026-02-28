from google import genai

client = genai.Client(api_key="AIzaSyDVsJGEA2LHhM3z9r3YLrTdfqf3BJUQaRU")
response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Explain quantum computing"
)
print(response.text)