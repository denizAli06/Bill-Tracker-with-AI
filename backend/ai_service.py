import httpx
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Free models to try in order (Verified available May 2026)
MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "minimax/minimax-m2.5:free",
    "qwen/qwen3-coder:free",
    "openai/gpt-oss-20b:free",
    "deepseek/deepseek-v4-flash:free"
]

async def get_ai_recommendation(utility_data: dict, household_info: dict):
    if not OPENROUTER_API_KEY:
        return "AI önerisi kullanılamıyor (API anahtarı eksik)."

    prompt = (
        f"Sen bir enerji tasarruf uzmanısın. "
        f"Aşağıdaki bilgilere dayanarak kullanıcıya kısa, etkili ve uygulanabilir Türkçe tasarruf tavsiyeleri ver.\n\n"
        f"Ev: {household_info['home_type']}, {household_info['household_size']} kişi\n"
        f"Dönem: {utility_data['month']}\n"
        f"Elektrik: {utility_data['electricity']} TL\n"
        f"Su: {utility_data['water']} TL\n"
        f"Doğalgaz: {utility_data['gas']} TL\n\n"
        f"3-5 madde halinde kısa öneriler ver."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ecotrack-ai.demo",
        "X-Title": "EcoTrack AI",
    }

    last_error = None
    async with httpx.AsyncClient(timeout=45.0) as client:
        for model in MODELS:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "Sen yardımcı bir enerji tasarruf asistanısın. Yanıtlarını Türkçe ver."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 512,
            }
            try:
                response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
                print(f"[AI] Model: {model} | Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[AI] Success with {model}")
                    return data["choices"][0]["message"]["content"]
                else:
                    error_detail = response.text[:500]
                    print(f"[AI] Model {model} failed with {response.status_code}: {error_detail}")
                    last_error = f"{response.status_code} ({model}): {error_detail}"
            except Exception as e:
                print(f"[AI] Exception with {model}: {str(e)}")
                last_error = f"Exception ({model}): {str(e)}"

    return f"AI önerisi şu an alınamıyor. Lütfen daha sonra tekrar deneyin. (Son hata: {last_error})"
