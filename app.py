from flask import Flask, request, jsonify, render_template
import requests
import json
import os
import base64
import threading
import asyncio
import websockets

app = Flask(__name__)

API_KEY_gemini = os.environ.get("API_KEY_ge")
API_KEY_SST = os.environ.get("API_KEY_s")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key={API_KEY_gemini}"
SST_URL = f"https://speech.googleapis.com/v1/speech:recognize?key={API_KEY_SST}"  # Google Speech-to-Text



# ------------------------------
# Helper functions
# ------------------------------
def formatUserDataAsPrompt(userData):
    """Formats the user data into a prompt for AI analysis."""
    lines = [
        "تو یک دستیار تحلیلی هستی. در ادامه اطلاعات کاربر در دسته‌بندی‌های مختلف آمده است. بر اساس آن‌ها، تحلیل شخصیتی و رفتاری دقیقی ارائه کن، و نحوه ی تصمیم‌گیری آنرا شرح بده.\n"
    ]

    personal = userData.get("personal_information", {})
    lines.append("بخش اطلاعات شخصی:")
    lines.append(f"نام: {personal.get('name')}")
    lines.append(f"سن: {personal.get('age')}")
    lines.append(f"جنسیت: {personal.get('gender')}")
    lines.append(f"محل زندگی: {personal.get('residence')}\n")

    cognitive = userData.get("cognitive_style", {})
    lines.append("سبک تصمیم‌گیری:")
    lines.append(f"- تصمیم‌گیری احساسی یا منطقی: {cognitive.get('decision_Making_Logic')}")
    lines.append(f"- تحلیل یا شهود در تصمیم‌گیری: {cognitive.get('Decision_Making_Analysis')}")
    lines.append(f"- رویکرد نسبت به اشتباهات: {cognitive.get('locus_of_control')}")
    lines.append(f"- سطح ریسک‌پذیری: {cognitive.get('risk_tolerance')}\n")

    emotion = userData.get("emotion", {})
    lines.append("روابط اجتماعی و احساسی:")
    lines.append(f"- واکنش به مخالفت: {emotion.get('conflict_response')}")
    lines.append(f"- ایجاد اعتماد: {emotion.get('trust_building')}")
    lines.append(f"- ترجیح اجتماعی: {emotion.get('social_prefrence')}")
    lines.append(f"- مدیریت خشم: {emotion.get('anger_management')}\n")

    experience = userData.get("experience", {})
    lines.append("تجربیات گذشته:")
    lines.append(f"- برخورد با شکست: {experience.get('failure_handling')}")
    lines.append(f"- یادگیری از اشتباهات: {experience.get('learning_from_mistakes')}")
    lines.append(f"- تأثیر تجربیات منفی: {experience.get('past_impact')}")
    lines.append(f"- سازگاری با تغییر: {experience.get('adaptability')}\n")

    motivation = userData.get("motivations", {})
    lines.append("انگیزه‌ها و اهداف:")
    lines.append(f"- هدف زندگی: {motivation.get('life_goal')}")
    lines.append(f"- منبع انگیزه: {motivation.get('motivation_source')}")
    lines.append(f"- تعریف موفقیت: {motivation.get('success_definition')}")
    lines.append(f"- میزان فداکاری: {motivation.get('sacrifice_level')}\n")

    background = userData.get("background", {})
    lines.append("پس‌زمینه‌ی کاری و حرفه‌ای:")
    lines.append(f"-سطح تحصیلات: {background.get('education_level')}")
    lines.append(f"- عنوان شغلی: {background.get('profession_title')}")
    lines.append(f"- مجموعه‌ی مهارت‌ها: {background.get('skill_set')}\n")

    social_status = userData.get("social_status", {})
    lines.append("جایگاه اجتماعی:")
    lines.append(f"- درک جایگاه اجتماعی: {social_status.get('perceived_social_rank')}")
    lines.append(f"- اعتبار اجتماعی در جامعه: {social_status.get('community_recognition')}")
    lines.append(f"- هویت‌یابی فردی: {social_status.get('self_identification')}")
    lines.append(f"- تاثیرگذاری اجتماعی: {social_status.get('social_influence')}\n")

    return "\n".join(lines)

def generate_response(userData):
    """Sends a request to the Gemini API to analyze user data."""
    prompt = formatUserDataAsPrompt(userData)
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {"Content-Type": "application/json"}

    response = requests.post(GEMINI_URL, json=payload, headers=headers)
    try:
        result = response.json()
        if "candidates" in result:
            return result["candidates"][0]["content"]["parts"][0]["text"]
        return "No content in AI response."
    except Exception as e:
        return f"Error processing AI response: {str(e)}"

# ------------------------------
# Routes
# ------------------------------


@app.route("/transcribe_audio", methods=["POST"])
def transcribe_audio():
    try:
        data = request.json  # JS sends JSON
        audio_base64 = data.get("audio")
        qid = data.get("qid")  # question ID
        language_code = data.get("language_code", "fa-IR")

        if not audio_base64:
            return jsonify({"error": "No audio data received"}), 400

        payload = {
            "config": {
                "encoding": "WEBM_OPUS",
                "sampleRateHertz": 48000,
                "languageCode": language_code
            },
            "audio": {"content": audio_base64}
        }

        response = requests.post(SST_URL, json=payload)
        result = response.json()

        # Extract transcript safely
        transcript = ""
        if "results" in result and len(result["results"]) > 0:
            transcript = result["results"][0]["alternatives"][0]["transcript"]

        return jsonify({"qid": qid, "transcript": transcript})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze_direct", methods=["POST"])
def analyze_direct():
    data = request.json
    user_data = data.get("user_data")
    if not user_data:
        return jsonify({"error": "No user data provided"}), 400
    ai_result = generate_response(user_data)
    return jsonify({"ai_result": ai_result})


@app.route("/predict_behavior", methods=["POST"])
def predict_behavior():
    data = request.json
    user_data = data.get("user_data")
    situation = data.get("situation")
    if not user_data or not situation:
        return jsonify({"prediction": "Missing user data or situation description."}), 400

    prompt = f"""The following is a behavioral profile of a person:
{json.dumps(user_data, ensure_ascii=False, indent=2)}
با توجه به این پروفایل، این شخص در شرایطی که گفته می‌شود چه کاری انجام می‌دهد و چگونه رفتار می‌کند؟
Situation: {situation}

لطفا یک تخمین با تفکر از نوع رفتار شخص ارائه بده. """

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {"Content-Type": "application/json"}

    response = requests.post(GEMINI_URL, json=payload, headers=headers)
    try:
        result = response.json()
        if "candidates" in result:
            return jsonify({"prediction": result["candidates"][0]["content"]["parts"][0]["text"]})
        else:
            return jsonify({"prediction": "No prediction response received from AI."})
    except Exception as e:
        return jsonify({"prediction": f"Error: {str(e)}"})

@app.route("/healthz")
def health_check():
    return "OK", 200

# ------------------------------
# WebSocket server for per-question speech-to-text
# ------------------------------


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
