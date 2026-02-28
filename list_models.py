import google.generativeai as genai

genai.configure(api_key="AIzaSyDVsJGEA2LHhM3z9r3YLrTdfqf3BJUQaRU")

print("Listing models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Name: {m.name}, Display Name: {m.display_name}")
except Exception as e:
    print(f"Error: {e}")
