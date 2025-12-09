import React, { useState, useRef, useEffect } from 'react';
import { generateInventoryResponse } from '../services/geminiService';
import { getItems } from '../services/supabaseService';
import { Bot, Send, Sparkles, User as UserIcon } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy el asistente virtual de Defensa Civil. Puedo ayudarte a consultar el stock actual o sugerir especificaciones para nuevos equipos. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Fetch fresh inventory context from Supabase
      const currentInventory = await getItems();
      const aiResponseText = await generateInventoryResponse(userMsg.text, currentInventory);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "Lo siento, tuve un problema interno. Intenta de nuevo.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-dcRed to-dcDarkRed p-4 flex items-center shadow-md">
        <div className="bg-white/20 p-2 rounded-full mr-3">
           <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">Asistente Inteligente</h2>
          <p className="text-red-100 text-xs flex items-center font-medium">
            <Sparkles className="w-3 h-3 mr-1" />
            Potenciado por Gemini
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${
                msg.sender === 'user' ? 'bg-gray-300 ml-2' : 'bg-dcYellow mr-2'
              }`}>
                {msg.sender === 'user' ? <UserIcon className="w-5 h-5 text-gray-700" /> : <Bot className="w-5 h-5 text-dcDarkRed" />}
              </div>
              
              <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm font-medium ${
                msg.sender === 'user' 
                  ? 'bg-dcRed text-white rounded-tr-none' 
                  : 'bg-white text-gray-900 rounded-tl-none border border-gray-300'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <span className={`text-[10px] block mt-1 opacity-70 ${msg.sender === 'user' ? 'text-red-100' : 'text-gray-500 font-bold'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
             <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-300 ml-10">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-400 rounded-xl px-4 py-3 focus:ring-2 focus:ring-dcRed focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-600 font-medium"
            placeholder="Escribe tu consulta sobre el inventario..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isLoading}
            className={`bg-dcRed text-white p-3 rounded-xl transition-colors shadow-sm flex items-center justify-center ${
              !inputText.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dcDarkRed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};