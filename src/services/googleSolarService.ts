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

    const solarPotential = solarData.solarPotential;
    const wholeRoofStats = solarPotential.wholeRoofStats;

    return {
      // Basic metrics
      roofSegmentCount: solarPotential.roofSegmentCount || 1,
      groundSegmentCount: solarPotential.groundSegmentCount || 0,
      maxArrayPanelsCount: solarPotential.maxArrayPanelsCount || 20,
      yearlyEnergyDcKwh: solarPotential.yearlyEnergyDcKwh || 5000,
      
      // Enhanced roof analysis
      roofSegmentStats: solarPotential.roofSegmentStats || [],
      groundSegmentStats: solarPotential.groundSegmentStats || [],
      
      // Whole roof statistics (comprehensive analysis)
      wholeRoofStats: wholeRoofStats ? {
        areaMeters2: wholeRoofStats.areaMeters2,
        sunshineQuantiles: wholeRoofStats.sunshineQuantiles,
        groundAreaCoveredMeters2: wholeRoofStats.groundAreaCoveredMeters2
      } : null,
      
      // Solar potential configurations (different panel counts)
      solarPanelConfigs: solarPotential.solarPanelConfigs?.map((config: any) => ({
        panelsCount: config.panelsCount,
        yearlyEnergyDcKwh: config.yearlyEnergyDcKwh,
        roofSegmentSummaries: config.roofSegmentSummaries?.map((summary: any) => ({
          pitchDegrees: summary.pitchDegrees,
          azimuthDegrees: summary.azimuthDegrees,
          panelsCount: summary.panelsCount,
          yearlyEnergyDcKwh: summary.yearlyEnergyDcKwh,
          segmentIndex: summary.segmentIndex
        }))
      })) || [],
      
      // Building information
      name: solarData.name,
      center: solarData.center,
      boundingBox: solarData.boundingBox,
      imageryDate: solarData.imageryDate,
      imageryProcessedDate: solarData.imageryProcessedDate,
      imageryQuality: solarData.imageryQuality,
      
      // Financial analysis (if available)
      financialAnalyses: solarPotential.financialAnalyses?.map((analysis: any) => ({
        monthlyBill: analysis.monthlyBill,
        defaultBill: analysis.defaultBill,
        averageKwhPerMonth: analysis.averageKwhPerMonth,
        panelConfigIndex: analysis.panelConfigIndex,
        financialDetails: analysis.financialDetails ? {
          initialAcKwhPerYear: analysis.financialDetails.initialAcKwhPerYear,
          remainingLifetimeUtilityBill: analysis.financialDetails.remainingLifetimeUtilityBill,
          federalIncentive: analysis.financialDetails.federalIncentive,
          stateIncentive: analysis.financialDetails.stateIncentive,
          utilityIncentive: analysis.financialDetails.utilityIncentive,
          lifetimeSrecTotal: analysis.financialDetails.lifetimeSrecTotal,
          costOfElectricityWithoutSolar: analysis.financialDetails.costOfElectricityWithoutSolar,
          netMeteringAllowed: analysis.financialDetails.netMeteringAllowed,
          solarPercentage: analysis.financialDetails.solarPercentage,
          percentageExportedToGrid: analysis.financialDetails.percentageExportedToGrid
        } : null,
        leasingSavings: analysis.leasingSavings,
        cashPurchaseSavings: analysis.cashPurchaseSavings,
        financedPurchaseSavings: analysis.financedPurchaseSavings
      })) || []
    };
  }

  private static generatePanelRecommendations(solarData: any, latitude: number, longitude: number): any {
    const buildingInsights = this.extractBuildingInsights(solarData);
    
    // Find optimal configuration from solar panel configs
    const optimalConfig = buildingInsights.solarPanelConfigs?.length > 0 
      ? buildingInsights.solarPanelConfigs.reduce((best: any, current: any) => {
          const currentEfficiency = current.yearlyEnergyDcKwh / current.panelsCount;
          const bestEfficiency = best.yearlyEnergyDcKwh / best.panelsCount;
          return currentEfficiency > bestEfficiency ? current : best;
        })
      : null;

    // Get best roof segment orientation
    const bestSegment = buildingInsights.roofSegmentStats?.length > 0
      ? buildingInsights.roofSegmentStats.reduce((best: any, current: any) => {
          return (current.yearlyEnergyDcKwh || 0) > (best.yearlyEnergyDcKwh || 0) ? current : best;
        })
      : null;

    // Use financial analysis if available
    const financialAnalysis = buildingInsights.financialAnalyses?.length > 0 
      ? buildingInsights.financialAnalyses[0] 
      : null;

    const recommendedPanels = optimalConfig?.panelsCount || Math.min(buildingInsights.maxArrayPanelsCount, 20);
    const annualOutput = optimalConfig?.yearlyEnergyDcKwh || buildingInsights.yearlyEnergyDcKwh;

    return {
      // Basic recommendations
      recommendedPanels,
      panelType: 'High-efficiency monocrystalline',
      orientation: bestSegment ? `${bestSegment.azimuthDegrees}° azimuth` : 'South-facing',
      tilt: bestSegment?.pitchDegrees || Math.abs(latitude),
      estimatedAnnualOutput: annualOutput,
      
      // Enhanced recommendations with Google data
      roofAnalysis: {
        totalRoofArea: buildingInsights.wholeRoofStats?.areaMeters2 || 0,
        usableRoofArea: buildingInsights.wholeRoofStats?.groundAreaCoveredMeters2 || 0,
        roofSegments: buildingInsights.roofSegmentStats?.length || 1,
        sunshineQuantiles: buildingInsights.wholeRoofStats?.sunshineQuantiles || [],
        imageryQuality: buildingInsights.imageryQuality || 'HIGH'
      },
      
      // Configuration options
      configurations: buildingInsights.solarPanelConfigs?.slice(0, 5).map((config: any) => ({
        panelCount: config.panelsCount,
        annualOutput: config.yearlyEnergyDcKwh,
        efficiency: (config.yearlyEnergyDcKwh / config.panelsCount).toFixed(1),
        roofUtilization: config.roofSegmentSummaries?.length || 1
      })) || [],
      
      // Financial analysis (if available from Google)
      financialAnalysis: financialAnalysis ? {
        monthlyBill: financialAnalysis.monthlyBill,
        averageKwhPerMonth: financialAnalysis.averageKwhPerMonth,
        solarPercentage: financialAnalysis.financialDetails?.solarPercentage,
        federalIncentive: financialAnalysis.financialDetails?.federalIncentive,
        stateIncentive: financialAnalysis.financialDetails?.stateIncentive,
        utilityIncentive: financialAnalysis.financialDetails?.utilityIncentive,
        netMeteringAllowed: financialAnalysis.financialDetails?.netMeteringAllowed,
        paybackOptions: {
          cashPurchase: financialAnalysis.cashPurchaseSavings,
          financing: financialAnalysis.financedPurchaseSavings,
          leasing: financialAnalysis.leasingSavings
        }
      } : null,
      
      // Fallback calculations
      costEstimate: annualOutput * 0.12 * 25, // 25-year lifetime
      paybackPeriod: 8, // years (fallback)
      environmentalImpact: {
        co2Reduction: annualOutput * 0.85, // kg CO2/year
        treesEquivalent: Math.round(annualOutput * 0.85 / 22) // trees
      },
      
      // Building metadata
      buildingInfo: {
        name: buildingInsights.name,
        center: buildingInsights.center,
        boundingBox: buildingInsights.boundingBox,
        imageryDate: buildingInsights.imageryDate,
        imageryProcessedDate: buildingInsights.imageryProcessedDate
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