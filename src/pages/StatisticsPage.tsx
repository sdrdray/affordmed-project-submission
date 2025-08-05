import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Launch as LaunchIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { ShortenedUrl, ClickData } from '../types';
import { UrlStorageService } from '../utils/urlStorage';
import { formatDate, isExpired } from '../utils/validation';
import { Logger } from '../utils/logger';

const StatisticsPage: React.FC = () => {
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<ShortenedUrl | null>(null);
  const [clickData, setClickData] = useState<ClickData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string>('');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      await Logger.info('page', 'Loading URL statistics');
      const allUrls = UrlStorageService.getAllUrls();
      setUrls(allUrls);
      await Logger.info('page', `Loaded ${allUrls.length} URLs for statistics`);
    } catch (error) {
      await Logger.error('page', `Failed to load statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewDetails = async (url: ShortenedUrl) => {
    try {
      await Logger.info('page', `Viewing click details for: ${url.shortCode}`);
      const clicks = UrlStorageService.getClicksForShortCode(url.shortCode);
      setSelectedUrl(url);
      setClickData(clicks);
      setDialogOpen(true);
    } catch (error) {
      await Logger.error('page', `Failed to load click details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const copyToClipboard = async (url: string, shortCode: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(shortCode);
      await Logger.info('page', `Copied URL to clipboard from statistics: ${shortCode}`);
      
      setTimeout(() => setCopiedUrl(''), 2000);
    } catch (error) {
      await Logger.error('page', `Failed to copy URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const openUrl = async (url: string, shortCode: string) => {
    try {
      // Record click before opening
      await UrlStorageService.recordClick(shortCode, 'statistics');
      window.open(url, '_blank');
      await Logger.info('page', `Opened URL from statistics: ${shortCode}`);
      
      // Refresh statistics to show updated click count
      loadStatistics();
    } catch (error) {
      await Logger.error('page', `Failed to open URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUrl(null);
    setClickData([]);
  };

  const getStatusChip = (url: ShortenedUrl) => {
    if (isExpired(url.expiresAt)) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  return (
    <Box>
      {/* Page Header */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              URL Statistics
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track usage and performance of your shortened URLs
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadStatistics}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Statistics Table */}
      {urls.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              No URLs found
            </Typography>
            <Typography variant="body1">
              Create some shortened URLs first to see statistics here.
            </Typography>
          </Alert>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Short URL</TableCell>
                <TableCell>Original URL</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Clicks</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {urls.map((url) => (
                <TableRow key={url.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          color: 'primary.main',
                          fontWeight: 500
                        }}
                      >
                        /{url.shortCode}
                      </Typography>
                      
                      {url.customShortcode && (
                        <Chip label="Custom" size="small" variant="outlined" color="primary" />
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={url.originalUrl}
                    >
                      {url.originalUrl}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusChip(url)}
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="h6" color="primary">
                      {url.clickCount}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(url.createdAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography 
                      variant="body2"
                      color={isExpired(url.expiresAt) ? 'error' : 'text.primary'}
                    >
                      {formatDate(url.expiresAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title={copiedUrl === url.shortCode ? 'Copied!' : 'Copy URL'}>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(url.shortUrl, url.shortCode)}
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
                      
                      <Tooltip title="View Click Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(url)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Click Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Click Details for /{selectedUrl?.shortCode}
        </DialogTitle>
        
        <DialogContent>
          {selectedUrl && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Original URL:
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 2 }}>
                {selectedUrl.originalUrl}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Total Clicks: {selectedUrl.clickCount}
              </Typography>
            </Box>
          )}

          {clickData.length === 0 ? (
            <Alert severity="info">
              No clicks recorded for this URL yet.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clickData.map((click) => (
                    <TableRow key={click.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(click.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={click.source} 
                          size="small" 
                          variant="outlined"
                          color={click.source === 'direct' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {click.location}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StatisticsPage;
