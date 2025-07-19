import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { secureApiService } from '../../services/secureApiService';
import { apiClient } from '../../services/apiClient';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Services', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SecureApiService', () => {
    describe('Geocoding API', () => {
      it('should geocode address successfully', async () => {
        const mockResponse = {
          status: 'OK',
          results: [{
            geometry: {
              location: { lat: 34.0522, lng: -118.2437 }
            },
            formatted_address: '123 Main St, Los Angeles, CA 90210, USA'
          }]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await secureApiService.geocodeAddress('123 Main St, Los Angeles, CA');
        
        expect(result.lat).toBe(34.0522);
        expect(result.lng).toBe(-118.2437);
        expect(mockFetch).toHaveBeenCalledWith('/api/geocode', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: '123 Main St, Los Angeles, CA' })
        }));
      });

      it('should handle geocoding API errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid address' })
        });

        await expect(secureApiService.geocodeAddress('invalid address'))
          .rejects.toThrow('Geocoding failed');
      });

      it('should handle ZERO_RESULTS status', async () => {
        const mockResponse = {
          status: 'ZERO_RESULTS',
          results: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        await expect(secureApiService.geocodeAddress('nonexistent address'))
          .rejects.toThrow('No results found');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(secureApiService.geocodeAddress('123 Main St'))
          .rejects.toThrow('Network error');
      });
    });

    describe('Places API', () => {
      it('should fetch place predictions successfully', async () => {
        const mockResponse = {
          predictions: [
            {
              place_id: 'place123',
              description: '123 Main St, Los Angeles, CA, USA',
              structured_formatting: {
                main_text: '123 Main St',
                secondary_text: 'Los Angeles, CA, USA'
              }
            }
          ]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await secureApiService.getPlacePredictions('123 Main');
        
        expect(result).toHaveLength(1);
        expect(result[0].place_id).toBe('place123');
        expect(result[0].description).toBe('123 Main St, Los Angeles, CA, USA');
      });

      it('should handle empty place predictions', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ predictions: [] })
        });

        const result = await secureApiService.getPlacePredictions('nonexistent');
        expect(result).toEqual([]);
      });

      it('should debounce rapid requests', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ predictions: [] })
        });

        // Make multiple rapid requests
        const promises = [
          secureApiService.getPlacePredictions('123'),
          secureApiService.getPlacePredictions('123 M'),
          secureApiService.getPlacePredictions('123 Ma'),
          secureApiService.getPlacePredictions('123 Main')
        ];

        await Promise.all(promises);

        // Should have made fewer API calls due to debouncing
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('Satellite Imagery API', () => {
      it('should fetch satellite image URL successfully', async () => {
        const mockImageUrl = 'https://maps.googleapis.com/maps/api/staticmap?...';
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ imageUrl: mockImageUrl })
        });

        const result = await secureApiService.getSatelliteImage(34.0522, -118.2437, 18);
        
        expect(result.imageUrl).toBe(mockImageUrl);
        expect(mockFetch).toHaveBeenCalledWith('/api/satellite', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ lat: 34.0522, lng: -118.2437, zoom: 18 })
        }));
      });

      it('should handle different satellite providers', async () => {
        const providers = ['google', 'usgs', 'esri'];
        
        for (const provider of providers) {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ imageUrl: `${provider}-image-url` })
          });

          const result = await secureApiService.getSatelliteImage(34.0522, -118.2437, 18, provider);
          expect(result.imageUrl).toBe(`${provider}-image-url`);
        }
      });

      it('should handle satellite API failures with fallback', async () => {
        // First call fails
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        });

        // Fallback call succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ imageUrl: 'fallback-url' })
        });

        const result = await secureApiService.getSatelliteImage(34.0522, -118.2437, 18);
        expect(result.imageUrl).toBe('fallback-url');
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('Street View API', () => {
      it('should fetch street view images successfully', async () => {
        const mockImages = [
          { heading: 0, url: 'streetview-0.jpg' },
          { heading: 90, url: 'streetview-90.jpg' },
          { heading: 180, url: 'streetview-180.jpg' },
          { heading: 270, url: 'streetview-270.jpg' }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ images: mockImages })
        });

        const result = await secureApiService.getStreetViewImages(34.0522, -118.2437);
        
        expect(result.images).toHaveLength(4);
        expect(result.images[0].heading).toBe(0);
        expect(result.images[0].url).toBe('streetview-0.jpg');
      });

      it('should handle missing street view data', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            error: 'No street view data available',
            images: []
          })
        });

        const result = await secureApiService.getStreetViewImages(34.0522, -118.2437);
        expect(result.images).toEqual([]);
      });
    });

    describe('Solar API', () => {
      it('should fetch solar data successfully', async () => {
        const mockSolarData = {
          solarPotential: {
            maxArrayPanelsCount: 100,
            maxArrayAreaMeters2: 500,
            maxSunshineHoursPerYear: 2800,
            carbonOffsetFactorKgPerMwh: 400
          },
          financialAnalyses: [{
            monthlyBill: { units: 'USD', currencyCode: 'USD', nanos: 15000000000 },
            panelConfigIndex: 0
          }]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSolarData
        });

        const result = await secureApiService.getSolarData(34.0522, -118.2437);
        
        expect(result.solarPotential.maxArrayPanelsCount).toBe(100);
        expect(result.solarPotential.maxSunshineHoursPerYear).toBe(2800);
      });

      it('should handle solar API quota exceeded', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ error: 'Quota exceeded' })
        });

        await expect(secureApiService.getSolarData(34.0522, -118.2437))
          .rejects.toThrow('Solar API quota exceeded');
      });

      it('should provide fallback solar calculations', async () => {
        // Mock API failure
        mockFetch.mockRejectedValueOnce(new Error('API unavailable'));

        const result = await secureApiService.getSolarData(34.0522, -118.2437, { 
          useFallback: true,
          squareFootage: 2500
        });
        
        // Should return calculated fallback data
        expect(result.solarPotential).toBeDefined();
        expect(result.solarPotential.maxArrayPanelsCount).toBeGreaterThan(0);
      });
    });

    describe('Error Handling and Retries', () => {
      it('should retry failed requests with exponential backoff', async () => {
        // First two calls fail, third succeeds
        mockFetch
          .mockResolvedValueOnce({ ok: false, status: 500 })
          .mockResolvedValueOnce({ ok: false, status: 500 })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ lat: 34.0522, lng: -118.2437 })
          });

        const result = await secureApiService.geocodeAddress('123 Main St');
        
        expect(result.lat).toBe(34.0522);
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });

      it('should timeout long-running requests', async () => {
        // Mock a request that never resolves
        mockFetch.mockImplementationOnce(() => 
          new Promise(resolve => setTimeout(resolve, 60000))
        );

        await expect(secureApiService.geocodeAddress('123 Main St'))
          .rejects.toThrow('Request timeout');
      }, 10000);

      it('should handle malformed JSON responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => { throw new Error('Invalid JSON'); }
        });

        await expect(secureApiService.geocodeAddress('123 Main St'))
          .rejects.toThrow('Invalid response format');
      });

      it('should handle rate limiting gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['Retry-After', '60']])
        });

        await expect(secureApiService.geocodeAddress('123 Main St'))
          .rejects.toThrow('Rate limit exceeded');
      });
    });
  });

  describe('ApiClient (Authenticated Requests)', () => {
    it('should include authentication headers', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await apiClient.post('/api/protected', { data: 'test' }, mockUser);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/protected', expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer'),
          'Content-Type': 'application/json'
        })
      }));
    });

    it('should handle authentication failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      await expect(apiClient.get('/api/protected'))
        .rejects.toThrow('Authentication required');
    });

    it('should refresh tokens automatically', async () => {
      // First call fails with 401
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce({ // Token refresh succeeds
          ok: true,
          json: async () => ({ token: 'new-token' })
        })
        .mockResolvedValueOnce({ // Retry with new token succeeds
          ok: true,
          json: async () => ({ data: 'success' })
        });

      const result = await apiClient.get('/api/protected');
      
      expect(result.data).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cache Management', () => {
    it('should cache geocoding results', async () => {
      const mockResponse = {
        status: 'OK',
        results: [{ geometry: { location: { lat: 34.0522, lng: -118.2437 } } }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      // Make same request twice
      await secureApiService.geocodeAddress('123 Main St');
      await secureApiService.geocodeAddress('123 Main St');

      // Should only make one API call due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should invalidate expired cache entries', async () => {
      const mockResponse = {
        status: 'OK',
        results: [{ geometry: { location: { lat: 34.0522, lng: -118.2437 } } }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      // Make request
      await secureApiService.geocodeAddress('123 Main St');

      // Simulate cache expiration (advance time)
      vi.advanceTimersByTime(1000 * 60 * 60); // 1 hour

      // Make same request again
      await secureApiService.geocodeAddress('123 Main St');

      // Should make two API calls due to cache expiration
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear cache on demand', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] })
      });

      // Make request and cache result
      await secureApiService.geocodeAddress('123 Main St');
      
      // Clear cache
      secureApiService.clearCache();
      
      // Make same request again
      await secureApiService.geocodeAddress('123 Main St');

      // Should make two API calls due to cache clearing
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});