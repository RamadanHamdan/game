import google.generativeai as genai

genai.configure(api_key="AIzaSyA_LohpNDAOUN2MuHzyuwAbWpn_T6meqDI")

print("Listing models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Name: {m.name}, Display Name: {m.display_name}")
except Exception as e:
    print(f"Error: {e}")
