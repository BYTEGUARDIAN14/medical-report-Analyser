from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

from flask import Flask, jsonify, request
from flask_cors import CORS

from utils.abnormality import detect_abnormalities
from utils.extractor import extract_text, is_supported_file
from utils.model_manager import get_model_manager

app = Flask(__name__)
CORS(app)

# Load context once at startup
manager = None
model_startup_error = None

try:
    print("Attempting to load AI models...")
    manager = get_model_manager()
    print("AI models loaded successfully.")
except Exception as startup_error:
    model_startup_error = str(startup_error)
    print(f"FAILED to load AI models: {model_startup_error}")


def run_with_timeout(func, *args, timeout=60, **kwargs):
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(func, *args, **kwargs)
        return future.result(timeout=timeout)


@app.route("/", methods=["GET"])
def index():
    return (
        jsonify(
            {
                "message": "Medical Report Intelligence API is running.",
                "endpoints": {
                    "GET /health": "Server and model readiness check",
                    "POST /upload": "Extract text from PDF/image/TXT multipart file",
                    "POST /analyze": "Generate summary, simplified text, and alerts",
                    "POST /translate": "Translate medical text (Hindi, Tamil, etc.)",
                },
            }
        ),
        200,
    )


@app.errorhandler(404)
def handle_not_found(error):
    return (
        jsonify(
            {
                "error": "Route not found.",
                "status": 404,
                "hint": "Use GET /health, POST /upload, or POST /analyze.",
            }
        ),
        404,
    )


@app.errorhandler(Exception)
def handle_exception(error):
    status_code = getattr(error, "code", 500)
    return (
        jsonify(
            {
                "error": str(error),
                "status": status_code,
            }
        ),
        status_code,
    )


@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Use form field name 'file'."}), 400

    file = request.files["file"]
    if not file or not file.filename:
        return jsonify({"error": "No file selected."}), 400

    if not is_supported_file(file.filename):
        return (
            jsonify(
                {
                    "error": "Unsupported format. Allowed: PDF, JPG, PNG, TXT.",
                }
            ),
            400,
        )

    text = extract_text(file.stream, file.filename)
    if not text.strip():
        return jsonify({"error": "File is empty after extraction."}), 400

    return jsonify({"text": text})


@app.route("/analyze", methods=["POST"])
def analyze():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Request body must include 'text'."}), 400

    if model_startup_error or manager is None:
        return (
            jsonify(
                {
                    "error": "AI models are not ready on server.",
                    "details": model_startup_error
                    or "Model initialization failed or is still in progress.",
                    "manager_state": "Missing" if manager is None else "Ready"
                }
            ),
            503,
        )

    try:
        # 1. Read the custom prompt from prompt.txt
        custom_prompt_text = "Summarize this medical report in simple language."
        try:
            with open("prompt.txt", "r") as f:
                custom_prompt_text = f.read().strip()
        except Exception:
            pass

        summary_prompt = f"{custom_prompt_text}\n\nReport:\n{text}"
        simplify_prompt = f"Explain this medical text in simple language a patient can understand, especially clinical findings: {text}"
        suggest_prompt = f"Based on this medical report, what are the top 3 actionable health suggestions or lifestyle changes for the patient? {text}"
        
        summary = run_with_timeout(manager.generate_analysis, summary_prompt, max_length=256, min_length=40, timeout=120)
        simplified = run_with_timeout(manager.generate_analysis, simplify_prompt, max_length=256, min_length=60, timeout=120)
        suggestions = run_with_timeout(manager.generate_analysis, suggest_prompt, max_length=150, min_length=30, timeout=120)
    except FuturesTimeoutError:
        return (
            jsonify({"error": "Model inference timed out. Please retry."}),
            504,
        )

    alerts = detect_abnormalities(text)
    
    # Advanced Diagnostics: Specialist Suggestions
    specialist_list = []
    l_text = text.lower()
    if any(k in l_text for k in ["glucose", "diabetes", "insulin", "sugar", "hba1c"]):
        specialist_list.append("Endocrinologist")
    if any(k in l_text for k in ["blood pressure", "bp", "hypertension", "140/", "150/", "systolic"]):
        specialist_list.append("Cardiologist")
    if any(k in l_text for k in ["hemoglobin", "hgb", "anemia", "anemic", "ferritin"]):
        specialist_list.append("Hematologist")
    if any(k in l_text for k in ["kidney", "renal", "creatinine", "nephropathy"]):
        specialist_list.append("Nephrologist")
    if any(k in l_text for k in ["liver", "alt ", "ast ", "bilirubin", "hepatic"]):
        specialist_list.append("Hepatologist / Gastroenterologist")
    
    # Aggregated Stats
    abnormal_count = len(alerts)
    total_findings_est = len(text.split("\n"))
    
    # Calculate Severity Score (0-100)
    severity_base = abnormal_count * 20
    severity_score = min(95, severity_base if severity_base > 0 else 10)
    if any("critical" in a.lower() for a in alerts):
        severity_score = max(severity_score, 85)

    return jsonify(
        {
            "summary": summary,
            "simplified": simplified,
            "suggestions": suggestions,
            "alerts": alerts,
            "severity_score": severity_score,
            "ai_confidence": 92 if severity_score < 80 else 88,
            "specialists": list(set(specialist_list)) if specialist_list else ["General Physician"],
            "stats": {
                "abnormal": abnormal_count,
                "total_estimated": total_findings_est
            }
        }
    )


@app.route("/translate", methods=["POST"])
def translate():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    target_lang = (payload.get("target_lang") or "Hindi").strip()
    
    if not text:
        return jsonify({"error": "Request body must include 'text'."}), 400

    if model_startup_error or manager is None:
        return jsonify({
            "error": "AI models are not ready.",
            "details": model_startup_error,
            "manager_state": "Missing" if manager is None else "Ready"
        }), 503

    try:
        # M2M100 is a specialized translation model that performs best
        # with direct text-to-text mapping without verbose prompts.
        translated = run_with_timeout(manager.translate, text, target_lang, max_length=512, timeout=120)
        
        if not translated or not translated.strip() or translated == ".":
            translated = f"[Translation unavailable for {target_lang} - ensure characters are supported]"
            
        return jsonify({"translatedText": translated.strip()})
    except FuturesTimeoutError:
        return jsonify({"error": "Translation timed out."}), 504


@app.route("/health", methods=["GET"])
def health():
    return (
        jsonify(
            {
                "status": "ok" if not model_startup_error else "degraded",
                "models_ready": manager is not None and model_startup_error is None,
                "model_startup_error": model_startup_error,
                "manager_exists": manager is not None
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
