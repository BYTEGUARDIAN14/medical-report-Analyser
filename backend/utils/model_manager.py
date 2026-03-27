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
        # M2M100 requires setting the source language and target language
        self.translate_tokenizer.src_lang = "en"
        encoded_en = self.translate_tokenizer(text, return_tensors="pt").to(self.device)
        
        # Determine target language code
        # Map human-readable names to M2M100 codes
        lang_map = {
            "Hindi": "hi",
            "Tamil": "ta",
            "French": "fr",
            "Spanish": "es",
            "German": "de"
        }
        target_code = lang_map.get(target_lang_code, "hi")
        
        generated_tokens = self.translate_model.generate(
            **encoded_en, 
            forced_bos_token_id=self.translate_tokenizer.get_lang_id(target_code),
            max_length=max_length
        )
        return self.translate_tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]


def get_model_manager():
    return ModelManager.get_instance()
