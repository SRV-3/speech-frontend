import { useState, useRef,useEffect } from 'react'
import axios from "axios";
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import './App.css'

function App() {
  const [transcript, setTranscript] = useState("Your transcript appears here...");
  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [history, setHistory] = useState([]);

  // Start voice recognition
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("SpeechRecognition not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      finalTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");
      setTranscript(finalTranscript);
    };

    recognition.onend = () => {
      if (finalTranscript.trim()) {
        axios.post("https://speech-backend-dha0.onrender.com/save-transcript", { text: finalTranscript })
          .then(res => console.log("✅ Transcription saved:", res.data))
          .catch(err => console.error("❌ Save error:", err));
      }
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setTranscript("Speak...");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    
  };

  const handleUpload = async () => {
    if (!file) return alert("Please upload a file");
    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await axios.post("https://speech-backend-dha0.onrender.com/upload", formData);
      setTranscript(res.data.text || res.data.transcript || "Transcription complete, but no text received.");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };
  const loadHistory = () => {
  axios
    .get("https://speech-backend-dha0.onrender.com/history")
    .then((res) => setHistory(res.data))
    .catch((err) => console.error("❌ Error loading history", err));
};
  useEffect(() => {
  loadHistory();
}, []);

  const clear = () => {
    setTranscript("Your transcript appears here...");
    setFile(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 p-4">
      {/* Flying Symbols Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => {
          const symbols = ["+", "x", "o"];
          const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          const size = Math.floor(Math.random() * 20) + 20; // 20px–40px
          const x = Math.floor(Math.random() * 100); // random horizontal %
          const delay = Math.random() * 5;
          const duration = 10 + Math.random() * 10;

          return (
            <div
              key={i}
              className="absolute text-white opacity-30 floating-symbol"
              style={{
                fontSize: `${size}px`,
                left: `${x}%`,
                top: `${Math.random() * 100}vh`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            >
              {randomSymbol}
            </div>
          );
        })}
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 w-full max-w-md shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">SPEECH TO TEXT</h1>

        <div className="bg-white rounded-xl px-4 py-6 mb-6 min-h-[100px]">
          <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg 
              ${isRecording ? "animate-pulse bg-red-500" : "bg-blue-600"} hover:scale-105 transition`}
          >
            {isRecording ? <StopRoundedIcon fontSize="medium" /> : <MicRoundedIcon fontSize="medium" />}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="bg-white text-black font-medium p-3 rounded-xl shadow cursor-pointer text-center">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            Choose Audio File
          </label>

          <button
            onClick={handleUpload}
            className="bg-green-600 text-white font-medium p-3 rounded-xl shadow hover:bg-green-700"
          >
            Upload & Transcribe
          </button>

          <button
            onClick={clear}
            className="bg-white text-blue-600 font-medium p-3 rounded-xl shadow hover:text-blue-800"
          >
            Clear
          </button>
        </div>
        <div className="mt-10 bg-white/50 p-4 rounded-2xl max-h-60 overflow-y-auto shadow-inner backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">🕓 History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No transcriptions saved yet.</p>
          ) : (
            history.map((item, idx) => (
              <div
                key={item._id || idx}
                className="bg-white rounded-xl p-3 mb-2 shadow text-left"
              >
                <p className="text-gray-700 text-sm">{item.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
    
  );
}

export default App;