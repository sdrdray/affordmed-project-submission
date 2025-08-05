import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Paper, Container } from '@mui/material';

const HomePage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🔗 URL Shortener
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the URL Shortener application!
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          The application is running successfully on localhost:3000
        </Typography>
      </Paper>
    </Container>
  );
};

function App() {
  return (
    <Router>
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
