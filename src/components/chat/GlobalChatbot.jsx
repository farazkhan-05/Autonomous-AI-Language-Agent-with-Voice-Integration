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
      // Secretly inject the latest progress context so the AI always knows how many lessons are completed
      const systemContext = `[Internal Context Update: The user has now completed ${completedLessons.length} lessons in total.]\n`;
      let result = await chatSession.sendMessage(systemContext + userMessage);
      
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
      <Box sx={{ position: 'fixed', bottom: { xs: 16, md: 24 }, right: { xs: 16, md: 24 }, zIndex: 1000 }}>
        {!isOpen && (
          <IconButton
            onClick={() => setIsOpen(true)}
            sx={{
              background: '#4ECDC4',
              color: '#1A1A1A',
              width: { xs: 52, md: 56 },
              height: { xs: 52, md: 56 },
              border: '3px solid #1A1A1A',
              boxShadow: '4px 4px 0px #1A1A1A',
              borderRadius: '14px',
              transition: 'all 0.15s ease',
              '&:hover': {
                background: '#5FE0D8',
                transform: 'translate(-2px, -2px)',
                boxShadow: '6px 6px 0px #1A1A1A',
              },
              '&:active': {
                transform: 'translate(4px, 4px)',
                boxShadow: '0px 0px 0px #1A1A1A',
              },
            }}
          >
            <Bot size={26} />
          </IconButton>
        )}
      </Box>

      {/* Chat Window */}
      <Fade in={isOpen}>
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            top: { xs: '56px', sm: 'auto' },
            bottom: { xs: 0, sm: 24 },
            right: { xs: 0, sm: 24 },
            width: { xs: '100%', sm: 360 },
            height: { xs: 'calc(100vh - 56px)', sm: 520 },
            maxHeight: '100vh',
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            zIndex: 1000,
            borderRadius: { xs: 0, sm: '16px' },
            overflow: 'hidden',
            background: darkMode ? '#252542' : '#FFFDF2',
            border: { xs: 'none', sm: `3px solid ${darkMode ? '#555' : '#1A1A1A'}` },
            boxShadow: { xs: 'none', sm: `6px 6px 0px ${darkMode ? '#000' : '#1A1A1A'}` },
          }}
        >

          {/* Header */}
          <Box
            sx={{
              background: '#4ECDC4',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#1A1A1A',
              borderBottom: `3px solid ${darkMode ? '#555' : '#1A1A1A'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ background: '#FFFFFF', p: 0.7, borderRadius: '8px', border: `2px solid #1A1A1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.2, fontSize: '0.9rem' }}>Lumi</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem', fontWeight: 700 }}>Your language buddy</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => setIsMuted(!isMuted)} size="small" sx={{ color: '#1A1A1A', mr: 0.5 }}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </IconButton>
              <IconButton 
                onClick={() => setIsOpen(false)} 
                sx={{ 
                  color: '#1A1A1A',
                  width: { xs: 36, sm: 28 },
                  height: { xs: 36, sm: 28 },
                }}
              >
                <X size={20} />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Area */}
          <Box sx={{ flex: 1, p: 1.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, backgroundColor: darkMode ? '#1A1A2E' : '#FFFDF2' }}>
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
                  <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: '#4ECDC4', border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', flexShrink: 0 }}>
                    <Bot size={14} />
                  </Box>
                )}
                <Box
                  sx={{
                    maxWidth: '82%',
                    p: 1.5,
                    borderRadius: '10px',
                    background: msg.role === 'user' ? '#FF6B6B' : (darkMode ? '#3A3A5C' : '#FFFFFF'),
                    color: msg.role === 'user' ? '#FFFFFF' : (darkMode ? '#F8FAFC' : '#1A1A1A'),
                    border: `2px solid ${darkMode ? '#555' : '#1A1A1A'}`,
                    boxShadow: `2px 2px 0px ${darkMode ? '#000' : '#1A1A1A'}`,
                    typography: 'body2',
                    lineHeight: 1.5,
                    fontSize: '0.8rem',
                    '& p': { m: 0, mb: 0.5, '&:last-child': { mb: 0 } },
                    '& ul, & ol': { m: 0, pl: 2, mb: 0.5 },
                    '& li': { mb: 0.25 },
                    '& strong': { fontWeight: 800, color: msg.role === 'user' ? 'white' : (darkMode ? '#FFE66D' : '#1A1A1A') }
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
                  <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: darkMode ? '#3A3A5C' : '#FFE66D', border: `2px solid ${darkMode ? '#555' : '#1A1A1A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', flexShrink: 0 }}>
                    <User size={14} />
                  </Box>
                )}
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: '#4ECDC4', border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', flexShrink: 0 }}>
                    <Bot size={14} />
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: '10px', background: darkMode ? '#3A3A5C' : '#FFFFFF', border: `2px solid ${darkMode ? '#555' : '#1A1A1A'}`, boxShadow: `2px 2px 0px ${darkMode ? '#000' : '#1A1A1A'}` }}>
                    <CircularProgress size={14} sx={{ color: '#4ECDC4' }} />
                  </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box component="form" onSubmit={handleSend} sx={{ p: 1.5, background: darkMode ? '#252542' : '#FFE66D', borderTop: `3px solid ${darkMode ? '#555' : '#1A1A1A'}`, display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton
              onClick={handleListen}
              disabled={isLoading || isListening}
              size="small"
              sx={{
                color: isListening ? '#FF6B6B' : (darkMode ? '#FFFFFF' : '#1A1A1A'),
                backgroundColor: isListening ? 'rgba(255, 107, 107, 0.15)' : 'transparent',
                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 107, 107, 0.7)' },
                  '70%': { transform: 'scale(1.1)', boxShadow: '0 0 0 8px rgba(255, 107, 107, 0)' },
                  '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 107, 107, 0)' }
                }
              }}
            >
              <Mic size={18} />
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
                  borderRadius: '10px',
                  backgroundColor: darkMode ? '#1A1A2E' : '#FFFFFF',
                  color: darkMode ? '#F8FAFC' : '#1A1A1A',
                  fontSize: '0.85rem',
                  '& fieldset': { border: `2px solid ${darkMode ? '#555' : '#1A1A1A'}` },
                },
                '& input': {
                  color: darkMode ? '#F8FAFC' : '#1A1A1A',
                  py: 1,
                }
              }}
            />
            <IconButton 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              sx={{ 
                background: '#FF6B6B', 
                color: '#FFFFFF',
                border: '2px solid #1A1A1A',
                boxShadow: '2px 2px 0px #1A1A1A',
                borderRadius: '10px',
                minWidth: '36px',
                height: '36px',
                transition: 'all 0.15s ease',
                '&:hover': { background: '#FF8787', transform: 'translate(-1px, -1px)', boxShadow: '3px 3px 0px #1A1A1A' },
                '&:active': { transform: 'translate(2px, 2px)', boxShadow: '0px 0px 0px #1A1A1A' },
                '&:disabled': { background: '#D1D5DB', color: '#9CA3AF', border: '2px solid #9CA3AF', boxShadow: 'none' }
              }}
            >
              <Send size={16} />
            </IconButton>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default GlobalChatbot;
