import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const promptCopy = {
  'chat-limit': {
    title: 'Keep chatting with Lumi',
    message: 'You have used your 3 free chatbot messages. Sign in with Google to continue chatting and keep your progress safe.',
  },
  'save-progress': {
    title: 'Save your progress',
    message: 'Sign in with Google to unlock the next lessons and keep your Spanish journey synced across devices.',
  },
};

const SignInPromptModal = () => {
  const { signInPrompt, authError, isLoggingIn, closeSignInPrompt, login } = useAuth();
  const copy = promptCopy[signInPrompt] || promptCopy['save-progress'];

  const handleLogin = async () => {
    await login();
  };

  return (
    <Dialog
      open={Boolean(signInPrompt)}
      onClose={closeSignInPrompt}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '14px',
          border: '3px solid #1A1A1A',
          boxShadow: '6px 6px 0px #1A1A1A',
          background: '#FFFDF2',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: '#4ECDC4',
              border: '2px solid #1A1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={19} color="#1A1A1A" />
          </Box>
          <Typography sx={{ color: '#1A1A1A', fontWeight: 900, fontSize: '1.2rem' }}>
            {copy.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#1A1A1A', fontWeight: 700, lineHeight: 1.55 }}>
          {copy.message}
        </Typography>
        {authError && (
          <Typography
            sx={{
              mt: 1.5,
              color: '#B42318',
              fontWeight: 800,
              lineHeight: 1.4,
              fontSize: '0.9rem',
            }}
          >
            {authError}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={closeSignInPrompt}
          disabled={isLoggingIn}
          sx={{
            color: '#1A1A1A',
            fontWeight: 800,
            textTransform: 'none',
          }}
        >
          Not now
        </Button>
        <Button
          variant="contained"
          onClick={handleLogin}
          disabled={isLoggingIn}
          startIcon={<User size={16} />}
          sx={{
            background: '#FF6B6B',
            color: '#FFFFFF',
            border: '2px solid #1A1A1A',
            boxShadow: '3px 3px 0px #1A1A1A',
            borderRadius: '10px',
            fontWeight: 900,
            textTransform: 'none',
            '&:hover': {
              background: '#FF8787',
            },
          }}
        >
          {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignInPromptModal;
