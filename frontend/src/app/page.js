"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   Configuration
   ═══════════════════════════════════════════════════════════ */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

const CLASS_ICONS = {
  Cataract: "🔵",
  "Diabetic Retinopathy": "🔴",
  Glaucoma: "🟣",
  Normal: "🟢",
};

const CLASS_KEYS = {
  Cataract: "cataract",
  "Diabetic Retinopathy": "diabetic_retinopathy",
  Glaucoma: "glaucoma",
  Normal: "normal",
};

/* ═══════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("diagnosis");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  /* ── File Handling ───────────────────────────────────────── */
  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) return;
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResults(null);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    },
    [handleFile]
  );

  const resetUpload = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ── Analyze Image ───────────────────────────────────────── */
  const analyzeImage = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
      setActiveTab("diagnosis");
    } catch (err) {
      alert(`Analysis failed: ${err.message}\n\nMake sure the backend is running at ${API_URL}`);
    } finally {
      setLoading(false);
    }
  }, [file]);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      <Header />

      <main>
        {!results && !loading && (
          <>
            <HeroSection />
            <section className="upload-section container">
              {!preview ? (
                <UploadZone
                  fileInputRef={fileInputRef}
                  dragOver={dragOver}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onFileChange={(e) => handleFile(e.target.files[0])}
                />
              ) : (
                <PreviewCard
                  preview={preview}
                  fileName={file?.name}
                  onAnalyze={analyzeImage}
                  onReset={resetUpload}
                />
              )}
            </section>
          </>
        )}

        {loading && <LoadingScreen />}

        {results && (
          <section className="results-section container">
            <ResultsHeader onNewImage={resetUpload} />
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "diagnosis" && <DiagnosisTab results={results} />}
            {activeTab === "xai" && <XaiTab results={results} />}
            {activeTab === "explanation" && (
              <ExplanationTab explanation={results.explanation} />
            )}
            {activeTab === "chat" && <ChatTab />}
          </section>
        )}
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Header
   ═══════════════════════════════════════════════════════════ */
