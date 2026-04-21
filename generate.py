from google import genai

client = genai.Client(api_key="AIzaSyDdcscyot7gJrBtXJlXY8hy6a_Q5z-ZgrE")
response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Explain teory quantum physic"
)
print(response.text)