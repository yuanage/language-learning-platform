import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API 封装：语音识别 + TTS 播放
 * - recognitionSupported: 浏览器是否支持语音识别（Chrome/Edge）
 * - ttsVoices: 系统可用语音列表（用于检测日/韩语音包）
 */
export default function useSpeech() {
  const [recognitionSupported] = useState(
    () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [ttsVoices, setTtsVoices] = useState([]);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(null);

  useEffect(() => {
    const load = () => setTtsVoices(window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
    if (window.speechSynthesis) {
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
      stopListen();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListen = useCallback((locale = 'en-US', onFinal) => {
    if (!recognitionSupported) return;
    stopListen();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = locale;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    onResultRef.current = onFinal;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript || '';
      setTranscript(text);
      if (onResultRef.current) onResultRef.current(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setTranscript('');
    setListening(true);
    rec.start();
  }, [recognitionSupported]);

  function stopListen() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* noop */ }
      recognitionRef.current = null;
    }
    setListening(false);
  }

  const hasVoiceFor = useCallback(
    (locale) => ttsVoices.some((v) => v.lang?.toLowerCase().startsWith(String(locale).slice(0, 2).toLowerCase())),
    [ttsVoices]
  );

  const speak = useCallback((text, locale = 'en-US', rate = 1) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = rate;
    const voice = ttsVoices.find((v) => v.lang?.toLowerCase().startsWith(String(locale).slice(0, 2).toLowerCase()));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }, [ttsVoices]);

  const stopSpeak = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  return { recognitionSupported, listening, transcript, startListen, stopListen, speak, stopSpeak, ttsVoices, hasVoiceFor };
}
