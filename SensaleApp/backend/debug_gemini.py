import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {api_key[:10]}...")

if not api_key:
    print("ERROR: No API Key")
else:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Hello, are you there?")
        print("RESPONSE:", response.text)
    except Exception as e:
        print("GEMINI ERROR:", e)
