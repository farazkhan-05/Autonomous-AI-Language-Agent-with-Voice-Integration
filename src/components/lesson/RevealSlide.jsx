import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Fade, Paper, Chip, CircularProgress } from '@mui/material';
import { Eye, Volume2, Sparkles, Lightbulb, ArrowRight, Star, Bot } from 'lucide-react';
import { explainGrammar } from '../../utils/gemini';

const RevealSlide = ({ data, onNext }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [particles, setParticles] = useState([]);
  const [soundWaves, setSoundWaves] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);

  const handleAskAi = async () => {
    try {
      setIsAiLoading(true);
      const result = await explainGrammar(data.answer, data.question);
      setAiExplanation(result);
    } catch (error) {
      console.error(error);
      setAiExplanation(error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Trigger celebration particles on reveal
  useEffect(() => {
    if (isRevealed) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 60,
        y: 50 + (Math.random() - 0.5) * 40,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.3,
        emoji: ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)],
      }));
      setParticles(newParticles);

      // Trigger sound wave animation
      setSoundWaves(true);
      setTimeout(() => setSoundWaves(false), 2000);
    }
  }, [isRevealed]);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  return (
    <Box 
      sx={{ 
        textAlign: 'center',
        py: { xs: 2, md: 3 },
        position: 'relative',
      }}
    >
      {/* Celebration Particles */}
      {particles.map((particle) => (
        <Box
          key={particle.id}
          sx={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: '1.5rem',
            opacity: 0,
            animation: `particleBurst 1.5s ease-out forwards`,
            animationDelay: `${particle.delay}s`,
            transform: `rotate(${particle.rotation}deg)`,
            pointerEvents: 'none',
            zIndex: 100,
            '@keyframes particleBurst': {
              '0%': {
                opacity: 0,
                transform: 'scale(0) rotate(0deg)',
              },
              '50%': {
                opacity: 1,
                transform: 'scale(1.5) rotate(180deg)',
              },
              '100%': {
                opacity: 0,
                transform: `scale(0.5) rotate(360deg) translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px)`,
              },
            },
          }}
        >
          {particle.emoji}
        </Box>
      ))}

      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Chip
          icon={<Star size={16} fill="#FFD93D" color="#FFD93D" />}
          label="Translation Challenge"
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.15) 0%, rgba(255, 217, 61, 0.15) 100%)',
            border: '2px solid rgba(255, 107, 157, 0.3)',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#FF6B9D',
          }}
        />
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 2,
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: { xs: '0.95rem', md: '1.1rem' },
          }}
        >
          How do you say in Spanish?
        </Typography>
        
        {/* English Question Card */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #6C63FF 0%, #A29BFE 100%)',
            borderRadius: '20px',
            padding: { xs: 3, md: 4 },
            mb: 4,
            boxShadow: '0 12px 32px rgba(108, 99, 255, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              color: 'white',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              fontSize: { xs: '1.5rem', md: '2rem' },
              lineHeight: 1.4,
              position: 'relative',
              '&::before': {
                content: '"\\201C"',
                position: 'absolute',
                left: -20,
                top: -10,
                fontSize: '3rem',
                opacity: 0.3,
                color: 'white',
              },
              '&::after': {
                content: '"\\201D"',
                position: 'absolute',
                right: -20,
                bottom: -20,
                fontSize: '3rem',
                opacity: 0.3,
                color: 'white',
              },
            }}
          >
            {data.question}
          </Typography>
        </Box>
      </Box>

      {/* Reveal Button / Answer Section */}
      {!isRevealed ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Pulsing Mystery Card */}
          <Box
            sx={{
              width: '100%',
              height: 120,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.1) 0%, rgba(255, 217, 61, 0.1) 100%)',
              border: '3px dashed rgba(255, 107, 157, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  borderColor: 'rgba(255, 107, 157, 0.4)',
                },
                '50%': {
                  transform: 'scale(1.02)',
                  borderColor: 'rgba(255, 217, 61, 0.6)',
                },
              },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'text.disabled',
                fontWeight: 700,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
              }}
            >
              ? ? ?
            </Typography>
          </Box>

          <Button 
            variant="contained"
            size="large"
            onClick={handleReveal}
            sx={{
              px: 5,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF6B9D 0%, #FFD93D 100%)',
              boxShadow: '0 8px 24px rgba(255, 107, 157, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                transition: 'left 0.5s ease',
              },
              '&:hover': {
                transform: 'translateY(-4px) scale(1.05)',
                boxShadow: '0 12px 32px rgba(255, 107, 157, 0.5)',
                '&::before': {
                  left: '100%',
                },
              },
              '&:active': {
                transform: 'translateY(-2px) scale(1.02)',
              },
            }}
          >
            <Eye size={24} style={{ marginRight: 12 }} />
            Reveal Spanish Answer
          </Button>

          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              fontSize: '0.85rem',
            }}
          >
            Think about it first, then tap to see! 💭
          </Typography>
        </Box>
      ) : (
        <Fade in={isRevealed} timeout={800}>
          <Box>
            {/* Spanish Answer Card with Flip Animation */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FFD93D 100%)',
                borderRadius: '24px',
                padding: { xs: 3, md: 4 },
                mb: 3,
                boxShadow: '0 16px 48px rgba(255, 107, 157, 0.4)',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'flipIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '@keyframes flipIn': {
                  '0%': {
                    transform: 'perspective(1000px) rotateY(-90deg)',
                    opacity: 0,
                  },
                  '100%': {
                    transform: 'perspective(1000px) rotateY(0deg)',
                    opacity: 1,
                  },
                },
              }}
            >
              {/* Sound Wave Rings */}
              {soundWaves && (
                <>
                  {[0, 0.3, 0.6].map((delay, i) => (
                    <Box
                      key={i}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '100%',
                        border: '3px solid rgba(255, 255, 255, 0.5)',
                        borderRadius: '24px',
                        transform: 'translate(-50%, -50%)',
                        animation: `soundWave 2s ease-out forwards`,
                        animationDelay: `${delay}s`,
                        '@keyframes soundWave': {
                          '0%': {
                            transform: 'translate(-50%, -50%) scale(1)',
                            opacity: 0.8,
                          },
                          '100%': {
                            transform: 'translate(-50%, -50%) scale(1.3)',
                            opacity: 0,
                          },
                        },
                      }}
                    />
                  ))}
                </>
              )}

              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 800,
                  color: 'white',
                  textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  fontSize: { xs: '2rem', md: '3rem' },
                  mb: 2,
                  letterSpacing: '-0.01em',
                }}
              >
                {data.answer}
              </Typography>
              
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <Volume2 size={20} color="white" />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white',
                    fontStyle: 'italic',
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    fontWeight: 600,
                  }}
                >
                  {data.pronunciation}
                </Typography>
              </Box>
            </Box>

            {/* Tip Section */}
            <Paper 
              elevation={0}
              sx={{ 
                background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(162, 155, 254, 0.05) 100%)',
                borderRadius: '20px',
                p: { xs: 2.5, md: 3 },
                mb: 4,
                border: '2px solid rgba(108, 99, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '5px',
                  height: '100%',
                  background: 'linear-gradient(180deg, #6C63FF 0%, #A29BFE 100%)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pl: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FFD93D 0%, #FFC107 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(255, 217, 61, 0.3)',
                  }}
                >
                  <Lightbulb size={22} color="white" fill="white" />
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: '#6C63FF',
                      fontWeight: 800,
                      mb: 0.5,
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Pro Tip
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.primary',
                      lineHeight: 1.7,
                      fontSize: { xs: '0.95rem', md: '1rem' },
                    }}
                  >
                    {data.explanation}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* AI Explanation Section */}
            {aiExplanation ? (
              <Paper 
                elevation={0}
                sx={{ 
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 203, 243, 0.05) 100%)',
                  borderRadius: '20px',
                  p: { xs: 2.5, md: 3 },
                  mb: 4,
                  border: '2px solid rgba(33, 150, 243, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '5px',
                    height: '100%',
                    background: 'linear-gradient(180deg, #2196F3 0%, #21CBF3 100%)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pl: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                    }}
                  >
                    <Bot size={22} color="white" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#2196F3', fontWeight: 800, mb: 0.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      AI Tutor Explanation
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.7, fontSize: { xs: '0.95rem', md: '1rem' }, whiteSpace: 'pre-wrap' }}>
                      {aiExplanation}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Button
                variant="outlined"
                onClick={handleAskAi}
                disabled={isAiLoading}
                fullWidth
                sx={{
                  py: 1.5,
                  mb: 3,
                  borderRadius: '16px',
                  borderWidth: '2px',
                  borderColor: 'rgba(33, 150, 243, 0.5)',
                  color: '#2196F3',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  '&:hover': {
                    borderWidth: '2px',
                    borderColor: '#2196F3',
                    background: 'rgba(33, 150, 243, 0.05)',
                  }
                }}
              >
                {isAiLoading ? <CircularProgress size={24} sx={{ color: '#2196F3' }} /> : <><Bot size={22} style={{ marginRight: 8 }} /> Ask AI to Explain Grammar</>}
              </Button>
            )}

            {/* Continue Button */}
            <Button 
              variant="contained"
              size="large"
              onClick={onNext}
              fullWidth
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6C63FF 0%, #A29BFE 100%)',
                boxShadow: '0 8px 24px rgba(108, 99, 255, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 32px rgba(108, 99, 255, 0.4)',
                  background: 'linear-gradient(135deg, #5A52E0 0%, #8B83E8 100%)',
                },
              }}
            >
              Continue Learning
              <ArrowRight size={24} style={{ marginLeft: 12 }} />
            </Button>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default RevealSlide;