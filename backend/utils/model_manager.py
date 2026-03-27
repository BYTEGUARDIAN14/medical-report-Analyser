from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch


ANALYSIS_MODEL = "google/flan-t5-base"
TRANSLATE_MODEL = "google-t5/t5-base"


class ModelManager:
    _instance = None

    def __init__(self):
        if not hasattr(self, 'initialized'):
            print(f"Loading AI Analysis Engine ({ANALYSIS_MODEL})...")
            self.analysis_tokenizer = AutoTokenizer.from_pretrained(ANALYSIS_MODEL)
            self.analysis_model = AutoModelForSeq2SeqLM.from_pretrained(ANALYSIS_MODEL)
            
            print(f"Loading AI Translation Engine ({TRANSLATE_MODEL})...")
            self.translate_tokenizer = AutoTokenizer.from_pretrained(TRANSLATE_MODEL)
            self.translate_model = AutoModelForSeq2SeqLM.from_pretrained(TRANSLATE_MODEL)

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

    def generate_translation(self, prompt, max_length=512, **kwargs):
        inputs = self.translate_tokenizer(
            prompt,
            return_tensors="pt",
            max_length=1024,
            truncation=True,
        ).to(self.device)
        
        output_ids = self.translate_model.generate(
            inputs["input_ids"],
            max_length=max_length,
            num_beams=4,
            early_stopping=True,
            **kwargs
        )
        return self.translate_tokenizer.decode(output_ids[0], skip_special_tokens=True)


def get_model_manager():
    return ModelManager.get_instance()
