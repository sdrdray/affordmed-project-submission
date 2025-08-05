# URL Shortener App

A React-based URL shortener application with Material-UI components and comprehensive logging integration.

## Features

- **URL Shortening**: Create up to 5 shortened URLs concurrently
- **Custom Options**: Set custom validity periods and shortcodes
- **Client-side Validation**: Comprehensive input validation
- **Statistics Dashboard**: Track clicks and usage analytics
- **Responsive Design**: Works on desktop and mobile devices
- **Logging Integration**: Comprehensive logging with external API

## Technology Stack

- React 18 with TypeScript
- Material-UI for styling
- React Router for client-side routing
- Axios for HTTP requests
- LocalStorage for data persistence

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating Shortened URLs

1. Navigate to the home page
2. Enter the original URL (must include http:// or https://)
3. Optionally set a validity period (default: 30 minutes)
4. Optionally provide a custom shortcode (3-20 alphanumeric characters)
5. Add more URLs (up to 5 total)
6. Click "Create Shortened URLs"

### Viewing Statistics

1. Navigate to the Statistics page
2. View all created URLs with their usage statistics
3. Click on individual URLs to see detailed click data
4. Copy URLs or open them directly from the statistics page

### URL Redirection

- Access shortened URLs at `http://localhost:3000/{shortcode}`
- URLs automatically redirect to the original destination
- Click tracking is recorded automatically
- Expired URLs show appropriate error messages

## Validation Rules

- **URLs**: Must be valid HTTP/HTTPS URLs
- **Validity**: Must be positive integer (minutes)
- **Shortcodes**: 3-20 alphanumeric characters, must be unique

## Error Handling

- Client-side validation with user-friendly error messages
- Graceful handling of expired URLs
- Network error handling with fallback messages
- Comprehensive logging for debugging

## Data Storage

The application uses browser localStorage for data persistence:
- URL mappings and metadata
- Click tracking data
- Automatic cleanup of expired entries
