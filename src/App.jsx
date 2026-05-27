import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { AuthProvider } from './context/AuthContext'; // <--- NEW IMPORT
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './theme/theme';

import Layout from './components/layout/Layout';
import CourseMap from './pages/CourseMap';
import LessonPlayer from './pages/LessonPlayer';

const readStoredDarkMode = () => {
  const saved = localStorage.getItem('darkMode');
  if (!saved) return false;

  try {
    return JSON.parse(saved) === true;
  } catch {
    localStorage.removeItem('darkMode');
    return false;
  }
};

function App() {
  // (Your existing Dark Mode logic stays exactly the same)
  const [darkMode, setDarkMode] = useState(readStoredDarkMode);

  const theme = createAppTheme(darkMode ? 'dark' : 'light');

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider> {/* <--- WRAPPER ADDED HERE */}
        <ProgressProvider>
          <BrowserRouter>
            <Layout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
              <Routes>
                <Route path="/" element={<CourseMap />} />
                <Route path="/lesson/:id" element={<LessonPlayer />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ProgressProvider>
      </AuthProvider> {/* <--- CLOSE WRAPPER HERE */}
    </ThemeProvider>
  );
}

export default App;
