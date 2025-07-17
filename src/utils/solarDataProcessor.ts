import type { ProjectAttachment } from '../types/attachment';

export const extractBuildingInsights = (solarData: any): any => {
  if (!solarData || !solarData.solarPotential) {
    return null;
  }

  const solarPotential = solarData.solarPotential;
  const wholeRoofStats = solarPotential.wholeRoofStats;
  
  // Calculate total yearly energy from solar panels or configs
  const totalYearlyEnergy = solarPotential.solarPanels?.reduce((total: number, panel: any) => 
    total + (panel.yearlyEnergyDcKwh || 0), 0) || 
    solarPotential.solarPanelConfigs?.[0]?.yearlyEnergyDcKwh ||
    (solarPotential.maxArrayPanelsCount * 400 * 5); // Fallback estimate

  return {
    roofSegmentCount: solarPotential.roofSegmentCount || 1,
    groundSegmentCount: solarPotential.groundSegmentCount || 0,
    maxArrayPanelsCount: solarPotential.maxArrayPanelsCount || 20,
    yearlyEnergyDcKwh: totalYearlyEnergy,
    
    roofSegmentStats: solarPotential.roofSegmentStats || [],
    groundSegmentStats: solarPotential.groundSegmentStats || [],
    
    wholeRoofStats: wholeRoofStats ? {
      areaMeters2: wholeRoofStats.areaMeters2,
      sunshineQuantiles: wholeRoofStats.sunshineQuantiles,
      groundAreaCoveredMeters2: wholeRoofStats.groundAreaCoveredMeters2
    } : null,
    
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
    
    name: solarData.name,
    center: solarData.center,
    boundingBox: solarData.boundingBox,
    imageryDate: solarData.imageryDate,
    imageryProcessedDate: solarData.imageryProcessedDate,
    imageryQuality: solarData.imageryQuality,
    
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
};

export const generatePanelRecommendations = (solarData: any, latitude: number, longitude: number): any => {
  const buildingInsights = extractBuildingInsights(solarData);
  
  const optimalConfig = buildingInsights.solarPanelConfigs?.length > 0 
    ? buildingInsights.solarPanelConfigs.reduce((best: any, current: any) => {
        const currentEfficiency = current.yearlyEnergyDcKwh / current.panelsCount;
        const bestEfficiency = best.yearlyEnergyDcKwh / best.panelsCount;
        return currentEfficiency > bestEfficiency ? current : best;
      })
    : null;

  const bestSegment = buildingInsights.roofSegmentStats?.length > 0
    ? buildingInsights.roofSegmentStats.reduce((best: any, current: any) => {
        return (current.yearlyEnergyDcKwh || 0) > (best.yearlyEnergyDcKwh || 0) ? current : best;
      })
    : null;

  const financialAnalysis = buildingInsights.financialAnalyses?.length > 0 
    ? buildingInsights.financialAnalyses[0] 
    : null;

  const recommendedPanels = optimalConfig?.panelsCount || Math.min(buildingInsights.maxArrayPanelsCount, 20);
  const annualOutput = optimalConfig?.yearlyEnergyDcKwh || buildingInsights.yearlyEnergyDcKwh;

  return {
    recommendedPanels,
    panelType: 'High-efficiency monocrystalline',
    orientation: bestSegment ? `${bestSegment.azimuthDegrees}° azimuth` : 'South-facing',
    tilt: bestSegment?.pitchDegrees || Math.abs(latitude),
    estimatedAnnualOutput: annualOutput,
    
    roofAnalysis: {
      totalRoofArea: buildingInsights.wholeRoofStats?.areaMeters2 || 0,
      usableRoofArea: buildingInsights.wholeRoofStats?.groundAreaCoveredMeters2 || 0,
      roofSegments: buildingInsights.roofSegmentStats?.length || 1,
      sunshineQuantiles: buildingInsights.wholeRoofStats?.sunshineQuantiles || [],
      imageryQuality: buildingInsights.imageryQuality || 'HIGH'
    },
    
    configurations: buildingInsights.solarPanelConfigs?.slice(0, 5).map((config: any) => ({
      panelCount: config.panelsCount,
      annualOutput: config.yearlyEnergyDcKwh,
      efficiency: (config.yearlyEnergyDcKwh / config.panelsCount).toFixed(1),
      roofUtilization: config.roofSegmentSummaries?.length || 1
    })) || [],
    
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
    
    costEstimate: annualOutput * 0.12 * 25,
    paybackPeriod: 8,
    environmentalImpact: {
      co2Reduction: annualOutput * 0.85,
      treesEquivalent: Math.round(annualOutput * 0.85 / 22)
    },
    
    buildingInfo: {
      name: buildingInsights.name,
      center: buildingInsights.center,
      boundingBox: buildingInsights.boundingBox,
      imageryDate: buildingInsights.imageryDate,
      imageryProcessedDate: buildingInsights.imageryProcessedDate
    }
  };
};

export const calculatePotentialFromData = (solarData: any, latitude: number, longitude: number): any => {
  const buildingInsights = extractBuildingInsights(solarData);
  
  const annualEnergy = buildingInsights.yearlyEnergyDcKwh || 
    (buildingInsights.maxArrayPanelsCount * 400 * 5); // Fallback calculation
  
  const financialAnalysis = buildingInsights.financialAnalyses?.[0];
  
  return {
    solarPotential: {
      annualEnergyPotential: annualEnergy,
      dailyAverage: annualEnergy / 365,
      monthlyAverage: annualEnergy / 12,
      peakPowerPotential: buildingInsights.maxArrayPanelsCount * 400,
      efficiency: 0.85,
      maxArrayPanelsCount: buildingInsights.maxArrayPanelsCount,
      maxArrayAreaMeters2: buildingInsights.wholeRoofStats?.areaMeters2,
      roofSegmentCount: buildingInsights.roofSegmentCount || 1
    },
    recommendations: financialAnalysis ? {
      financialAnalysis: {
        monthlyBill: parseFloat(financialAnalysis.monthlyBill?.units || '100'),
        solarPercentage: financialAnalysis.financialDetails?.solarPercentage || 85,
        federalIncentive: parseFloat(financialAnalysis.financialDetails?.federalIncentive?.units || '0'),
        netMeteringAllowed: financialAnalysis.financialDetails?.netMeteringAllowed !== false
      }
    } : null,
    location: { latitude, longitude },
    buildingInfo: {
      name: buildingInsights.name,
      center: buildingInsights.center,
      imageryDate: buildingInsights.imageryDate
    },
    factors: {
      latitude: latitude,
      longitude: longitude,
      roofArea: buildingInsights.wholeRoofStats?.areaMeters2 || 100,
      shading: 0.1,
      weather: 0.95
    }
  };
};
