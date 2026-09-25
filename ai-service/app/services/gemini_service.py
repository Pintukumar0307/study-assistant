import google.generativeai as genai
from typing import Optional
from app.core.config import get_settings
from app.core.logging import logger


class GeminiService:
    _model = None

    def _get_model(self):
        if self._model is None:
            settings = get_settings()
            genai.configure(api_key=settings.gemini_api_key)
            self._model = genai.GenerativeModel(
                model_name="gemini-3.5-flash-lite",
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    top_p=0.95,
                    max_output_tokens=4096,
                ),
                safety_settings=[
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
                ],
            )
        return self._model

    def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        model = self._get_model()
        full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
        try:
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise

    def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Generate with JSON output instruction."""
        json_instruction = "You must respond ONLY with valid JSON. No markdown, no backticks, no explanation."
        full_system = f"{json_instruction}\n{system_instruction}" if system_instruction else json_instruction
        return self.generate(prompt, full_system)


gemini_service = GeminiService()
