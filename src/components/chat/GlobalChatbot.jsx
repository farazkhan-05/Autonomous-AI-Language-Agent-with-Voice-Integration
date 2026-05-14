import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, TextField, Typography, Paper, CircularProgress, Fade } from '@mui/material';
import { Bot, X, Send, User, Mic, Volume2, VolumeX } from 'lucide-react';
import { createTutorChat } from '../../utils/gemini';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';

const GlobalChatbot = ({ darkMode, onToggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch real-time context from Firebase
  const { user } = useAuth();
  const { completedLessons } = useProgress();

  // Text-to-Speech (TTS)
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    
    // Stop any current speech before starting new one
    window.speechSynthesis.cancel();
    
    // Remove markdown symbols to read cleaner
    const cleanText = text.replace(/[*_#`]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    // Try to find a Spanish voice
    const spanishVoice = voices.find(v => v.lang.startsWith('es-') || v.name.includes('Spanish'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    } else {
      utterance.lang = 'es-ES'; // Hint to browser
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text (STT)
  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES'; // Listen for Spanish or English
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    
    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  // Initialize chat session only when opened for the first time
  useEffect(() => {
    if (isOpen && !chatSession) {
      try {
        // Collect "RAG" context data
        const userData = {
          name: user?.displayName || user?.email?.split('@')[0] || "Amigo",
          completedLessonsCount: completedLessons.length
        };
        
        const session = createTutorChat(userData);
        setChatSession(session);
        // Display initial greeting (matches the pre-seeded history in gemini.js)
        setMessages([
          { role: 'model', text: `¡Hola ${userData.name}! 👋 I see you've knocked out ${userData.completedLessonsCount} lessons so far, nice work! I'm here to help you practice or translate whatever you need. Let's chat! What's on your mind? 😎` }
        ]);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([{ role: 'model', text: "Error connecting to AI. Please check your API key." }]);
      }
    }
  }, [isOpen, chatSession]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !chatSession) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      let result = await chatSession.sendMessage(userMessage);
      
      // Check if the AI wants to call a function
      const functionCalls = result.response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === "toggle_theme") {
            // 1. Actually trigger the UI change in React
            if (onToggleTheme) onToggleTheme();
            
            // 2. Tell the AI that the function was successfully executed
            result = await chatSession.sendMessage([{
              functionResponse: {
                name: "toggle_theme",
                response: { status: "success", action: "theme toggled" }
              }
            }]);
          }
        }
      }

      // Display the AI's final text response
      const responseText = result.response.text();
      if (responseText) {
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Box sx={{ position: 'fixed', bottom: { xs: 20, md: 30 }, right: { xs: 20, md: 30 }, zIndex: 1000 }}>
        {!isOpen && (
          <IconButton
            onClick={() => setIsOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #A29BFE 100%)',
              color: 'white',
              width: { xs: 56, md: 64 },
              height: { xs: 56, md: 64 },
              boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1) rotate(5deg)',
                background: 'linear-gradient(135deg, #5A52E0 0%, #8B83E8 100%)',
                boxShadow: '0 12px 40px rgba(108, 99, 255, 0.6)',
              }
            }}
          >
            <Bot size={32} />
          </IconButton>
        )}
      </Box>

      {/* Chat Window */}
      <Fade in={isOpen}>
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            bottom: { xs: 0, sm: 30 },
            right: { xs: 0, sm: 30 },
            width: { xs: '100%', sm: 380 },
            height: { xs: '100%', sm: 600 },
            maxHeight: '100vh',
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            zIndex: 1000,
            borderRadius: { xs: 0, sm: '24px' },
            overflow: 'hidden',
            background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #A29BFE 100%)',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px' }}>
                <Bot size={24} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>SpanishAmigo</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>AI Language Tutor</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => setIsMuted(!isMuted)} sx={{ color: 'white', mr: 1 }}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </IconButton>
              <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                <X size={24} />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Area */}
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: darkMode ? '#0F172A' : '#f8f9fa' }}>
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1
                }}
              >
                {msg.role === 'model' && (
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF 0%, #A29BFE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <Bot size={18} />
                  </Box>
                )}
                <Box
                  sx={{
                    maxWidth: '85%',
                    p: 2,
                    borderRadius: '16px',
                    borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderTopLeftRadius: msg.role === 'model' ? '4px' : '16px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB5 100%)' : (darkMode ? '#1E293B' : 'white'),
                    color: msg.role === 'user' ? 'white' : (darkMode ? '#F8FAFC' : '#2D3748'),
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    typography: 'body2',
                    lineHeight: 1.6,
                    '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
                    '& ul, & ol': { m: 0, pl: 2.5, mb: 1 },
                    '& li': { mb: 0.5 },
                    '& strong': { fontWeight: 700, color: msg.role === 'user' ? 'white' : (darkMode ? 'white' : '#1A202C') }
                  }}
                >
                  {msg.role === 'model' ? (
                    <Box sx={{ position: 'relative', pr: 3 }}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      <IconButton 
                        onClick={() => speakText(msg.text)} 
                        size="small" 
                        sx={{ position: 'absolute', top: -8, right: -16, color: '#A0AEC0', '&:hover': { color: '#6C63FF' } }}
                      >
                        <Volume2 size={16} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Box>
                  )}
                </Box>
                {msg.role === 'user' && (
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: darkMode ? '#334155' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#CBD5E1' : '#4A5568', flexShrink: 0 }}>
                    <User size={18} />
                  </Box>
                )}
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF 0%, #A29BFE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <Bot size={18} />
                  </Box>
                  <Box sx={{ p: 2, borderRadius: '16px', borderTopLeftRadius: '4px', background: darkMode ? '#1E293B' : 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CircularProgress size={16} sx={{ color: '#6C63FF' }} />
                  </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box component="form" onSubmit={handleSend} sx={{ p: 2, background: darkMode ? '#1E293B' : 'white', borderTop: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #EDF2F7', display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton
              onClick={handleListen}
              disabled={isLoading || isListening}
              sx={{
                color: isListening ? '#FF6B9D' : '#A0AEC0',
                backgroundColor: isListening ? 'rgba(255, 107, 157, 0.1)' : 'transparent',
                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 107, 157, 0.7)' },
                  '70%': { transform: 'scale(1.1)', boxShadow: '0 0 0 10px rgba(255, 107, 157, 0)' },
                  '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 107, 157, 0)' }
                }
              }}
            >
              <Mic size={22} />
            </IconButton>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  backgroundColor: darkMode ? '#0F172A' : '#F7FAFC',
                  color: darkMode ? '#F8FAFC' : '#1A202C',
                },
                '& input': {
                  color: darkMode ? '#F8FAFC' : '#1A202C',
                }
              }}
            />
            <IconButton 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              sx={{ 
                background: 'linear-gradient(135deg, #6C63FF 0%, #A29BFE 100%)', 
                color: 'white',
                minWidth: '40px',
                height: '40px',
                '&:hover': { background: '#5A52E0' },
                '&:disabled': { background: '#E2E8F0', color: '#A0AEC0' }
              }}
            >
              <Send size={20} />
            </IconButton>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default GlobalChatbot;
