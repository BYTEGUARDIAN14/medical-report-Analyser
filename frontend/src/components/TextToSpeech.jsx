import { useEffect, useMemo, useState } from "react";
import { FiVolume2, FiXCircle } from "react-icons/fi";

const TextToSpeech = ({ text }) => {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const utterance = useMemo(() => {
    if (!text) return null;
    return new SpeechSynthesisUtterance(text);
  }, [text]);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported || !text) return null;

  const speak = () => {
    if (!utterance) return;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={speak}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-medtext hover:bg-gray-50"
      >
        <FiVolume2 />
        Read Summary Aloud
      </button>
      {speaking && (
        <button
          type="button"
          onClick={stop}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-medtext hover:bg-gray-50"
        >
          <FiXCircle />
          Stop
        </button>
      )}
    </div>
  );
};

export default TextToSpeech;