function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <a className="logo" href="/">
          <span className="logo-icon">👁️</span>
          <span className="logo-text">EyeAI Classifier</span>
        </a>
        <nav>
          <ul className="nav-links">
            <li>
              <a className="nav-link" href="https://github.com" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="hero container">
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        5-Model Ensemble · 97.4% Accuracy · 0.9995 AUC
      </div>
      <h1>AI-Powered Eye Disease Detection</h1>
      <p>
        Upload a fundus image and get instant diagnosis with explainable AI
        heatmaps and detailed medical explanations.
      </p>
      <div className="hero-models">
        {["Custom CNN", "VGG16", "ResNet50", "EfficientNet-B4", "Swin Transformer"].map(
          (m) => (
            <span key={m} className="model-chip">{m}</span>
          )
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Upload Zone
   ═══════════════════════════════════════════════════════════ */
function UploadZone({ fileInputRef, dragOver, onDragOver, onDragLeave, onDrop, onFileChange }) {
  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <span className="upload-icon">📂</span>
      <h3>
        Drag & drop your fundus image or{" "}
        <span className="upload-btn-text">browse files</span>
      </h3>
      <p>Supports JPG, PNG, BMP · Max 10MB</p>
      <input
        ref={fileInputRef}
        type="file"
        className="upload-input"
        accept="image/*"
        onChange={onFileChange}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Preview Card
   ═══════════════════════════════════════════════════════════ */
function PreviewCard({ preview, fileName, onAnalyze, onReset }) {
  return (
    <div className="preview-container">
      <div className="preview-image-wrapper">
        <img src={preview} alt="Fundus preview" className="preview-image" />
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
        {fileName}
      </p>
      <div className="preview-actions">
        <button className="btn btn-primary" onClick={onAnalyze}>
          🔬 Analyze Image
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          ✕ Remove
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Loading Screen
   ═══════════════════════════════════════════════════════════ */
function LoadingScreen() {
  const steps = [
    "Preprocessing image...",
    "Running Custom CNN...",
    "Running VGG16...",
    "Running ResNet50...",
    "Running EfficientNet-B4...",
    "Running Swin Transformer...",
    "Computing ensemble...",
    "Generating Grad-CAM heatmaps...",
    "Creating AI explanation...",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-overlay container">
      <div className="spinner" />
      <p className="loading-text">{steps[step]}</p>
      <p className="loading-sub">This may take 30–60 seconds on CPU</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Results Header
   ═══════════════════════════════════════════════════════════ */
function ResultsHeader({ onNewImage }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Analysis Results</h2>
      <button className="btn btn-ghost" onClick={onNewImage}>
        ← New Image
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab Bar
   ═══════════════════════════════════════════════════════════ */
function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "diagnosis", label: "🎯 Diagnosis" },
    { id: "xai", label: "🧠 XAI Heatmaps" },
    { id: "explanation", label: "📋 Explanation" },
    { id: "chat", label: "💬 Ask AI" },
  ];
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`tab ${activeTab === t.id ? "active" : ""}`}
          onClick={() => setActiveTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Diagnosis Tab
   ═══════════════════════════════════════════════════════════ */
function DiagnosisTab({ results }) {
  const { ensemble, individual_models } = results;
  const classKey = CLASS_KEYS[ensemble.predicted_class] || "normal";

  return (
    <>
      {/* Ensemble Prediction Card */}
      <div className="prediction-card">
        <div className="prediction-header">
          <div className="prediction-class">
            <div className={`prediction-icon ${classKey}`}>
              {CLASS_ICONS[ensemble.predicted_class] || "🔍"}
            </div>
            <div>
              <div className="prediction-label">Ensemble Prediction</div>
              <div className="prediction-name">{ensemble.predicted_class}</div>
            </div>
          </div>
          <div className="confidence-badge">
            {(ensemble.confidence * 100).toFixed(1)}% Confidence
          </div>
        </div>

        {/* Probability Bars */}
        <div className="prob-bars">
          {Object.entries(ensemble.probabilities)
            .sort((a, b) => b[1] - a[1])
            .map(([cls, prob]) => (
              <div key={cls} className="prob-row">
                <span className="prob-label">
                  {CLASS_ICONS[cls]} {cls}
                </span>
                <div className="prob-bar-track">
                  <div
                    className={`prob-bar-fill ${CLASS_KEYS[cls]}`}
                    style={{ width: `${prob * 100}%` }}
                  />
                </div>
                <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
        </div>
      </div>

      {/* Individual Model Cards */}
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>
        Individual Model Predictions
      </h3>
      <div className="models-grid">
        {Object.entries(individual_models).map(([key, model]) => (
          <div key={key} className="model-card">
            <div className="model-card-name">{model.display_name}</div>
            <div className="model-card-pred">
              {CLASS_ICONS[model.class]} {model.class}
            </div>
            <div className="model-card-conf">
              {(model.confidence * 100).toFixed(1)}% confidence
            </div>
            <span
              className={`model-card-agree ${
                model.class === ensemble.predicted_class ? "yes" : "no"
              }`}
            >
              {model.class === ensemble.predicted_class ? "✓ Agrees" : "✗ Disagrees"}
            </span>
          </div>
        ))}
      </div>

      <div className="disclaimer">
        <span>⚠️</span>
        <p>
          This is an AI screening tool for educational purposes only. It should
          NOT replace professional medical diagnosis. Consult a qualified
          ophthalmologist.
        </p>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   XAI Heatmaps Tab
   ═══════════════════════════════════════════════════════════ */
function XaiTab({ results }) {
  const { xai_heatmaps, original_image } = results;

  return (
    <>
      <div className="xai-info-banner">
        <span style={{ fontSize: "1.2rem" }}>🧠</span>
        <p>
          <strong>Grad-CAM Heatmaps</strong> show which regions of the fundus
          image each model focused on for its prediction.{" "}
          <strong style={{ color: "var(--color-dr)" }}>Red/yellow</strong>{" "}
          = high importance ·{" "}
          <strong style={{ color: "var(--accent-secondary)" }}>Blue</strong>{" "}
          = low importance.
        </p>
      </div>

      <div className="xai-grid">
        {/* Original Image */}
        <div className="xai-card">
          <img
            src={`data:image/png;base64,${original_image}`}
            alt="Original fundus"
            className="xai-image"
          />
          <div className="xai-card-info">
            <div className="xai-card-name">Original Image</div>
            <div className="xai-card-desc">Input fundus image (224×224)</div>
          </div>
        </div>

        {/* Grad-CAM Heatmaps */}
        {Object.entries(xai_heatmaps).map(([key, data]) => (
          <div key={key} className="xai-card">
            <img
              src={`data:image/png;base64,${data.heatmap}`}
              alt={`${data.display_name} Grad-CAM`}
              className="xai-image"
            />
            <div className="xai-card-info">
              <div className="xai-card-name">{data.display_name}</div>
              <div className="xai-card-desc">Grad-CAM heatmap overlay</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Explanation Tab
   ═══════════════════════════════════════════════════════════ */
function ExplanationTab({ explanation }) {
  return (
    <div className="explanation-card">
      <div style={{ whiteSpace: "pre-wrap" }}>{explanation}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Chat Tab
   ═══════════════════════════════════════════════════════════ */
function ChatTab() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI ophthalmologist assistant. Ask me anything about the diagnosis, eye diseases, or the Grad-CAM heatmaps. 👁️",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "What is Diabetic Retinopathy?",
    "Explain the Grad-CAM heatmaps",
    "How accurate is this AI?",
    "What treatment options exist?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text) => {
      const msg = text || input.trim();
      if (!msg || sending) return;

      const newMessages = [...messages, { role: "user", content: msg }];
      setMessages(newMessages);
      setInput("");
      setSending(true);

      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            history: newMessages.slice(1).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't connect to the AI service. Please check the backend.",
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [input, messages, sending]
  );

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <div className="chat-avatar">
              {m.role === "assistant" ? "🤖" : "👤"}
            </div>
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="chat-message assistant">
            <div className="chat-avatar">🤖</div>
            <div className="chat-bubble">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about eye diseases, the diagnosis, or heatmaps..."
          disabled={sending}
        />
        <button
          className="chat-send-btn"
          onClick={() => sendMessage()}
          disabled={sending || !input.trim()}
        >
          Send
        </button>
      </div>

      <div className="chat-suggestions">
        {suggestions.map((s) => (
          <button
            key={s}
            className="chat-suggestion"
            onClick={() => sendMessage(s)}
            disabled={sending}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
