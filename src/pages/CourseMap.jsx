import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Button, Chip, LinearProgress } from '@mui/material';
import { Lock, Star, CheckCircle, Zap, Trophy, Flame, Sparkles, MapPin, Rocket } from 'lucide-react';

// Data & Context
import { courseData } from '../data/curriculum';
import { useProgress } from '../context/ProgressContext';

// Bright, happy color palette for lesson cards
const cardColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F97316'];

const CourseMap = () => {
  const navigate = useNavigate();
  const { completedLessons } = useProgress();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Calculate progress
  const progressPercent = Math.round((completedLessons.length / courseData.length) * 100);

  // Helper to determine lesson status
  const getLessonStatus = (lessonId, index) => {
    if (completedLessons.includes(lessonId)) return 'completed';
    const prevLessonId = index > 0 ? courseData[index - 1].id : null;
    if (index === 0 || completedLessons.includes(prevLessonId)) return 'active';
    return 'locked';
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            background: '#FF6B6B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid #1A1A1A',
            boxShadow: '4px 4px 0px #1A1A1A',
            mx: 'auto',
            mb: 2,
          }}
        >
          <MapPin size={28} color="#FFFFFF" strokeWidth={2.5} />
        </Box>

        <Typography 
          variant="h4" 
          sx={{ 
            mb: 0.5,
            fontWeight: 900,
            color: 'text.primary',
          }}
        >
          Tu Viaje Español 🌞
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2.5,
            color: 'text.secondary',
            fontWeight: 700,
            fontStyle: 'italic',
          }}
        >
          Una conversación a la vez ✨
        </Typography>

        {/* Progress Stats Card */}
        <Box
          sx={{
            background: '#FFE66D',
            borderRadius: '12px',
            padding: 2,
            border: '3px solid #1A1A1A',
            boxShadow: '4px 4px 0px #1A1A1A',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 1.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#FF6B6B' }}>
                {completedLessons.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 800, fontSize: '0.7rem' }}>
                Completadas
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#4ECDC4' }}>
                {courseData.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 800, fontSize: '0.7rem' }}>
                Total
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#A78BFA' }}>
                {progressPercent}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 800, fontSize: '0.7rem' }}>
                Progreso
              </Typography>
            </Box>
          </Box>

          <LinearProgress 
            variant="determinate" 
            value={progressPercent}
          />
        </Box>

        {/* Achievement Badges */}
        {completedLessons.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {completedLessons.length >= 1 && (
              <Chip 
                icon={<Flame size={14} />}
                label="Beginner"
                size="small"
                sx={{ 
                  background: '#FF6B6B',
                  color: 'white',
                  fontWeight: 800,
                  border: '2px solid #1A1A1A',
                  boxShadow: '2px 2px 0px #1A1A1A',
                }}
              />
            )}
            {completedLessons.length >= 5 && (
              <Chip 
                icon={<Zap size={14} />}
                label="On Fire"
                size="small"
                sx={{ 
                  background: '#FFE66D',
                  color: '#1A1A1A',
                  fontWeight: 800,
                  border: '2px solid #1A1A1A',
                  boxShadow: '2px 2px 0px #1A1A1A',
                }}
              />
            )}
            {completedLessons.length >= 10 && (
              <Chip 
                icon={<Trophy size={14} />}
                label="Champion"
                size="small"
                sx={{ 
                  background: '#4ECDC4',
                  color: '#1A1A1A',
                  fontWeight: 800,
                  border: '2px solid #1A1A1A',
                  boxShadow: '2px 2px 0px #1A1A1A',
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Lesson Cards List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {courseData.map((lesson, index) => {
          const status = getLessonStatus(lesson.id, index);
          const isLocked = status === 'locked';
          const isCompleted = status === 'completed';
          const isActive = status === 'active';
          const color = cardColors[index % cardColors.length];

          return (
            <Box
              key={lesson.id}
              onClick={() => !isLocked && navigate(`/lesson/${lesson.id}`)}
              onMouseEnter={() => setHoveredNode(lesson.id)}
              onMouseLeave={() => setHoveredNode(null)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: '12px',
                background: isLocked ? (darkMode => '#e5e7eb') : color,
                border: `3px solid ${isLocked ? '#9CA3AF' : '#1A1A1A'}`,
                boxShadow: isLocked ? 'none' : `4px 4px 0px #1A1A1A`,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
                transition: 'all 0.15s ease',
                transform: hoveredNode === lesson.id && !isLocked ? 'translate(-2px, -2px)' : 'translate(0, 0)',
                '&:hover': !isLocked ? {
                  boxShadow: '6px 6px 0px #1A1A1A',
                } : {},
                '&:active': !isLocked ? {
                  transform: 'translate(4px, 4px)',
                  boxShadow: '0px 0px 0px #1A1A1A',
                } : {},
              }}
            >
              {/* Number / Icon Circle */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: isLocked ? '#D1D5DB' : '#FFFFFF',
                  border: `2px solid ${isLocked ? '#9CA3AF' : '#1A1A1A'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  color: isLocked ? '#9CA3AF' : '#1A1A1A',
                }}
              >
                {isLocked ? <Lock size={20} /> : isCompleted ? <CheckCircle size={22} color="#00D9A3" /> : index + 1}
              </Box>

              {/* Lesson Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 900,
                    color: isLocked ? '#9CA3AF' : '#1A1A1A',
                    fontSize: '0.9rem',
                    lineHeight: 1.3,
                  }}
                >
                  {lesson.title}
                </Typography>
                {lesson.description && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: isLocked ? '#B0B0B0' : 'rgba(26,26,26,0.7)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'block',
                    }}
                  >
                    {lesson.description}
                  </Typography>
                )}
              </Box>

              {/* Status Badge */}
              {isCompleted && (
                <Chip
                  label="✅"
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.8rem',
                    background: '#FFFFFF',
                    border: '2px solid #1A1A1A',
                    fontWeight: 900,
                    minWidth: 0,
                  }}
                />
              )}
              {isActive && (
                <Chip
                  label="GO!"
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.72rem',
                    background: '#1A1A1A',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    border: '2px solid #1A1A1A',
                    boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  }}
                />
              )}
            </Box>
          );
        })}

        {/* Finish Line */}
        {progressPercent === 100 && (
          <Box
            sx={{
              textAlign: 'center',
              mt: 2,
              p: 2.5,
              background: '#FFE66D',
              borderRadius: '12px',
              border: '3px solid #1A1A1A',
              boxShadow: '4px 4px 0px #1A1A1A',
            }}
          >
            <Rocket size={40} color="#FF6B6B" strokeWidth={2.5} />
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 900, color: '#1A1A1A' }}>
              ¡Felicidades! 🎉
            </Typography>
            <Typography variant="body2" sx={{ color: '#1A1A1A', fontWeight: 700 }}>
              You've completed the journey!
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CourseMap;