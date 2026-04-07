export function speak(text: string) {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported.");
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a nice English/Hindi voice if possible
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('en-IN')) || voices[0];
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  utterance.rate = 1;
  utterance.pitch = 1;
  
  window.speechSynthesis.speak(utterance);
}

export function startListening(onResult: (text: string) => void, onError?: (err: any) => void, onEnd?: () => void) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    if (onError) onError(new Error("Speech recognition not supported in this browser."));
    return null;
  }
  
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-IN'; // Works for Hinglish in many browsers
  
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };
  
  recognition.onerror = (event: any) => {
    if (onError) onError(event.error);
  };
  
  recognition.onend = () => {
     if (onEnd) onEnd();
  };
  
  recognition.start();
  return recognition;
}
