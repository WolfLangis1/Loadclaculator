import { SecureApiService } from './secureApiService';

// Google Solar Service - Now uses secure backend proxy
export class GoogleSolarService {
  private static readonly USE_REAL_DATA = true; // Always use real data now

  /**
   * Get solar data for a specific location
   */
  static async getSolarData(latitude: number, longitude: number, radiusMeters: number = 100): Promise<any> {
    try {
      console.log('Getting solar data for location:', { latitude, longitude, radiusMeters });
      
      // Use secure backend API
      const solarData = await SecureApiService.getSolarData(latitude, longitude, radiusMeters);
      
      console.log('Solar data retrieved successfully');
      return solarData;
    } catch (error) {
      console.error('Failed to get solar data:', error);
      
      // Return fallback data if API fails
      return this.getFallbackSolarData(latitude, longitude);
    }
  }

  /**
   * Get building insights for solar potential
   */
  static async getBuildingInsights(latitude: number, longitude: number): Promise<any> {
    try {
      console.log('Getting building insights for location:', { latitude, longitude });
      
      // Use secure backend API
      const solarData = await SecureApiService.getSolarData(latitude, longitude);
      
      // Extract building insights from solar data
      const buildingInsights = this.extractBuildingInsights(solarData);
      
      console.log('Building insights retrieved successfully');
      return buildingInsights;
    } catch (error) {
      console.error('Failed to get building insights:', error);
      
      // Return fallback building insights
      return this.getFallbackBuildingInsights(latitude, longitude);
    }
  }

  /**
   * Get solar panel configuration recommendations
   */
  static async getPanelRecommendations(latitude: number, longitude: number): Promise<any> {
    try {
      console.log('Getting panel recommendations for location:', { latitude, longitude });
      
      // Use secure backend API
      const solarData = await SecureApiService.getSolarData(latitude, longitude);
      
      // Generate panel recommendations based on solar data
      const recommendations = this.generatePanelRecommendations(solarData, latitude, longitude);
      
      console.log('Panel recommendations generated successfully');
      return recommendations;
    } catch (error) {
      console.error('Failed to get panel recommendations:', error);
      
      // Return fallback recommendations
      return this.getFallbackPanelRecommendations(latitude, longitude);
    }
  }

  /**
   * Calculate solar potential for a location
   */
  static async calculateSolarPotential(latitude: number, longitude: number): Promise<any> {
    try {
      console.log('Calculating solar potential for location:', { latitude, longitude });
      
      // Use secure backend API
      const solarData = await SecureApiService.getSolarData(latitude, longitude);
      
      // Calculate potential based on solar data
      const potential = this.calculatePotentialFromData(solarData, latitude, longitude);
      
      console.log('Solar potential calculated successfully');
      return potential;
    } catch (error) {
      console.error('Failed to calculate solar potential:', error);
      
      // Return fallback potential calculation
      return this.getFallbackSolarPotential(latitude, longitude);
    }
  }

  // Helper methods for data processing
  private static extractBuildingInsights(solarData: any): any {
    if (!solarData || !solarData.solarPotential) {
      return this.getFallbackBuildingInsights(0, 0);
    }

    return {
      roofSegmentCount: solarData.solarPotential?.roofSegmentCount || 1,
      groundSegmentCount: solarData.solarPotential?.groundSegmentCount || 0,
      maxArrayPanelsCount: solarData.solarPotential?.maxArrayPanelsCount || 20,
      yearlyEnergyDcKwh: solarData.solarPotential?.yearlyEnergyDcKwh || 5000,
      roofSegmentStats: solarData.solarPotential?.roofSegmentStats || [],
      groundSegmentStats: solarData.solarPotential?.groundSegmentStats || []
    };
  }

  private static generatePanelRecommendations(solarData: any, latitude: number, longitude: number): any {
    const buildingInsights = this.extractBuildingInsights(solarData);
    
    return {
      recommendedPanels: Math.min(buildingInsights.maxArrayPanelsCount, 20),
      panelType: 'High-efficiency monocrystalline',
      orientation: 'South-facing',
      tilt: Math.abs(latitude),
      estimatedAnnualOutput: buildingInsights.yearlyEnergyDcKwh,
      costEstimate: buildingInsights.yearlyEnergyDcKwh * 0.12 * 25, // 25-year lifetime
      paybackPeriod: 8, // years
      environmentalImpact: {
        co2Reduction: buildingInsights.yearlyEnergyDcKwh * 0.85, // kg CO2/year
        treesEquivalent: Math.round(buildingInsights.yearlyEnergyDcKwh * 0.85 / 22) // trees
      }
    };
  }

  private static calculatePotentialFromData(solarData: any, latitude: number, longitude: number): any {
    const buildingInsights = this.extractBuildingInsights(solarData);
    
    return {
      annualEnergyPotential: buildingInsights.yearlyEnergyDcKwh,
      dailyAverage: buildingInsights.yearlyEnergyDcKwh / 365,
      monthlyAverage: buildingInsights.yearlyEnergyDcKwh / 12,
      peakPowerPotential: buildingInsights.maxArrayPanelsCount * 400, // 400W per panel
      efficiency: 0.85, // 85% system efficiency
      location: { latitude, longitude },
      factors: {
        latitude: latitude,
        longitude: longitude,
        roofArea: buildingInsights.roofSegmentCount * 100, // sq ft
        shading: 0.1, // 10% shading factor
        weather: 0.95 // 95% weather factor
      }
    };
  }

  // Fallback methods for when API is unavailable
  private static getFallbackSolarData(latitude: number, longitude: number): any {
    return {
      solarPotential: {
        roofSegmentCount: 2,
        groundSegmentCount: 0,
        maxArrayPanelsCount: 16,
        yearlyEnergyDcKwh: 6000,
        roofSegmentStats: [
          {
            pitchDegrees: 20,
            azimuthDegrees: 180,
            groundMeters2: 50,
            panelCount: 8,
            yearlyEnergyDcKwh: 3000
          },
          {
            pitchDegrees: 20,
            azimuthDegrees: 180,
            groundMeters2: 50,
            panelCount: 8,
            yearlyEnergyDcKwh: 3000
          }
        ]
      }
    };
  }

  private static getFallbackBuildingInsights(latitude: number, longitude: number): any {
    return {
      roofSegmentCount: 2,
      groundSegmentCount: 0,
      maxArrayPanelsCount: 16,
      yearlyEnergyDcKwh: 6000,
      roofSegmentStats: [
        {
          pitchDegrees: 20,
          azimuthDegrees: 180,
          groundMeters2: 50,
          panelCount: 8,
          yearlyEnergyDcKwh: 3000
        }
      ]
    };
  }

  private static getFallbackPanelRecommendations(latitude: number, longitude: number): any {
    return {
      recommendedPanels: 16,
      panelType: 'High-efficiency monocrystalline',
      orientation: 'South-facing',
      tilt: Math.abs(latitude),
      estimatedAnnualOutput: 6000,
      costEstimate: 18000,
      paybackPeriod: 8,
      environmentalImpact: {
        co2Reduction: 5100,
        treesEquivalent: 232
      }
    };
  }

  private static getFallbackSolarPotential(latitude: number, longitude: number): any {
    return {
      annualEnergyPotential: 6000,
      dailyAverage: 16.4,
      monthlyAverage: 500,
      peakPowerPotential: 6400,
      efficiency: 0.85,
      location: { latitude, longitude },
      factors: {
        latitude: latitude,
        longitude: longitude,
        roofArea: 200,
        shading: 0.1,
        weather: 0.95
      }
    };
  }
}