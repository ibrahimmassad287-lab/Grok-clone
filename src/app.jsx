import { useState, useEffect, useRef } from "react";
import "./App.css";

const SYSTEM_PROMPT = {
  role: "system",
  content: "You are a helpful, truthful and slightly witty AI assistant inspired by Grok. Answer clearly and honestly.",
};

function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat-history");
    return saved ? JSON.parse(saved) : [SYSTEM_PROMPT];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Save history + auto-scroll
  useEffect(() => {
    localStorage.setItem("chat-history", JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([SYSTEM_PROMPT]);
    localStorage.removeItem("chat-history");
  };

  return (
    <div className="app">
      <header>
        <h1>Grok-style Chat</h1>
        <button onClick={clearHistory}>Clear Chat</button>
      </header>

      <div className="messages">
        {messages
          .filter((m) => m.role !== "system")
          .map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
              <div className="content">{msg.content}</div>
            </div>
          ))}
        {loading && <div className="message assistant">Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          rows={3}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
