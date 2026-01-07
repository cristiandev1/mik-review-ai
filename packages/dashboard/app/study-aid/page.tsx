// TODO: Remover - Study Aid Module
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Bot, User, BookOpen, Loader2, Timer } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function StudyAidPage() {
  const [started, setStarted] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [timerActive, setTimerActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleTimeout();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeout = async () => {
    setIsLoading(true);
    // Add a system-like message to UI to inform user
    setMessages((prev) => [...prev, { 
      role: "system", 
      content: "Tempo esgotado! Solicitando resposta..." 
    }]);

    try {
      // Send hidden trigger message to AI
      const timeoutMessages = [
        ...messages,
        { role: "user", content: "TIMEOUT_REACHED" } as Message
      ];

      const response = await api.post("/study-aid/chat", {
        messages: timeoutMessages
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.content
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to handle timeout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!questionInput.trim()) return;

    const initialMessages: Message[] = [
      { role: "user", content: questionInput }
    ];

    setMessages(initialMessages);
    setStarted(true);
    setIsLoading(true);
    setTimerActive(true);
    setTimeLeft(180); // Reset timer

    try {
      const response = await api.post("/study-aid/chat", {
        messages: initialMessages
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.content
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to start study session:", error);
      // Optional: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const newMessages = [
      ...messages,
      { role: "user", content: chatInput } as Message
    ];

    setMessages(newMessages);
    setChatInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/study-aid/chat", {
        messages: newMessages
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.content
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Medical Study Ai
          </h1>
          <p className="text-gray-500 mt-2">
            Seu tutor para questões de medicina.
          </p>
        </div>

        {!started ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Nova Sessão de Estudo</CardTitle>
              <CardDescription>
                Cole a questão da prova e as alternativas abaixo para começar.
                A IA irá guiá-lo até a resposta correta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Paciente de 45 anos chega ao PS com...
A) Diagnóstico X
B) Diagnóstico Y..."
                className="min-h-[200px] text-base"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                size="lg" 
                onClick={handleStart} 
                disabled={!questionInput.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  "Iniciar Estudo"
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full h-[70vh] flex flex-col">
            <CardHeader className="border-b py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>Sessão Ativa</span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-mono px-2 py-1 rounded bg-gray-100",
                    timeLeft < 60 && "text-red-600 bg-red-50",
                    timeLeft === 0 && "text-gray-500"
                  )}>
                    <Timer className="h-4 w-4" />
                    {formatTime(timeLeft)}
                  </div>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                  Nova Questão
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex w-full gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start",
                    msg.role === "system" && "justify-center"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 text-sm",
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : msg.role === "system"
                        ? "bg-yellow-100 text-yellow-800 italic text-center text-xs py-1 px-4"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown 
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex w-full gap-2 justify-start">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="flex w-full gap-2">
                <Input
                  placeholder="Digite sua resposta ou dúvida..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!chatInput.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
