import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Box, 
  Chip, 
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  CssBaseline
} from '@mui/material';
import { 
  ContentCopy as CopyIcon, 
  Launch as LaunchIcon,
  Add as AddIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Log } from './utils/logger.ts';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Types
interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: Date;
  expiresAt: Date;
  customShortcode?: string;
  validityMinutes: number;
  clickCount: number;
  isExpired: boolean;
}

interface UrlFormData {
  originalUrl: string;
  validityMinutes: string;
  customShortcode: string;
}

// Utility functions
const generateShortcode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const isValidUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isExpired = (expiresAt: Date) => new Date() > expiresAt;

// Storage service
class UrlStorageService {
  private static STORAGE_KEY = 'url_shortener_urls';

  static getAllUrls(): ShortenedUrl[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored).map((url: any) => ({
        ...url,
        createdAt: new Date(url.createdAt),
        expiresAt: new Date(url.expiresAt),
        isExpired: isExpired(new Date(url.expiresAt))
      }));
    } catch {
      return [];
    }
  }

  static saveUrls(urls: ShortenedUrl[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(urls));
    } catch (error) {
      console.error('Failed to save URLs:', error);
    }
  }

  static createShortenedUrl(originalUrl: string, validityMinutes?: number, customShortcode?: string): ShortenedUrl {
    const existingUrls = this.getAllUrls();
    
    let shortCode = customShortcode || generateShortcode();
    
    // Ensure uniqueness
    while (existingUrls.some(url => url.shortCode === shortCode)) {
      if (customShortcode) {
        throw new Error('Custom shortcode already exists');
      }
      shortCode = generateShortcode();
    }
    
    const now = new Date();
    const validity = validityMinutes || 30;
    const expiresAt = new Date(now.getTime() + validity * 60 * 1000);
    
    const shortenedUrl: ShortenedUrl = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalUrl: originalUrl.trim(),
      shortCode,
      shortUrl: `http://localhost:3000/${shortCode}`,
      createdAt: now,
      expiresAt,
      customShortcode,
      validityMinutes: validity,
      clickCount: 0,
      isExpired: false
    };
    
    existingUrls.push(shortenedUrl);
    this.saveUrls(existingUrls);
    
    return shortenedUrl;
  }

  static recordClick(shortCode: string) {
    const urls = this.getAllUrls();
    const urlIndex = urls.findIndex(u => u.shortCode === shortCode);
    
    if (urlIndex !== -1 && !isExpired(urls[urlIndex].expiresAt)) {
      urls[urlIndex].clickCount += 1;
      this.saveUrls(urls);
      return urls[urlIndex].originalUrl;
    }
    return null;
  }
}

function AppContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [forms, setForms] = useState<UrlFormData[]>([
    { originalUrl: '', validityMinutes: '', customShortcode: '' }
  ]);
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedUrl[]>([]);
  const [allUrls, setAllUrls] = useState<ShortenedUrl[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');

  // Load existing URLs on mount
  useEffect(() => {
    setAllUrls(UrlStorageService.getAllUrls());
    Log('frontend', 'info', 'page', 'Application loaded with ' + UrlStorageService.getAllUrls().length + ' existing URLs');
  }, []);

  // Handle URL shortening
  const handleCreateUrls = async () => {
    setLoading(true);
    setErrors([]);
    const newUrls: ShortenedUrl[] = [];
    const newErrors: string[] = [];

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      
      if (!form.originalUrl.trim()) continue;
      
      // Validate
      if (!isValidUrl(form.originalUrl)) {
        newErrors.push(`URL ${i + 1}: Invalid URL format`);
        continue;
      }
      
      if (form.validityMinutes && (!Number.isInteger(Number(form.validityMinutes)) || Number(form.validityMinutes) <= 0)) {
        newErrors.push(`URL ${i + 1}: Invalid validity period`);
        continue;
      }
      
      if (form.customShortcode && (form.customShortcode.length < 3 || !/^[a-zA-Z0-9]+$/.test(form.customShortcode))) {
        newErrors.push(`URL ${i + 1}: Invalid shortcode`);
        continue;
      }

      try {
        const shortened = UrlStorageService.createShortenedUrl(
          form.originalUrl,
          form.validityMinutes ? Number(form.validityMinutes) : undefined,
          form.customShortcode || undefined
        );
        newUrls.push(shortened);
        Log('frontend', 'info', 'component', 'URL shortened successfully: ' + shortened.shortCode);
      } catch (error) {
        newErrors.push(`URL ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        Log('frontend', 'error', 'component', 'URL shortening failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

    setErrors(newErrors);
    setShortenedUrls(newUrls);
    setAllUrls(UrlStorageService.getAllUrls());
    
    if (newUrls.length > 0) {
      setForms([{ originalUrl: '', validityMinutes: '', customShortcode: '' }]);
    }
    
    setLoading(false);
  };

  // Add new form
  const addForm = () => {
    if (forms.length < 5) {
      setForms([...forms, { originalUrl: '', validityMinutes: '', customShortcode: '' }]);
    }
  };

  // Remove form
  const removeForm = (index: number) => {
    if (forms.length > 1) {
      setForms(forms.filter((_, i) => i !== index));
    }
  };

  // Update form
  const updateForm = (index: number, field: keyof UrlFormData, value: string) => {
    const newForms = [...forms];
    newForms[index][field] = value;
    setForms(newForms);
  };

  // Copy to clipboard
  const copyToClipboard = async (url: string, shortCode: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(shortCode);
      setTimeout(() => setCopiedUrl(''), 2000);
      Log('frontend', 'info', 'component', 'URL copied to clipboard: ' + shortCode);
    } catch (error) {
      console.error('Failed to copy:', error);
      Log('frontend', 'error', 'component', 'Failed to copy URL to clipboard');
    }
  };

  // Open URL
  const openUrl = (url: string, shortCode: string) => {
    UrlStorageService.recordClick(shortCode);
    window.open(url, '_blank');
    setAllUrls(UrlStorageService.getAllUrls()); // Refresh to show updated click count
    Log('frontend', 'info', 'component', 'URL opened: ' + shortCode);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          🔗 URL Shortener
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Shorten up to 5 URLs concurrently with custom options and track their analytics
        </Typography>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Shorten URLs" />
          <Tab label="Statistics" />
        </Tabs>
      </Paper>

      {/* URL Shortener Tab */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          {/* Form Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Create Shortened URLs
              </Typography>
              
              {errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </Alert>
              )}

              {forms.map((form, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">URL {index + 1}</Typography>
                      {forms.length > 1 && (
                        <IconButton onClick={() => removeForm(index)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>

                    <TextField
                      fullWidth
                      label="Original URL"
                      placeholder="https://example.com"
                      value={form.originalUrl}
                      onChange={(e) => updateForm(index, 'originalUrl', e.target.value)}
                      sx={{ mb: 2 }}
                      required
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Validity (minutes)"
                          placeholder="30"
                          type="number"
                          value={form.validityMinutes}
                          onChange={(e) => updateForm(index, 'validityMinutes', e.target.value)}
                          helperText="Default: 30 minutes"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Custom Shortcode"
                          placeholder="my-link"
                          value={form.customShortcode}
                          onChange={(e) => updateForm(index, 'customShortcode', e.target.value)}
                          helperText="3-20 alphanumeric chars"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addForm}
                  disabled={forms.length >= 5 || loading}
                >
                  Add URL ({forms.length}/5)
                </Button>

                <Button
                  variant="contained"
                  onClick={handleCreateUrls}
                  disabled={loading}
                  sx={{ ml: 'auto' }}
                >
                  {loading ? 'Creating...' : 'Create Shortened URLs'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Shortened URLs
              </Typography>
              
              {shortenedUrls.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Your shortened URLs will appear here after creation.
                </Typography>
              ) : (
                shortenedUrls.map((url, index) => (
                  <Card key={url.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        URL #{index + 1}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all' }}>
                        <strong>Original:</strong> {url.originalUrl}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: 'grey.100', 
                        p: 1, 
                        borderRadius: 1,
                        mb: 2
                      }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            flexGrow: 1, 
                            fontFamily: 'monospace',
                            color: 'primary.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {url.shortUrl}
                        </Typography>
                        
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(url.shortUrl, url.shortCode)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={() => openUrl(url.shortUrl, url.shortCode)}
                        >
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`${url.validityMinutes} min`} size="small" />
                        <Chip label={`Expires: ${formatDate(url.expiresAt)}`} size="small" />
                        {url.customShortcode && <Chip label="Custom" color="primary" size="small" />}
                      </Box>
                      
                      {copiedUrl === url.shortCode && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          URL copied to clipboard!
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Statistics Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            URL Statistics
          </Typography>
          
          {allUrls.length === 0 ? (
            <Alert severity="info">
              <Typography variant="h6" gutterBottom>
                No URLs found
              </Typography>
              <Typography>
                Create some shortened URLs first to see statistics here.
              </Typography>
            </Alert>
          ) : (
            <TableContainer>
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
                  {allUrls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 500 }}
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
                        <Chip 
                          label={isExpired(url.expiresAt) ? "Expired" : "Active"} 
                          color={isExpired(url.expiresAt) ? "error" : "success"} 
                          size="small" 
                        />
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
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(url.shortUrl, url.shortCode)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={() => openUrl(url.shortUrl, url.shortCode)}
                          disabled={isExpired(url.expiresAt)}
                        >
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Container>
  );
}

function App() {
  return (
    <>
      <CssBaseline />
      <AppContent />
    </>
  );
}

export default App;
