from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


SUMMARIZER_MODEL_NAME = "google/flan-t5-base"


class ReportSummarizer:
    def __init__(self) -> None:
        self.tokenizer = AutoTokenizer.from_pretrained(SUMMARIZER_MODEL_NAME)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(SUMMARIZER_MODEL_NAME)

    def summarize_report(self, text: str) -> str:
        clean_text = " ".join(text.split())
        if not clean_text:
            return ""

        prompt = f"Summarize this medical report clearly and briefly: {clean_text}"
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            max_length=1024,
            truncation=True,
        )
        summary_ids = self.model.generate(
            inputs["input_ids"],
            max_length=180,
            min_length=40,
            length_penalty=1.5,
            num_beams=4,
            early_stopping=True,
        )
        return self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)
