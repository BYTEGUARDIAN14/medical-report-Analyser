from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer, AutoModelForSeq2SeqLM, AutoTokenizer
import torch


ANALYSIS_MODEL = "google/flan-t5-base"
TRANSLATE_MODEL = "facebook/m2m100_418M"  # Specialized translation model for 100 languages


class ModelManager:
    _instance = None

    def __init__(self):
        if not hasattr(self, 'initialized'):
            print(f"Loading AI Analysis Engine ({ANALYSIS_MODEL})...")
            self.analysis_tokenizer = AutoTokenizer.from_pretrained(ANALYSIS_MODEL)
            self.analysis_model = AutoModelForSeq2SeqLM.from_pretrained(ANALYSIS_MODEL)
            
            print(f"Loading Specialized Translation Engine ({TRANSLATE_MODEL})...")
            # Using M2M100 for high-fidelity translation in 100+ languages
            self.translate_tokenizer = M2M100Tokenizer.from_pretrained(TRANSLATE_MODEL)
            self.translate_model = M2M100ForConditionalGeneration.from_pretrained(TRANSLATE_MODEL)

            # Use GPU if available
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.analysis_model.to(self.device)
            self.translate_model.to(self.device)
            self.initialized = True

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def generate_analysis(self, prompt, max_length=256, min_length=40, **kwargs):
        inputs = self.analysis_tokenizer(
            prompt,
            return_tensors="pt",
            max_length=1024,
            truncation=True,
        ).to(self.device)
        
        output_ids = self.analysis_model.generate(
            inputs["input_ids"],
            max_length=max_length,
            min_length=min_length,
            num_beams=4,
            early_stopping=True,
            **kwargs
        )
        return self.analysis_tokenizer.decode(output_ids[0], skip_special_tokens=True)

    def translate(self, text, target_lang_code, max_length=512):
        # Determine target language code
        # Map human-readable names to M2M100 codes
        lang_map = {
            "Hindi": "hi",
            "Tamil": "ta",
            "French": "fr",
            "Spanish": "es",
            "German": "de",
            "Telugu": "te",
            "Kannada": "kn",
            "Malayalam": "ml"
        }
        target_code = lang_map.get(target_lang_code, "hi")

        # 1. First, try specialized translation model M2M100
        # For M2M100, we should set both src_lang and tgt_lang on the tokenizer
        try:
            self.translate_tokenizer.src_lang = "en"
            # It's good practice to set tgt_lang but forced_bos_token_id is final
            
            encoded_en = self.translate_tokenizer(text, return_tensors="pt").to(self.device)
            
            # Using beam search (num_beams=5) significantly improves translation quality
            # especially for long-form medical sentences.
            generated_tokens = self.translate_model.generate(
                **encoded_en, 
                forced_bos_token_id=self.translate_tokenizer.get_lang_id(target_code),
                max_length=max_length,
                num_beams=5,
                early_stopping=True,
                length_penalty=1.0
            )
            translated = self.translate_tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
            
            # Detect failure: if translation output is too identical to source, it's a fail.
            source_words = set(text.lower().split())
            translated_words = set(translated.lower().split())
            overlap = len(source_words.intersection(translated_words))
            similarity_ratio = overlap / max(len(source_words), 1)

            # Detect failure (high similarity) especially for Tamil/Telugu where M2M-418M often defaults to English
            # Hindi is reportedly OK, so we only fallback if it's extremely close to source (>90%)
            should_fallback = False
            if target_lang_code in ["Tamil", "Telugu"] and (similarity_ratio > 0.6 or "patient" in translated.lower()):
                should_fallback = True
            elif target_lang_code == "Hindi" and similarity_ratio > 0.9:
                should_fallback = True

            if should_fallback:
                 # Leverage Analysis Model as a high-fidelity semantic fallback
                 prompt = f"Translate the following medical summary into {target_lang_code} script precisely. Do not keep English words. Summary: {text}"
                 translated = self.generate_analysis(prompt, max_length=max_length, min_length=15)
            
            return translated
        except Exception as e:
            # Absolute fallback to prompt-based if M2M100 crashes (e.g. CUDA memory)
            try:
                 prompt = f"Translate this into {target_lang_code}: {text}"
                 return self.generate_analysis(prompt, max_length=max_length)
            except:
                 return f"[Translation unavailable for {target_lang_code}]"


def get_model_manager():
    return ModelManager.get_instance()
