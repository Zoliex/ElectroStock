import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, User, Plus } from "lucide-react";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { cn } from "../lib/utils";
import { directus } from "../lib/directus";
import { readItems } from "@directus/sdk";
import { useNavigate } from "react-router-dom";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string; isAction?: boolean }[]>([
    { role: "model", text: "Hi! I'm your ElectroStock assistant. How can I help you with your inventory today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const searchInventoryFunction: FunctionDeclaration = {
        name: "searchInventory",
        description: "Search the electronic components inventory by name, category, or description.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The search query (e.g., 'resistor', '10k', 'arduino')."
            }
          },
          required: ["query"]
        }
      };

      const suggestCreateComponentFunction: FunctionDeclaration = {
        name: "suggestCreateComponent",
        description: "Suggest the user to create a new component when they ask to add, create, or insert a new item into the inventory.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            reason: {
              type: Type.STRING,
              description: "The reason for suggesting creation."
            }
          }
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: "user", parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: "You are a helpful assistant for an electronics inventory management app called ElectroStock. You can search the inventory using the searchInventory tool. You CANNOT create, update, or delete components directly. If the user asks to create or add a component, you MUST use the suggestCreateComponent tool to provide them with a button to the creation page.",
          tools: [{ functionDeclarations: [searchInventoryFunction, suggestCreateComponentFunction] }]
        }
      });

      let finalResponseText = response.text || "";
      let isAction = false;

      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        
        if (call.name === "searchInventory") {
          const args = call.args as any;
          try {
            const items = await directus.request(readItems('components', {
              search: args.query,
              limit: 5,
              fields: ['name', 'quantity_available', 'description', 'type.name'] as any
            }));
            
            const functionResponse = {
              name: "searchInventory",
              response: { items }
            };

            const secondResponse = await ai.models.generateContent({
              model: "gemini-3.1-pro-preview",
              contents: [
                ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
                { role: "user", parts: [{ text: userMessage }] },
                { role: "model", parts: [{ functionCall: call }] },
                { role: "user", parts: [{ functionResponse }] }
              ]
            });
            
            finalResponseText = secondResponse.text || "Here are the results.";
          } catch (e) {
            finalResponseText = "I encountered an error while searching the inventory.";
          }
        } else if (call.name === "suggestCreateComponent") {
          finalResponseText = "I cannot create components directly, but you can use the button below to go to the creation page.";
          isAction = true;
        }
      }

      setMessages((prev) => [...prev, { role: "model", text: finalResponseText, isAction }]);
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: error.message || "Sorry, I encountered an error while processing your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full bg-primary text-white shadow-lg hover:brightness-110 transition-all z-50",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all origin-bottom-right z-50",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
        style={{ height: "500px", maxHeight: "calc(100vh - 48px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">ElectroStock AI</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "shrink-0 size-8 rounded-full flex items-center justify-center",
                  msg.role === "user" ? "bg-slate-200 dark:bg-slate-700" : "bg-primary/10 text-primary"
                )}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-slate-100 dark:bg-slate-800 rounded-tl-none"
                )}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.isAction && (
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/inventory/add');
                    }}
                    className="mt-3 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Component
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="shrink-0 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 rounded-tl-none text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your inventory..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-full bg-primary text-white disabled:opacity-50 hover:brightness-110 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
