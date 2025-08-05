import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { UrlCreationRequest, ValidationError } from '../types';
import { validateUrlCreation } from '../utils/validation';
import { Logger } from '../utils/logger';

interface UrlFormData {
  originalUrl: string;
  validityMinutes: string;
  customShortcode: string;
}

interface UrlFormProps {
  onSubmit: (requests: UrlCreationRequest[]) => Promise<void>;
  loading: boolean;
}

const UrlForm: React.FC<UrlFormProps> = ({ onSubmit, loading }) => {
  const [forms, setForms] = useState<UrlFormData[]>([
    { originalUrl: '', validityMinutes: '', customShortcode: '' }
  ]);
  const [errors, setErrors] = useState<{ [key: number]: ValidationError[] }>({});
  const [submitError, setSubmitError] = useState<string>('');

  const addForm = () => {
    if (forms.length < 5) {
      setForms([...forms, { originalUrl: '', validityMinutes: '', customShortcode: '' }]);
      Logger.info('component', `Added URL form ${forms.length + 1}`);
    }
  };

  const removeForm = (index: number) => {
    if (forms.length > 1) {
      const newForms = forms.filter((_, i) => i !== index);
      setForms(newForms);
      
      // Remove errors for this form
      const newErrors = { ...errors };
      delete newErrors[index];
      
      // Adjust error indices
      const adjustedErrors: { [key: number]: ValidationError[] } = {};
      Object.keys(newErrors).forEach(key => {
        const numKey = parseInt(key);
        if (numKey > index) {
          adjustedErrors[numKey - 1] = newErrors[numKey];
        } else {
          adjustedErrors[numKey] = newErrors[numKey];
        }
      });
      
      setErrors(adjustedErrors);
      Logger.info('component', `Removed URL form ${index + 1}`);
    }
  };

  const updateForm = (index: number, field: keyof UrlFormData, value: string) => {
    const newForms = [...forms];
    newForms[index][field] = value;
    setForms(newForms);

    // Clear errors for this field
    if (errors[index]) {
      const newErrors = { ...errors };
      newErrors[index] = newErrors[index].filter(err => err.field !== field);
      if (newErrors[index].length === 0) {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }

    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await Logger.info('component', 'Starting URL form validation and submission');
      
      // Validate all forms
      const newErrors: { [key: number]: ValidationError[] } = {};
      const requests: UrlCreationRequest[] = [];
      
      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        
        // Skip empty forms
        if (!form.originalUrl.trim()) {
          continue;
        }
        
        const validityMinutes = form.validityMinutes ? parseInt(form.validityMinutes) : undefined;
        const validationErrors = validateUrlCreation(
          form.originalUrl,
          validityMinutes,
          form.customShortcode || undefined
        );
        
        if (validationErrors.length > 0) {
          newErrors[i] = validationErrors;
        } else {
          requests.push({
            originalUrl: form.originalUrl.trim(),
            validityMinutes,
            customShortcode: form.customShortcode || undefined
          });
        }
      }
      
      setErrors(newErrors);
      
      // Check if we have any requests to process
      if (requests.length === 0) {
        setSubmitError('Please enter at least one valid URL to shorten');
        await Logger.warn('component', 'No valid URLs provided for shortening');
        return;
      }
      
      // Check if there are validation errors
      if (Object.keys(newErrors).length > 0) {
        setSubmitError('Please fix the validation errors above');
        await Logger.warn('component', `Form validation failed for ${Object.keys(newErrors).length} forms`);
        return;
      }
      
      await Logger.info('component', `Submitting ${requests.length} valid URL requests`);
      await onSubmit(requests);
      
      // Clear forms on success
      setForms([{ originalUrl: '', validityMinutes: '', customShortcode: '' }]);
      setErrors({});
      setSubmitError('');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create shortened URLs';
      setSubmitError(errorMessage);
      await Logger.error('component', `Form submission failed: ${errorMessage}`);
    }
  };

  const getFieldError = (formIndex: number, fieldName: string): string => {
    const formErrors = errors[formIndex];
    if (!formErrors) return '';
    
    const fieldError = formErrors.find(err => err.field === fieldName);
    return fieldError ? fieldError.message : '';
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Stack spacing={3}>
        {forms.map((form, index) => (
          <Box key={index}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2 
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                URL {index + 1}
              </Typography>
              
              {forms.length > 1 && (
                <IconButton
                  onClick={() => removeForm(index)}
                  color="error"
                  size="small"
                  disabled={loading}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Original URL"
                placeholder="https://example.com"
                value={form.originalUrl}
                onChange={(e) => updateForm(index, 'originalUrl', e.target.value)}
                error={!!getFieldError(index, 'originalUrl')}
                helperText={getFieldError(index, 'originalUrl')}
                disabled={loading}
                required
              />

              <TextField
                fullWidth
                label="Validity Period (minutes)"
                placeholder="30"
                type="number"
                value={form.validityMinutes}
                onChange={(e) => updateForm(index, 'validityMinutes', e.target.value)}
                error={!!getFieldError(index, 'validityMinutes')}
                helperText={getFieldError(index, 'validityMinutes') || 'Default: 30 minutes'}
                disabled={loading}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />

              <TextField
                fullWidth
                label="Custom Shortcode (optional)"
                placeholder="my-link"
                value={form.customShortcode}
                onChange={(e) => updateForm(index, 'customShortcode', e.target.value)}
                error={!!getFieldError(index, 'customShortcode')}
                helperText={getFieldError(index, 'customShortcode') || '3-20 alphanumeric characters'}
                disabled={loading}
              />
            </Stack>

            {index < forms.length - 1 && <Divider sx={{ mt: 3 }} />}
          </Box>
        ))}
      </Stack>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addForm}
          disabled={forms.length >= 5 || loading}
        >
          Add URL ({forms.length}/5)
        </Button>

        <Button
          type="submit"
          variant="contained"
          startIcon={<SendIcon />}
          disabled={loading}
          sx={{ ml: 'auto' }}
        >
          {loading ? 'Creating...' : 'Create Shortened URLs'}
        </Button>
      </Box>
    </Box>
  );
};

export default UrlForm;
