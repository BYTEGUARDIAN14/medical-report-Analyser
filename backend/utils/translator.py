from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


TRANSLATOR_MODEL_NAME = "google/flan-t5-base"


class MedicalTranslator:
    def __init__(self) -> None:
        self.tokenizer = AutoTokenizer.from_pretrained(TRANSLATOR_MODEL_NAME)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(TRANSLATOR_MODEL_NAME)

    def translate_text(self, text: str, target_lang: str) -> str:
        clean_text = " ".join(text.split())
        if not clean_text:
            return ""

        # Using flan-t5 prompt for translation
        prompt = f"Translate this medical information to {target_lang}: {clean_text}"
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            max_length=1024,
            truncation=True,
        )
        output_ids = self.model.generate(
            inputs["input_ids"],
            max_length=512,
            min_length=30,
            num_beams=4,
            early_stopping=True,
            length_penalty=1.0,
        )
        return self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
