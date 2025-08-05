import { ShortenedUrl, UrlCreationRequest, ClickData } from '../types';
import { generateShortcode, isExpired } from './validation';
import { Logger } from './logger';

// Storage keys for localStorage
const STORAGE_KEYS = {
  URLS: 'url_shortener_urls',
  CLICKS: 'url_shortener_clicks'
};

/**
 * Service for managing URL storage and operations in localStorage
 */
export class UrlStorageService {
  /**
   * Creates a new shortened URL
   * @param request - URL creation request data
   * @returns Promise<ShortenedUrl> - The created shortened URL
   */
  static async createShortenedUrl(request: UrlCreationRequest): Promise<ShortenedUrl> {
    try {
      await Logger.info('api', `Creating shortened URL for: ${request.originalUrl}`);
      
      const existingUrls = this.getAllUrls();
      
      // Generate shortcode
      let shortCode = request.customShortcode || generateShortcode();
      
      // Ensure uniqueness
      while (existingUrls.some(url => url.shortCode === shortCode)) {
        if (request.customShortcode) {
          await Logger.error('api', `Custom shortcode collision: ${shortCode}`);
          throw new Error('Custom shortcode already exists. Please choose a different one.');
        }
        shortCode = generateShortcode();
      }
      
      const now = new Date();
      const validityMinutes = request.validityMinutes || 30; // Default 30 minutes
      const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000);
      
      const shortenedUrl: ShortenedUrl = {
        id: this.generateId(),
        originalUrl: request.originalUrl.trim(),
        shortCode,
        shortUrl: `http://localhost:3000/${shortCode}`,
        createdAt: now,
        expiresAt,
        customShortcode: request.customShortcode,
        validityMinutes,
        clickCount: 0,
        isExpired: false
      };
      
      // Save to storage
      existingUrls.push(shortenedUrl);
      this.saveUrls(existingUrls);
      
      await Logger.info('api', `Successfully created shortened URL: ${shortenedUrl.shortUrl}`);
      return shortenedUrl;
      
    } catch (error) {
      await Logger.error('api', `Failed to create shortened URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  /**
   * Gets all shortened URLs from storage
   * @returns Array of shortened URLs
   */
  static getAllUrls(): ShortenedUrl[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.URLS);
      if (!stored) return [];
      
      const urls: ShortenedUrl[] = JSON.parse(stored).map((url: any) => ({
        ...url,
        createdAt: new Date(url.createdAt),
        expiresAt: new Date(url.expiresAt),
        isExpired: isExpired(new Date(url.expiresAt))
      }));
      
      return urls;
    } catch (error) {
      Logger.error('state', `Failed to retrieve URLs from storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }
  
  /**
   * Gets a shortened URL by its short code
   * @param shortCode - The short code to look up
   * @returns ShortenedUrl or null if not found
   */
  static getUrlByShortCode(shortCode: string): ShortenedUrl | null {
    try {
      const urls = this.getAllUrls();
      const url = urls.find(u => u.shortCode === shortCode);
      return url || null;
    } catch (error) {
      Logger.error('state', `Failed to retrieve URL by shortcode: ${shortCode}`);
      return null;
    }
  }
  
  /**
   * Records a click on a shortened URL
   * @param shortCode - The short code that was clicked
   * @param source - Source of the click (e.g., 'direct', 'statistics')
   * @returns Promise<boolean> - Success status
   */
  static async recordClick(shortCode: string, source: string = 'direct'): Promise<boolean> {
    try {
      await Logger.info('api', `Recording click for shortcode: ${shortCode}`);
      
      const urls = this.getAllUrls();
      const urlIndex = urls.findIndex(u => u.shortCode === shortCode);
      
      if (urlIndex === -1) {
        await Logger.warn('api', `Shortcode not found for click recording: ${shortCode}`);
        return false;
      }
      
      // Check if URL has expired
      if (isExpired(urls[urlIndex].expiresAt)) {
        await Logger.warn('api', `Attempted click on expired URL: ${shortCode}`);
        return false;
      }
      
      // Increment click count
      urls[urlIndex].clickCount += 1;
      this.saveUrls(urls);
      
      // Record click data
      const clickData: ClickData = {
        id: this.generateId(),
        shortCode,
        timestamp: new Date(),
        source,
        location: 'Local' // Simplified location for demo
      };
      
      this.recordClickData(clickData);
      
      await Logger.info('api', `Click recorded successfully for: ${shortCode}`);
      return true;
      
    } catch (error) {
      await Logger.error('api', `Failed to record click: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  
  /**
   * Gets click data for a specific short code
   * @param shortCode - The short code to get clicks for
   * @returns Array of click data
   */
  static getClicksForShortCode(shortCode: string): ClickData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLICKS);
      if (!stored) return [];
      
      const allClicks: ClickData[] = JSON.parse(stored).map((click: any) => ({
        ...click,
        timestamp: new Date(click.timestamp)
      }));
      
      return allClicks.filter(click => click.shortCode === shortCode);
    } catch (error) {
      Logger.error('state', `Failed to retrieve clicks for shortcode: ${shortCode}`);
      return [];
    }
  }
  
  /**
   * Saves URLs to localStorage
   * @param urls - Array of URLs to save
   */
  private static saveUrls(urls: ShortenedUrl[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.URLS, JSON.stringify(urls));
    } catch (error) {
      Logger.error('state', `Failed to save URLs to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Records click data to localStorage
   * @param clickData - Click data to record
   */
  private static recordClickData(clickData: ClickData): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLICKS);
      const clicks: ClickData[] = stored ? JSON.parse(stored) : [];
      clicks.push(clickData);
      localStorage.setItem(STORAGE_KEYS.CLICKS, JSON.stringify(clicks));
    } catch (error) {
      Logger.error('state', `Failed to record click data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generates a unique ID
   * @returns Unique identifier string
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Clears all stored data (for development/testing)
   */
  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.URLS);
    localStorage.removeItem(STORAGE_KEYS.CLICKS);
    Logger.info('state', 'All stored data cleared');
  }
}
