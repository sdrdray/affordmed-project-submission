import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  Schedule as ScheduleIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { ShortenedUrl } from '../types';
import { formatDate, isExpired } from '../utils/validation';
import { Logger } from '../utils/logger';

interface UrlResultsProps {
  urls: ShortenedUrl[];
  loading: boolean;
}

const UrlResults: React.FC<UrlResultsProps> = ({ urls, loading }) => {
  const [copiedUrl, setCopiedUrl] = useState<string>('');

  const copyToClipboard = async (url: string, shortCode: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(shortCode);
      await Logger.info('component', `Copied URL to clipboard: ${shortCode}`);
      
      // Clear the copied indicator after 2 seconds
      setTimeout(() => setCopiedUrl(''), 2000);
    } catch (error) {
      await Logger.error('component', `Failed to copy URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const openUrl = async (url: string, shortCode: string) => {
    try {
      window.open(url, '_blank');
      await Logger.info('component', `Opened shortened URL: ${shortCode}`);
    } catch (error) {
      await Logger.error('component', `Failed to open URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Creating your shortened URLs...
        </Typography>
      </Box>
    );
  }

  if (urls.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No URLs created yet. Fill out the form and click "Create Shortened URLs" to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {urls.map((url, index) => (
        <Card 
          key={url.id} 
          variant="outlined"
          sx={{ 
            backgroundColor: isExpired(url.expiresAt) ? 'grey.50' : 'background.paper',
            opacity: isExpired(url.expiresAt) ? 0.7 : 1
          }}
        >
          <CardContent>
            {/* URL Index */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                URL #{index + 1}
              </Typography>
              
              {isExpired(url.expiresAt) && (
                <Chip 
                  label="Expired" 
                  color="error" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Box>

            {/* Original URL */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <LinkIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Original URL
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  wordBreak: 'break-all',
                  color: isExpired(url.expiresAt) ? 'text.disabled' : 'text.primary'
                }}
              >
                {url.originalUrl}
              </Typography>
            </Box>

            {/* Shortened URL */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Shortened URL
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: 'grey.100', 
                borderRadius: 1, 
                p: 1,
                border: 1,
                borderColor: 'grey.300'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flexGrow: 1, 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: isExpired(url.expiresAt) ? 'text.disabled' : 'primary.main'
                  }}
                >
                  {url.shortUrl}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title={copiedUrl === url.shortCode ? 'Copied!' : 'Copy URL'}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(url.shortUrl, url.shortCode)}
                      disabled={isExpired(url.expiresAt)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Open URL">
                    <IconButton
                      size="small"
                      onClick={() => openUrl(url.shortUrl, url.shortCode)}
                      disabled={isExpired(url.expiresAt)}
                    >
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* URL Details */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Created: {formatDate(url.createdAt)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Expires: {formatDate(url.expiresAt)}
                </Typography>
              </Box>

              {url.customShortcode && (
                <Chip 
                  label="Custom" 
                  size="small" 
                  variant="outlined" 
                  color="primary"
                />
              )}
              
              <Chip 
                label={`${url.validityMinutes} min`} 
                size="small" 
                variant="outlined"
              />
            </Box>

            {/* Success Message */}
            {!isExpired(url.expiresAt) && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  URL successfully shortened! Share the link above or track its usage in the Statistics page.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default UrlResults;
