import google.generativeai as genai

genai.configure(api_key="AIzaSyDdcscyot7gJrBtXJlXY8hy6a_Q5z-ZgrE")

print("Listing models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Name: {m.name}, Display Name: {m.display_name}")
except Exception as e:
    print(f"Error: {e}")
