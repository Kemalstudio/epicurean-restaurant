import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// Безопасные импорты иконок
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import X from 'lucide-react/dist/esm/icons/x';
import Send from 'lucide-react/dist/esm/icons/send';
import Bot from 'lucide-react/dist/esm/icons/bot';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';

export default function AiAssistant() {
    const { t, lang } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: lang === 'tk'
                ? 'Salam! Men siziň şahsy aşpez kömekçiňiz. Men size tagamlary saýlamaga we sargyt etmäge kömek edip bilerin. Bu gün näme iýmek isleýärsiňiz? 🍕'
                : lang === 'ru'
                    ? 'Привет! Я ваш личный ИИ-помощник Epicurean. Я помогу вам выбрать блюда и отвечу на любые вопросы по меню. Что желаете сегодня? 🍕'
                    : 'Hi! I\'m your personal food assistant. I can help you discover dishes or answer any questions about our menu. What are you craving today? 🍕'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are a friendly, knowledgeable food assistant for "Epicurean" restaurant. 
        Current language: ${lang}. Respond in this language.
        Conversation history:
        ${conversationHistory}
        User: ${userMsg}`,
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Кнопка вызова чата */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                whileHover={{ rotate: 5 }}
                whileTap={{ scale: 0.9 }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </motion.button>

            {/* Окно чата */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-background rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden"
                    >
                        {/* Шапка чата */}
                        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">AI Assistant</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Online</p>
                                </div>
                            </div>
                        </div>

                        {/* Список сообщений */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot className="w-4 h-4 text-primary" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                            : 'bg-card text-foreground rounded-bl-md border border-border/50'
                                    }`}>
                                        {msg.role === 'assistant' ? (
                                            /* ИСПРАВЛЕНИЕ ОШИБКИ: className перенесен на div, а не на ReactMarkdown */
                                            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        ) : msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex gap-2 items-center">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Ввод сообщения */}
                        <div className="p-3 border-t border-border bg-background">
                            <form
                                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                                className="flex gap-2"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-muted/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}