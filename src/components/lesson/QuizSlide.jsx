import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { CheckCircle, XCircle, Target, Zap, AlertCircle, Lightbulb } from 'lucide-react';

const QuizSlide = ({ data, onNext }) => {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [status, setStatus] = useState('idle');
  const [shakeOption, setShakeOption] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setSelectedOptionIndex(null);
    setStatus('idle');
    setShakeOption(null);
    setAttempts(0);
    setShowHint(false);

    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [data.question]);

  const handleOptionClick = (index, isCorrect) => {
    if (status === 'correct') return;
    setSelectedOptionIndex(index);
    setAttempts(prev => prev + 1);

    if (isCorrect) {
      setStatus('correct');
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    } else {
      setStatus('wrong');
      setShakeOption(index);
      if (navigator.vibrate) navigator.vibrate(200);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      const timer = setTimeout(() => {
        setStatus('idle');
        setSelectedOptionIndex(null);
        setShakeOption(null);
        resetTimerRef.current = null;
      }, 800);
      resetTimerRef.current = timer;
      if (attempts >= 1) setShowHint(true);
    }
  };

  return (
    <Box sx={{ py: { xs: 1, md: 2 }, position: 'relative' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Chip
          icon={<Target size={14} color="#FFFFFF" />}
          label="Practice Quiz"
          sx={{
            mb: 1.5,
            background: '#A78BFA',
            border: '2px solid',
            borderColor: 'divider',
            fontWeight: 800,
            fontSize: '0.75rem',
            color: '#FFFFFF',
          }}
        />

        {/* Question Card */}
        <Box
          sx={{
            background: '#1A1A1A',
            borderRadius: '12px',
            p: { xs: 2, md: 2.5 },
            border: '3px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.5 }}
          >
            {data.question}
          </Typography>

          {/* Attempt dots */}
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 1.5 }}>
            {[...Array(3)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i < attempts
                    ? status === 'correct' && i === attempts - 1 ? '#4ECDC4' : '#FF6B6B'
                    : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Hint Card */}
      {showHint && status !== 'correct' && data.hint && (
        <Box
          sx={{
            background: '#FFE66D',
            borderRadius: '10px',
            p: 1.5,
            mb: 2,
            border: '2px solid',
            borderColor: 'divider',
            boxShadow: (theme) => `2px 2px 0px ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Lightbulb size={18} color="#1A1A1A" />
          <Typography variant="body2" sx={{ color: '#1A1A1A', fontWeight: 700, fontSize: '0.8rem' }}>
            Hint: {data.hint || "Think about common Spanish phrases!"}
          </Typography>
        </Box>
      )}

      {/* Options */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
        {data.options.map((option, idx) => {
          const isSelected = idx === selectedOptionIndex;
          const isCorrectOption = option.isCorrect;
          const isWrongShake = idx === shakeOption;

          let bgColor = 'background.paper';
          let textCol = 'text.primary';
          let icon = null;
          let isColoredBg = false;

          if (status === 'correct' && isSelected) {
            bgColor = '#4ECDC4';
            textCol = '#1A1A1A';
            icon = <CheckCircle size={20} color="#1A1A1A" />;
            isColoredBg = true;
          } else if (status === 'wrong' && isSelected) {
            bgColor = '#FF6B6B';
            textCol = '#FFFFFF';
            icon = <XCircle size={20} color="#FFFFFF" />;
            isColoredBg = true;
          }

          return (
            <Button
              key={idx}
              variant="contained"
              onClick={() => handleOptionClick(idx, isCorrectOption)}
              disabled={status === 'correct'}
              sx={{
                bgcolor: isColoredBg ? bgColor : 'background.paper',
                color: textCol,
                py: 1.5,
                px: 2,
                justifyContent: 'flex-start',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: '12px',
                border: '3px solid',
                borderColor: 'divider',
                boxShadow: (theme) => `3px 3px 0px ${theme.palette.divider}`,
                textAlign: 'left',
                textTransform: 'none',
                transition: 'all 0.15s ease',
                animation: isWrongShake ? 'shake 0.4s' : 'none',
                '&:hover:not(:disabled)': {
                  bgcolor: isColoredBg ? bgColor : 'background.default',
                  transform: 'translate(-2px, -2px)',
                  boxShadow: (theme) => `5px 5px 0px ${theme.palette.divider}`,
                },
                '&:active:not(:disabled)': {
                  transform: 'translate(3px, 3px)',
                  boxShadow: '0px 0px 0px transparent',
                },
                '&.Mui-disabled': {
                  opacity: status === 'correct' && !isSelected ? 0.4 : 1,
                  bgcolor: isColoredBg ? `${bgColor} !important` : 'background.paper',
                  color: `${textCol} !important`,
                  border: '3px solid',
                  borderColor: 'divider',
                },
                '@keyframes shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(-8px)' },
                  '75%': { transform: 'translateX(8px)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                {/* Option Letter Badge */}
                <Box
                  sx={{
                    width: 30, height: 30, borderRadius: '8px',
                    background: status === 'correct' && isSelected
                      ? 'rgba(255,255,255,0.4)'
                      : status === 'wrong' && isSelected
                      ? 'rgba(255,255,255,0.3)'
                      : '#A78BFA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '0.8rem', color: '#FFFFFF',
                    flexShrink: 0,
                    border: '2px solid', borderColor: 'divider',
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </Box>

                <Typography variant="body2" sx={{ flex: 1, fontWeight: 700, fontSize: '0.85rem', color: 'inherit' }}>
                  {option.text}
                </Typography>

                {icon && <Box sx={{ flexShrink: 0 }}>{icon}</Box>}
              </Box>
            </Button>
          );
        })}
      </Box>

      {/* Correct Feedback */}
      {status === 'correct' && (
        <Box>
          <Box
            sx={{
              background: '#4ECDC4',
              borderRadius: '10px',
              p: 1.5,
              mb: 2,
              border: '2px solid',
              borderColor: 'divider',
              boxShadow: (theme) => `2px 2px 0px ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CheckCircle size={18} color="#1A1A1A" />
            <Typography variant="body2" sx={{ color: '#1A1A1A', fontWeight: 700, fontSize: '0.8rem' }}>
              Perfecto! {data.feedback}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={onNext}
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
            <Zap size={18} style={{ marginLeft: 8 }} />
          </Button>
        </Box>
      )}

      {/* Wrong Feedback */}
      {status === 'wrong' && (
        <Box
          sx={{
            background: '#FF6B6B',
            borderRadius: '10px',
            p: 1.5,
            border: '2px solid',
            borderColor: 'divider',
            boxShadow: (theme) => `2px 2px 0px ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AlertCircle size={18} color="#FFFFFF" />
          <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem' }}>
            Not quite! Try again.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default QuizSlide;
