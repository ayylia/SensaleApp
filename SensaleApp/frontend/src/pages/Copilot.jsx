import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Loader } from "lucide-react";
import { apiClient } from "../App";

const SUGGESTED_PROMPTS = [
  "What is my best selling product?",
  "What is my total revenue?",
  "Which platform sells the most?",
  "What should I restock next week?",
  "What is my worst performing product?",
];

function ChatBubble({ message }) {
  const isBot = message.role === "bot";
  return (
    <div className={`flex items-end gap-3 animate-fade-in-up ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex-shrink-0 flex items-center justify-center shadow-md">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-lg px-5 py-4 rounded-3xl text-sm font-semibold leading-relaxed shadow-sm ${
          isBot
            ? "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
            : "bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-br-sm"
        }`}
        style={{ whiteSpace: "pre-line" }}
      >
        {message.text}
      </div>
      {!isBot && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex-shrink-0 flex items-center justify-center shadow-md">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}

export default function Copilot() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! 👋 I'm your Sensale AI Copilot, powered by Google Gemini. I can answer questions about your sales data. Try asking me what your best selling product is, or just type help to see all I can do!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post("/api/chat", { message: userMsg });
      setMessages((prev) => [...prev, { role: "bot", text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "❌ Sorry, I couldn't connect to the backend. Please make sure your Python server is running!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 relative z-20 w-full flex flex-col h-[calc(100dvh-160px)] md:h-[calc(100dvh-80px)]">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center mb-2">
          <Sparkles className="w-8 h-8 mr-4 text-sky-500" /> AI Copilot
          <span className="ml-4 text-[10px] font-black bg-sky-50 text-sky-600 px-3 py-1 rounded-full border border-sky-100 uppercase tracking-widest animate-pulse">
            Powered by Gemini
          </span>
        </h2>
        <p className="text-md text-slate-500 font-medium tracking-wide">
          Chat directly with your sales data and models.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt)}
            disabled={loading}
            className="text-xs font-bold px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-all shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 glass-card rounded-[2rem] p-6 overflow-y-auto space-y-5 border border-sky-100 bg-white/60">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex items-end gap-3 justify-start animate-fade-in-up">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex-shrink-0 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl rounded-bl-sm shadow-sm flex items-center gap-2">
              <Loader className="w-4 h-4 text-sky-400 animate-spin" />
              <span className="text-sm font-bold text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <div className="mt-4 flex-shrink-0">
        <div className="bg-white border border-slate-200 rounded-3xl p-2 flex shadow-lg shadow-slate-100/50 focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-500/5 transition-all">
          <input
            type="text"
            placeholder="Ask me anything about your sales..."
            className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-700 font-semibold text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-md flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
