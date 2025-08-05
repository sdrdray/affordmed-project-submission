import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  Alert 
} from '@mui/material';
import { UrlStorageService } from '../utils/urlStorage';
import { Logger } from '../utils/logger';
import { isExpired } from '../utils/validation';

const RedirectHandler: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        await Logger.error('page', 'No shortcode provided for redirect');
        setError('Invalid URL');
        setLoading(false);
        return;
      }

      try {
        await Logger.info('page', `Processing redirect for shortcode: ${shortCode}`);
        
        const shortenedUrl = UrlStorageService.getUrlByShortCode(shortCode);
        
        if (!shortenedUrl) {
          await Logger.warn('page', `Shortcode not found: ${shortCode}`);
          setError('URL not found');
          setLoading(false);
          return;
        }

        // Check if URL has expired
        if (isExpired(shortenedUrl.expiresAt)) {
          await Logger.warn('page', `Attempted access to expired URL: ${shortCode}`);
          setError('This URL has expired');
          setLoading(false);
          return;
        }

        // Record the click
        const clickRecorded = await UrlStorageService.recordClick(shortCode, 'direct');
        
        if (clickRecorded) {
          await Logger.info('page', `Redirecting to: ${shortenedUrl.originalUrl}`);
          setRedirecting(true);
          
          // Small delay to show the redirect message
          setTimeout(() => {
            window.location.href = shortenedUrl.originalUrl;
          }, 1500);
        } else {
          await Logger.error('page', `Failed to record click for: ${shortCode}`);
          setError('Error processing redirect');
          setLoading(false);
        }
        
      } catch (error) {
        await Logger.error('page', `Redirect error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setError('An error occurred while processing the redirect');
        setLoading(false);
      }
    };

    handleRedirect();
  }, [shortCode]);

  if (loading && !redirecting) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">
            Processing your request...
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (redirecting) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Redirecting you now...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you are not automatically redirected, please check your browser settings.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1" gutterBottom>
            The URL you're looking for could not be found or has expired.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please check the URL and try again, or contact the person who shared this link.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Fallback - redirect to home
  return <Navigate to="/" replace />;
};

export default RedirectHandler;
