import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Fade, Container, Chip, LinearProgress } from '@mui/material';
import Confetti from 'react-confetti';
import { Trophy, Star, Zap, Home, Award, TrendingUp, Sparkles, Crown } from 'lucide-react';

const SuccessScreen = ({ onBackToMap }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [xpCount, setXpCount] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [particles, setParticles] = useState([]);

  const targetXP = 100;

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animate XP counter
  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const increment = targetXP / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetXP) {
        setXpCount(targetXP);
        clearInterval(timer);
        setShowStats(true);
      } else {
        setXpCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  // Generate floating achievement particles
  useEffect(() => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 3,
      emoji: ['🌟', '⭐', '✨', '💫', '🎉', '🏆', '👏', '🎊'][Math.floor(Math.random() * 8)],
      size: Math.random() * 1.5 + 1,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <Fade in={true} timeout={800}>
      <Box 
        sx={{ 
          position: 'fixed', 
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Mesh */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 30%, rgba(255, 107, 157, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(108, 99, 255, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255, 217, 61, 0.3) 0%, transparent 60%)
            `,
            animation: 'meshPulse 6s ease-in-out infinite',
            '@keyframes meshPulse': {
              '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
              '50%': { transform: 'scale(1.1) rotate(5deg)' },
            },
          }}
        />

        {/* Confetti Overlay */}
        <Confetti 
          width={windowSize.width} 
          height={windowSize.height} 
          recycle={false} 
          numberOfPieces={600}
          gravity={0.15}
          colors={['#FF6B9D', '#FFD93D', '#6C63FF', '#00D9A3', '#FFFFFF']}
        />

        {/* Floating Achievement Particles */}
        {particles.map((particle) => (
          <Box
            key={particle.id}
            sx={{
              position: 'absolute',
              left: `${particle.x}%`,
              bottom: `${particle.y}%`,
              fontSize: `${particle.size}rem`,
              animation: `floatUp ${particle.duration}s ease-out infinite`,
              animationDelay: `${particle.delay}s`,
              opacity: 0.8,
              pointerEvents: 'none',
              '@keyframes floatUp': {
                '0%': {
                  transform: 'translateY(0) rotate(0deg)',
                  opacity: 0,
                },
                '50%': {
                  opacity: 1,
                },
                '100%': {
                  transform: 'translateY(-100vh) rotate(360deg)',
                  opacity: 0,
                },
              },
            }}
          >
            {particle.emoji}
          </Box>
        ))}

        <Container maxWidth="md">
          {/* Main Trophy Icon with Glow */}
          <Box 
            sx={{ 
              mb: 4,
              position: 'relative',
              display: 'inline-block',
            }}
          >
            {/* Glow Rings */}
            {[0, 0.5, 1].map((delay, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  border: '4px solid rgba(255, 217, 61, 0.5)',
                  transform: 'translate(-50%, -50%)',
                  animation: `pulseRing 2s ease-out infinite`,
                  animationDelay: `${delay}s`,
                  '@keyframes pulseRing': {
                    '0%': {
                      transform: 'translate(-50%, -50%) scale(1)',
                      opacity: 1,
                    },
                    '100%': {
                      transform: 'translate(-50%, -50%) scale(2)',
                      opacity: 0,
                    },
                  },
                }}
              />
            ))}

            {/* Trophy Circle */}
            <Box
              sx={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD93D 0%, #FFC107 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `
                  0 0 60px rgba(255, 217, 61, 0.6),
                  0 20px 50px rgba(255, 193, 7, 0.4)
                `,
                animation: 'bounce 1.5s ease-in-out infinite',
                position: 'relative',
                '@keyframes bounce': {
                  '0%, 100%': { 
                    transform: 'translateY(0) scale(1)',
                  },
                  '50%': { 
                    transform: 'translateY(-20px) scale(1.05)',
                  },
                },
              }}
            >
              <Trophy size={80} color="white" strokeWidth={2.5} />
              
              {/* Sparkle Stars */}
              {[0, 90, 180, 270].map((angle, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translate(90px)`,
                    animation: `spin${i} 4s linear infinite`,
                    [`@keyframes spin${i}`]: {
                      '0%': { transform: `translate(-50%, -50%) rotate(${angle}deg) translate(90px) scale(1)` },
                      '50%': { transform: `translate(-50%, -50%) rotate(${angle + 180}deg) translate(90px) scale(1.3)` },
                      '100%': { transform: `translate(-50%, -50%) rotate(${angle + 360}deg) translate(90px) scale(1)` },
                    },
                  }}
                >
                  <Sparkles size={24} color="#FFFFFF" fill="#FFFFFF" />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Success Message */}
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 900,
              mb: 2,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FFD93D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(255, 217, 61, 0.3)',
              animation: 'fadeInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '@keyframes fadeInScale': {
                '0%': {
                  opacity: 0,
                  transform: 'scale(0.8) translateY(20px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'scale(1) translateY(0)',
                },
              },
            }}
          >
            ¡Lección Completada!
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 5,
              color: 'white',
              fontWeight: 600,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              fontStyle: 'italic',
              animation: 'fadeIn 1s ease-out 0.3s both',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              },
            }}
          >
            You're one step closer to fluency! 🚀
          </Typography>

          {/* XP Card */}
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: { xs: 3, md: 4 },
              mb: 4,
              boxShadow: `
                0 0 0 1px rgba(255, 255, 255, 0.5),
                0 20px 60px rgba(0, 0, 0, 0.3)
              `,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              animation: 'slideUp 0.8s ease-out 0.5s both',
              '@keyframes slideUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(40px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            {/* XP Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #6C63FF 0%, #A29BFE 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 32px rgba(108, 99, 255, 0.4)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '22px',
                    background: 'linear-gradient(135deg, #FF6B9D, #FFD93D, #6C63FF)',
                    zIndex: -1,
                    animation: 'rotate 3s linear infinite',
                    '@keyframes rotate': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  },
                }}
              >
                <Zap size={40} color="white" fill="white" />
              </Box>
            </Box>

            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 900,
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FFD93D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1,
                fontSize: { xs: '2.5rem', md: '3rem' },
              }}
            >
              +{xpCount} XP
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600, mb: 3 }}>
              Experience Points Earned
            </Typography>

            {/* Progress Bar */}
            <LinearProgress
              variant="determinate"
              value={(xpCount / targetXP) * 100}
              sx={{
                height: 12,
                borderRadius: '10px',
                background: 'rgba(108, 99, 255, 0.15)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #FF6B9D 0%, #FFD93D 100%)',
                  borderRadius: '10px',
                },
              }}
            />
          </Box>

          {/* Achievement Badges */}
          <Fade in={showStats} timeout={1000}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 5, flexWrap: 'wrap' }}>
              <Chip
                icon={<Star size={18} fill="#FFD93D" color="#FFD93D" />}
                label="Lesson Master"
                sx={{
                  background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.2) 0%, rgba(255, 193, 7, 0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 217, 61, 0.4)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  py: 2.5,
                  px: 1,
                }}
              />
              <Chip
                icon={<TrendingUp size={18} />}
                label="Progress Unlocked"
                sx={{
                  background: 'linear-gradient(135deg, rgba(0, 217, 163, 0.2) 0%, rgba(94, 255, 211, 0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(0, 217, 163, 0.4)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  py: 2.5,
                  px: 1,
                }}
              />
              <Chip
                icon={<Award size={18} />}
                label="Dedication"
                sx={{
                  background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.2) 0%, rgba(230, 62, 122, 0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 107, 157, 0.4)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  py: 2.5,
                  px: 1,
                }}
              />
            </Box>
          </Fade>

          {/* Back Button */}
          <Button 
            variant="contained"
            size="large"
            onClick={onBackToMap}
            sx={{
              px: 6,
              py: 2.5,
              fontSize: '1.2rem',
              fontWeight: 700,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F4FF 100%)',
              color: '#6C63FF',
              boxShadow: '0 12px 40px rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              '&:hover': {
                transform: 'translateY(-5px) scale(1.05)',
                boxShadow: '0 20px 60px rgba(255, 255, 255, 0.4)',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E8ECFF 100%)',
              },
            }}
          >
            <Home size={24} style={{ marginRight: 12 }} />
            Back to Journey Map
          </Button>
        </Container>
      </Box>
    </Fade>
  );
};

export default SuccessScreen;