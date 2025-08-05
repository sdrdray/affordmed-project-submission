import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import UrlForm from '../components/UrlForm';
import UrlResults from '../components/UrlResults';
import { ShortenedUrl, UrlCreationRequest } from '../types';
import { UrlStorageService } from '../utils/urlStorage';
import { Logger } from '../utils/logger';

const UrlShortenerPage: React.FC = () => {
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedUrl[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUrlCreation = async (requests: UrlCreationRequest[]) => {
    setLoading(true);
    const newUrls: ShortenedUrl[] = [];

    try {
      await Logger.info('page', `Processing ${requests.length} URL shortening requests`);

      for (const request of requests) {
        try {
          const shortenedUrl = await UrlStorageService.createShortenedUrl(request);
          newUrls.push(shortenedUrl);
        } catch (error) {
          await Logger.error('page', `Failed to create URL for ${request.originalUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          throw error;
        }
      }

      setShortenedUrls(newUrls);
      await Logger.info('page', `Successfully created ${newUrls.length} shortened URLs`);

    } catch (error) {
      await Logger.error('page', `URL creation process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          URL Shortener
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Shorten up to 5 URLs concurrently with custom options
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {/* URL Creation Form */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Create Shortened URLs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter up to 5 URLs to shorten. You can customize validity period and shortcode for each URL.
            </Typography>
            
            <UrlForm 
              onSubmit={handleUrlCreation}
              loading={loading}
            />
          </Paper>
        </Grid>

        {/* Results Display */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Shortened URLs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your shortened URLs will appear here after creation.
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <UrlResults 
              urls={shortenedUrls}
              loading={loading}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          How to use:
        </Typography>
        <Typography variant="body2" component="div">
          <Box component="ul" sx={{ pl: 2 }}>
            <li>Enter the original URL you want to shorten</li>
            <li>Optionally set a custom validity period (default: 30 minutes)</li>
            <li>Optionally provide a custom shortcode (3-20 alphanumeric characters)</li>
            <li>Click "Add URL" to add more URLs (up to 5 total)</li>
            <li>Click "Create Shortened URLs" to generate all short links</li>
            <li>Share your shortened URLs and track their usage in the Statistics page</li>
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
};

export default UrlShortenerPage;
