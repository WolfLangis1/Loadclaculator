import { SecureApiService } from './secureApiService';
import { ErrorHandlingService } from './errorHandlingService';
import { ErrorType } from '../types/error';
import { extractBuildingInsights, generatePanelRecommendations, calculatePotentialFromData } from '../utils/solarDataProcessor';

export class GoogleSolarService {
  static async getSolarData(latitude: number, longitude: number, radiusMeters: number = 100): Promise<any> {
    try {
      this.validateCoordinates(latitude, longitude);
      return await SecureApiService.getSolarData(latitude, longitude, radiusMeters);
    } catch (error) {
      throw ErrorHandlingService.handleApiError(error, 'GoogleSolarService.getSolarData');
    }
  }

  static async getBuildingInsights(latitude: number, longitude: number): Promise<any> {
    try {
      const solarData = await this.getSolarData(latitude, longitude);
      return extractBuildingInsights(solarData);
    } catch (error) {
      throw ErrorHandlingService.handleApiError(error, 'GoogleSolarService.getBuildingInsights');
    }
  }

  static async getPanelRecommendations(latitude: number, longitude: number): Promise<any> {
    try {
      const solarData = await this.getSolarData(latitude, longitude);
      return generatePanelRecommendations(solarData, latitude, longitude);
    } catch (error) {
      throw ErrorHandlingService.handleApiError(error, 'GoogleSolarService.getPanelRecommendations');
    }
  }

  static async getSolarPotential(latitude: number, longitude: number): Promise<any> {
    return this.calculateSolarPotential(latitude, longitude);
  }

  static async calculateSolarPotential(latitude: number, longitude: number): Promise<any> {
    try {
      const solarData = await this.getSolarData(latitude, longitude);
      return calculatePotentialFromData(solarData, latitude, longitude);
    } catch (error) {
      throw ErrorHandlingService.handleApiError(error, 'GoogleSolarService.calculateSolarPotential');
    }
  }

  private static validateCoordinates(latitude: number, longitude: number): void {
    if (!latitude || !longitude) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Coordinates must be provided',
        'Latitude and longitude are required',
        { latitude, longitude },
        'GoogleSolarService.validateCoordinates'
      );
    }
    
    if (latitude < -90 || latitude > 90) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Latitude must be between -90 and 90',
        'Latitude must be between -90 and 90',
        { latitude },
        'GoogleSolarService.validateCoordinates'
      );
    }
    
    if (longitude < -180 || longitude > 180) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Longitude must be between -180 and 180',
        'Longitude must be between -180 and 180',
        { longitude },
        'GoogleSolarService.validateCoordinates'
      );
    }
  }
}
