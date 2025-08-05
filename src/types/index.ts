// URL shortener types and interfaces

export interface ShortenedUrl {
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

export interface UrlCreationRequest {
  originalUrl: string;
  validityMinutes?: number;
  customShortcode?: string;
}

export interface ClickData {
  id: string;
  shortCode: string;
  timestamp: Date;
  source: string;
  location: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}
