from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


SIMPLIFIER_MODEL_NAME = "google/flan-t5-base"


class MedicalTextSimplifier:
    def __init__(self) -> None:
        self.tokenizer = AutoTokenizer.from_pretrained(SIMPLIFIER_MODEL_NAME)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(SIMPLIFIER_MODEL_NAME)

    def simplify_text(self, text: str) -> str:
        clean_text = " ".join(text.split())
        if not clean_text:
            return ""

        prompt = (
            "Explain this medical text in simple language a patient can understand: "
            f"{clean_text}"
        )
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            max_length=1024,
            truncation=True,
        )
        output_ids = self.model.generate(
            inputs["input_ids"],
            max_length=256,
            min_length=60,
            num_beams=4,
            early_stopping=True,
            length_penalty=1.2,
        )
        return self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
