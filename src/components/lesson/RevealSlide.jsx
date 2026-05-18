import React, { useState } from 'react';
import { Box, Typography, Button, Fade, Chip, CircularProgress } from '@mui/material';
import { Eye, Volume2, Lightbulb, ArrowRight, Bot } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000";

const RevealSlide = ({ data, onNext }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);

  const handleAskAi = async () => {
    try {
      setIsAiLoading(true);
      const response = await fetch(`${API_BASE_URL}/chat/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spanish_sentence: data.answer,
          english_translation: data.question
        })
      });
      if (!response.ok) throw new Error("Failed to get grammatical explanation from server.");
      const result = await response.json();
      setAiExplanation(result.explanation);
    } catch (error) {
      console.error(error);
      setAiExplanation("Lo siento, I could not generate an explanation at this moment. Please check your connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Chip
        label="Translation Challenge"
        sx={{
          mb: 1.5,
          background: '#FFE66D',
          border: '2px solid',
          borderColor: 'divider',
          fontWeight: 800,
          fontSize: '0.75rem',
          color: '#1A1A1A',
        }}
      />

      <Typography
        variant="body2"
        sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 700, fontSize: '0.85rem' }}
      >
        How do you say in Spanish?
      </Typography>

      {/* English Question Card */}
      <Box
        sx={{
          background: '#A78BFA',
          borderRadius: '12px',
          p: { xs: 2, md: 2.5 },
          mb: 2,
          border: '3px solid',
          borderColor: 'divider',
          boxShadow: (theme) => `4px 4px 0px ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: { xs: '1.2rem', md: '1.5rem' }, lineHeight: 1.4 }}
        >
          {data.question}
        </Typography>
      </Box>

      {/* Reveal Button / Answer Section */}
      {!isRevealed ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          {/* Mystery Card */}
          <Box
            sx={{
              width: '100%',
              py: 2.5,
              borderRadius: '12px',
              background: 'transparent',
              border: '3px dashed',
              borderColor: 'text.disabled',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '1.1rem' }}>
              ? ? ?
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => setIsRevealed(true)}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 800,
              borderRadius: '12px',
              background: '#FF6B6B',
              color: '#FFFFFF',
              border: '3px solid',
              borderColor: 'divider',
              boxShadow: (theme) => `4px 4px 0px ${theme.palette.divider}`,
              textTransform: 'uppercase',
              '&:hover': { background: '#FF8787' },
            }}
          >
            <Eye size={20} style={{ marginRight: 8 }} />
            Reveal Answer
          </Button>

          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.8rem' }}>
            Think about it first, then tap to see!
          </Typography>
        </Box>
      ) : (
        <Fade in={isRevealed} timeout={300}>
          <Box>
            {/* Spanish Answer Card */}
            <Box
              sx={{
                background: '#4ECDC4',
                borderRadius: '12px',
                p: { xs: 2, md: 2.5 },
                mb: 2,
                border: '3px solid',
                borderColor: 'divider',
                boxShadow: (theme) => `4px 4px 0px ${theme.palette.divider}`,
              }}
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, color: '#1A1A1A', fontSize: { xs: '1.5rem', md: '2rem' }, mb: 1 }}
              >
                {data.answer}
              </Typography>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  px: 1.5,
                  py: 0.5,
                  border: '2px solid #1A1A1A',
                }}
              >
                <Volume2 size={16} color="#1A1A1A" />
                <Typography
                  variant="body2"
                  sx={{ color: '#1A1A1A', fontStyle: 'italic', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  {data.pronunciation}
                </Typography>
              </Box>
            </Box>

            {/* Tip Section */}
            <Box
              sx={{
                background: '#FFE66D',
                borderRadius: '12px',
                p: 2,
                mb: 2,
                border: '3px solid',
                borderColor: 'divider',
                boxShadow: (theme) => `3px 3px 0px ${theme.palette.divider}`,
                textAlign: 'left',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '2px solid #1A1A1A',
                  }}
                >
                  <Lightbulb size={18} color="#1A1A1A" />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#1A1A1A', fontWeight: 900, mb: 0.25, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}
                  >
                    Pro Tip
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#1A1A1A', lineHeight: 1.5, fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {data.explanation}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* AI Explanation Section */}
            {aiExplanation ? (
              <Box
                sx={{
                  background: '#87CEEB',
                  borderRadius: '12px',
                  p: 2,
                  mb: 2,
                  border: '3px solid',
                  borderColor: 'divider',
                  boxShadow: (theme) => `3px 3px 0px ${theme.palette.divider}`,
                  textAlign: 'left',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: '8px',
                      background: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, border: '2px solid #1A1A1A',
                    }}
                  >
                    <Bot size={18} color="#1A1A1A" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 900, mb: 0.25, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                      Lumi Explains
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1A1A1A', lineHeight: 1.5, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'pre-wrap' }}>
                      {aiExplanation}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Button
                variant="outlined"
                onClick={handleAskAi}
                disabled={isAiLoading}
                fullWidth
                sx={{
                  py: 1.2, mb: 2, borderRadius: '12px',
                  border: '3px solid', borderColor: 'divider',
                  boxShadow: (theme) => `3px 3px 0px ${theme.palette.divider}`,
                  color: 'text.primary', bgcolor: 'background.paper',
                  fontWeight: 800, fontSize: '0.85rem', textTransform: 'none',
                  '&:hover': { bgcolor: 'background.default', borderColor: 'divider' },
                  '&.Mui-disabled': { opacity: 0.6 },
                }}
              >
                {isAiLoading
                  ? <CircularProgress size={20} sx={{ color: 'text.primary' }} />
                  : <><Bot size={18} style={{ marginRight: 8 }} /> Ask Lumi to Explain</>
                }
              </Button>
            )}

            {/* Continue Button */}
            <Button
              variant="contained"
              size="large"
              onClick={onNext}
              fullWidth
              sx={{
                py: 1.5, fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px',
                background: '#A78BFA', color: '#FFFFFF',
                border: '3px solid', borderColor: 'divider',
                boxShadow: (theme) => `4px 4px 0px ${theme.palette.divider}`,
                textTransform: 'uppercase',
                '&:hover': { background: '#8B6FE0' },
              }}
            >
              Continue
              <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </Button>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default RevealSlide;