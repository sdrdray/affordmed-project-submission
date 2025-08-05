import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import App from './App.tsx';

// Initialize logging
console.log('URL Shortener application starting');

// RedirectHandler component for handling short URL redirects
function RedirectHandler() {
  const { shortCode } = useParams<{ shortCode: string }>();
  
  React.useEffect(() => {
    if (shortCode) {
      // Get URLs from localStorage
      try {
        const stored = localStorage.getItem('url_shortener_urls');
        if (stored) {
          const urls = JSON.parse(stored);
          const urlEntry = urls.find((url: any) => url.shortCode === shortCode);
          
          if (urlEntry) {
            const now = new Date();
            const expiresAt = new Date(urlEntry.expiresAt);
            
            if (now <= expiresAt) {
              // Update click count
              urlEntry.clickCount += 1;
              localStorage.setItem('url_shortener_urls', JSON.stringify(urls));
              
              // Redirect to original URL
              window.location.href = urlEntry.originalUrl;
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error processing redirect:', error);
      }
    }
  }, [shortCode]);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1>🔗 URL Not Found</h1>
      <p>The short URL you're looking for doesn't exist or has expired.</p>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <p><strong>Possible reasons:</strong></p>
        <ul style={{ textAlign: 'left' }}>
          <li>The URL has expired (default 30 minutes)</li>
          <li>The short code is incorrect</li>
          <li>The URL was never created</li>
        </ul>
      </div>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px',
          fontSize: '16px'
        }}
      >
        Go to URL Shortener
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/:shortCode" element={<RedirectHandler />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// Log successful render
console.log('URL Shortener application rendered successfully');
