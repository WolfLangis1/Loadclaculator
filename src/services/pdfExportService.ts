import jsPDF from 'jspdf';
import type { 
  CalculationResults, 
  ProjectInformation, 
  LoadState, 
  CalculationMethod,
  PanelDetails,
  ProjectAttachment
} from '../types';
import { AttachmentService } from './attachmentService';

export const exportToPDF = async (
  calculations: CalculationResults,
  projectInfo: ProjectInformation,
  loads: LoadState,
  calculationMethod: CalculationMethod,
  mainBreaker: number,
  _panelDetails: PanelDetails,
  codeYear: string,
  squareFootage: number,
  _useEMS: boolean,
  _emsMaxLoad: number,
  loadManagementType: 'none' | 'ems' | 'simpleswitch' | 'dcc' = 'none',
  simpleSwitchMode: 'branch_sharing' | 'feeder_monitoring' = 'branch_sharing',
  simpleSwitchLoadA: {
    type: 'general' | 'hvac' | 'evse';
    id: number;
    name: string;
    amps: number;
  } | null = null,
  simpleSwitchLoadB: {
    type: 'general' | 'hvac' | 'evse';
    id: number;
    name: string;
    amps: number;
  } | null = null,
  projectId?: string
) => {
  const pdf = new jsPDF('portrait', 'mm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);
  let currentY = 18;

  // === PROFESSIONAL HEADER WITH BRANDING ===
  // Header background
  pdf.setFillColor(41, 55, 71); // Professional dark blue
  pdf.rect(margin, currentY - 8, contentWidth, 18, 'F');
  
  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ELECTRICAL LOAD CALCULATION REPORT', pageWidth / 2, currentY, { align: 'center' });
  
  // Subtitle
  currentY += 6;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const methodText = calculationMethod === 'optional' ? 'NEC 220.83 Optional Method' : 
                     calculationMethod === 'standard' ? 'NEC 220.42 Standard Method' : 
                     'NEC 220.87 Existing Dwelling Method';
  pdf.text(`${methodText} • NEC ${codeYear} Compliant`, pageWidth / 2, currentY, { align: 'center' });
  
  pdf.setTextColor(0, 0, 0); // Reset to black
  currentY += 12;

  // === PROJECT INFORMATION SECTION ===
  pdf.setFillColor(248, 250, 252); // Light gray background
  pdf.rect(margin, currentY, contentWidth, 16, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, currentY, contentWidth, 16);
  
  currentY += 4;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text('PROJECT INFORMATION', margin + 2, currentY);
  
  currentY += 5;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  
  const projectNameDisplay = (projectInfo.customerName || 'Not Specified').substring(0, 30);
  const address = `${projectInfo.propertyAddress || 'Not Specified'}, ${projectInfo.city || ''}, ${projectInfo.state || ''}`.substring(0, 45);
  const calculatedBy = (projectInfo.calculatedBy || 'Not Specified').substring(0, 25);
  
  // Two column layout for project info
  pdf.text(`Project: ${projectNameDisplay}`, margin + 2, currentY);
  pdf.text(`Square Footage: ${squareFootage.toLocaleString()} sq ft`, margin + contentWidth/2 + 5, currentY);
  
  currentY += 4;
  pdf.text(`Address: ${address}`, margin + 2, currentY);
  pdf.text(`Calculated By: ${calculatedBy}`, margin + contentWidth/2 + 5, currentY);
  
  currentY += 4;
  pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, margin + 2, currentY);
  pdf.text(`Service Size: ${mainBreaker} Amperes`, margin + contentWidth/2 + 5, currentY);
  
  pdf.setTextColor(0, 0, 0); // Reset to black
  currentY += 10;

  // === OPTIMIZED FULL-WIDTH LAYOUT ===
  const sectionWidth = contentWidth;
  
  // PART A: GENERAL LOADS - Full width section
  let sectionY = currentY;
  
  // Section header with background
  pdf.setFillColor(34, 197, 94); // Professional green
  pdf.rect(margin, sectionY - 3, sectionWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PART A: GENERAL LOADS', margin + 2, sectionY + 1);
  
  pdf.setTextColor(0, 0, 0);
  sectionY += 10;

  // THREE COLUMN TABLE LAYOUT FOR BETTER SPACE UTILIZATION
  const col1X = margin;
  const col2X = margin + (sectionWidth * 0.4);
  const col3X = margin + (sectionWidth * 0.7);
  const col4X = margin + (sectionWidth * 0.85);
  
  // Table header
  pdf.setFillColor(243, 244, 246);
  pdf.rect(margin, sectionY, sectionWidth, 6, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Load Description', col1X + 1, sectionY + 3);
  pdf.text('Calculation', col2X + 1, sectionY + 3);
  pdf.text('VA', col3X + 1, sectionY + 3);
  pdf.text('Circuit', col4X + 1, sectionY + 3);
  
  sectionY += 6;
  pdf.setFont('helvetica', 'normal');
  
  // Base loads with professional formatting
  const baseLoads = [
    ['General Lighting', `${squareFootage} × 3 VA/sq ft`, (squareFootage * 3).toLocaleString(), 'Multiple'],
    ['Small Appliance Circuits', '2 × 1,500 VA (NEC 210.11)', '3,000', '20A x2'],
    ['Laundry Circuit', '1 × 1,500 VA (NEC 210.11)', '1,500', '20A'],
    ['Bathroom Circuit', '1 × 1,500 VA (NEC 210.11)', '1,500', '20A']
  ];

  baseLoads.forEach(([desc, calc, va, circuit], index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, sectionY - 1, sectionWidth, 4, 'F');
    }
    pdf.setFontSize(7);
    pdf.text(desc, col1X + 1, sectionY + 2);
    pdf.text(calc, col2X + 1, sectionY + 2);
    pdf.text(va + ' VA', col3X + 1, sectionY + 2);
    pdf.text(circuit, col4X + 1, sectionY + 2);
    sectionY += 4;
  });

  // Active appliances section - SHOW ALL, NOT JUST 3
  const activeAppliances = loads.generalLoads.filter(load => load.quantity > 0);
  if (activeAppliances.length > 0) {
    sectionY += 2;
    pdf.setFillColor(243, 244, 246);
    pdf.rect(margin, sectionY, sectionWidth, 4, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Dedicated Appliance Circuits:', col1X + 1, sectionY + 2);
    sectionY += 4;
    
    pdf.setFont('helvetica', 'normal');
    activeAppliances.forEach((appliance, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, sectionY - 1, sectionWidth, 4, 'F');
      }
      const name = appliance.name.substring(0, 30);
      const circuitInfo = appliance.circuit || `${appliance.amps}A`;
      pdf.setFontSize(7);
      pdf.text(name, col1X + 1, sectionY + 2);
      pdf.text(`${appliance.quantity} × ${appliance.va.toLocaleString()} VA`, col2X + 1, sectionY + 2);
      pdf.text(appliance.total.toLocaleString() + ' VA', col3X + 1, sectionY + 2);
      pdf.text(circuitInfo, col4X + 1, sectionY + 2);
      sectionY += 4;
    });
  }

  // Demand calculation section
  sectionY += 3;
  pdf.setFillColor(59, 130, 246); // Professional blue
  pdf.rect(margin, sectionY - 2, sectionWidth, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('DEMAND FACTOR CALCULATION', margin + 2, sectionY + 1);
  
  pdf.setTextColor(0, 0, 0);
  sectionY += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  const baseGeneralVA = squareFootage * 3 + 6000;
  const applianceVA = calculations.applianceDemand || 0;
  const totalGeneralVA = baseGeneralVA + applianceVA;
  
  pdf.text(`Total General Load: ${totalGeneralVA.toLocaleString()} VA`, margin + 1, sectionY);
  sectionY += 5;

  // Demand factor calculation with professional formatting
  pdf.setFillColor(252, 252, 253);
  pdf.rect(margin, sectionY - 1, sectionWidth, 20, 'F');
  pdf.setDrawColor(229, 231, 235);
  pdf.rect(margin, sectionY - 1, sectionWidth, 20);
  
  if (calculationMethod === 'optional') {
    const first10kVA = Math.min(totalGeneralVA, 10000);
    const remainder = Math.max(totalGeneralVA - 10000, 0);
    
    pdf.text(`First 10,000 VA @ 100% (NEC 220.83):`, margin + 2, sectionY + 3);
    pdf.text(`${first10kVA.toLocaleString()} VA`, margin + 120, sectionY + 3);
    sectionY += 5;
    
    if (remainder > 0) {
      pdf.text(`Remainder @ 40% (NEC 220.83):`, margin + 2, sectionY + 3);
      pdf.text(`${(remainder * 0.4).toLocaleString()} VA`, margin + 120, sectionY + 3);
      sectionY += 5;
    }
  } else if (calculationMethod === 'standard') {
    const first3kVA = Math.min(totalGeneralVA, 3000);
    const next117kVA = Math.min(Math.max(totalGeneralVA - 3000, 0), 117000);
    
    pdf.text(`First 3,000 VA @ 100% (NEC 220.42):`, margin + 2, sectionY + 3);
    pdf.text(`${first3kVA.toLocaleString()} VA`, margin + 120, sectionY + 3);
    sectionY += 5;
    
    if (next117kVA > 0) {
      pdf.text(`Next 117,000 VA @ 35% (NEC 220.42):`, margin + 2, sectionY + 3);
      pdf.text(`${(next117kVA * 0.35).toLocaleString()} VA`, margin + 120, sectionY + 3);
      sectionY += 5;
    }
  }
  
  sectionY += 3;
  pdf.setFillColor(34, 197, 94);
  pdf.rect(margin, sectionY - 1, sectionWidth, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`Part A Total: ${(calculations.generalDemand || 0).toLocaleString()} VA`, margin + 2, sectionY + 2);
  pdf.setTextColor(0, 0, 0);
  sectionY += 10;

  // PART B: 100% LOADS - Full width
  pdf.setFillColor(239, 68, 68); // Professional red
  pdf.rect(margin, sectionY - 3, sectionWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PART B: 100% DEMAND LOADS', margin + 2, sectionY + 1);
  
  pdf.setTextColor(0, 0, 0);
  sectionY += 10;

  // Enhanced table with more details
  pdf.setFillColor(243, 244, 246);
  pdf.rect(margin, sectionY, sectionWidth, 6, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Load Type', col1X + 1, sectionY + 3);
  pdf.text('Details', col2X + 1, sectionY + 3);
  pdf.text('Demand (VA)', col3X + 1, sectionY + 3);
  pdf.text('Circuit', col4X + 1, sectionY + 3);
  
  sectionY += 6;
  pdf.setFont('helvetica', 'normal');

  const partBLoads: string[][] = [];
  
  // HVAC loads with more detail
  const activeHvacLoads = loads.hvacLoads.filter(load => load.quantity > 0);
  activeHvacLoads.forEach(hvacLoad => {
    const loadDetails = `${hvacLoad.quantity} × ${hvacLoad.amps}A @ ${hvacLoad.volts}V`;
    const circuitInfo = hvacLoad.circuit || `${hvacLoad.amps}A/${hvacLoad.volts}V`;
    partBLoads.push([hvacLoad.name, loadDetails, hvacLoad.total.toLocaleString(), circuitInfo]);
  });
  
  // EVSE loads with load management details
  const activeEvseLoads = loads.evseLoads.filter(load => load.quantity > 0);
  activeEvseLoads.forEach(evseLoad => {
    let evseLabel = evseLoad.name;
    let loadDetails = `${evseLoad.quantity} × ${evseLoad.amps}A @ ${evseLoad.volts}V`;
    let circuitInfo = evseLoad.circuit || `${evseLoad.amps}A/240V`;
    
    if (loadManagementType === 'simpleswitch') {
      if (simpleSwitchMode === 'branch_sharing') {
        const maxLoad = Math.max(simpleSwitchLoadA?.amps || 0, simpleSwitchLoadB?.amps || 0);
        loadDetails += ` (SimpleSwitch: ${maxLoad}A max)`;
      } else {
        loadDetails += ' (SimpleSwitch Feeder Monitor)';
      }
    } else if (loadManagementType === 'ems') {
      loadDetails += ' (EMS Managed)';
    } else if (loadManagementType === 'dcc') {
      loadDetails += ' (DCC Managed)';
    }
    
    partBLoads.push([evseLabel, loadDetails, evseLoad.total.toLocaleString(), circuitInfo]);
  });
  
  // Battery charging loads
  const activeBatteryLoads = loads.solarBatteryLoads.filter(load => load.type === 'battery' && load.quantity > 0);
  activeBatteryLoads.forEach(batteryLoad => {
    const loadDetails = `${batteryLoad.kw}kW Battery System`;
    const circuitInfo = `${batteryLoad.breaker}A/240V`;
    partBLoads.push([batteryLoad.name, loadDetails, batteryLoad.total.toLocaleString(), circuitInfo]);
  });

  if (partBLoads.length === 0) {
    pdf.setFillColor(249, 250, 251);
    pdf.rect(margin, sectionY - 1, sectionWidth, 4, 'F');
    pdf.setFontSize(8);
    pdf.text('No Part B loads present', col1X + 1, sectionY + 2);
    sectionY += 4;
  } else {
    partBLoads.forEach(([desc, details, va, circuit], index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, sectionY - 1, sectionWidth, 4, 'F');
      }
      pdf.setFontSize(7);
      pdf.text(desc.substring(0, 25), col1X + 1, sectionY + 2);
      pdf.text(details.substring(0, 35), col2X + 1, sectionY + 2);
      pdf.text(va + ' VA', col3X + 1, sectionY + 2);
      pdf.text(circuit, col4X + 1, sectionY + 2);
      sectionY += 4;
    });
  }

  const partBTotal = (calculations.hvacDemand || 0) + (calculations.evseDemand || 0) + (calculations.batteryChargingDemand || 0);
  sectionY += 1;
  pdf.setFillColor(239, 68, 68);
  pdf.rect(margin, sectionY - 1, sectionWidth, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`Part B Total: ${partBTotal.toLocaleString()} VA`, margin + 2, sectionY + 2);
  pdf.setTextColor(0, 0, 0);
  sectionY += 10;

  // CALCULATION SUMMARY - Full width below Part B
  pdf.setFillColor(99, 102, 241); // Professional indigo
  pdf.rect(margin, sectionY - 3, sectionWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LOAD CALCULATION SUMMARY', margin + 2, sectionY + 1);
  
  pdf.setTextColor(0, 0, 0);
  sectionY += 10;

  // Two column layout for summary
  const summaryCol1X = margin;
  const summaryCol2X = margin + (sectionWidth / 2);
  const summaryColWidth = (sectionWidth / 2) - 5;

  // Left summary column
  pdf.setFillColor(248, 250, 252);
  pdf.rect(summaryCol1X, sectionY, summaryColWidth, 25, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.rect(summaryCol1X, sectionY, summaryColWidth, 25);

  let summaryY = sectionY + 4;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CALCULATED DEMAND:', summaryCol1X + 2, summaryY);
  
  summaryY += 5;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text('Part A (General w/ Demand Factors):', summaryCol1X + 3, summaryY);
  pdf.text(`${(calculations.generalDemand || 0).toLocaleString()} VA`, summaryCol1X + summaryColWidth - 25, summaryY);
  summaryY += 4;
  
  pdf.text('Part B (100% Demand Loads):', summaryCol1X + 3, summaryY);
  pdf.text(`${partBTotal.toLocaleString()} VA`, summaryCol1X + summaryColWidth - 25, summaryY);
  summaryY += 5;
  
  // Total calculation
  pdf.setDrawColor(156, 163, 175);
  pdf.setLineWidth(0.3);
  pdf.line(summaryCol1X + 3, summaryY - 1, summaryCol1X + summaryColWidth - 3, summaryY - 1);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('TOTAL CALCULATED LOAD:', summaryCol1X + 3, summaryY);
  pdf.text(`${(calculations.totalVA || 0).toLocaleString()} VA`, summaryCol1X + summaryColWidth - 25, summaryY);
  summaryY += 4;
  pdf.text('TOTAL AMPERAGE @ 240V:', summaryCol1X + 3, summaryY);
  pdf.text(`${(calculations.totalAmps || 0).toFixed(1)} A`, summaryCol1X + summaryColWidth - 25, summaryY);

  // Right summary column - Service Analysis
  pdf.setFillColor(248, 250, 252);
  pdf.rect(summaryCol2X, sectionY, summaryColWidth, 25, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.rect(summaryCol2X, sectionY, summaryColWidth, 25);
  
  let serviceY = sectionY + 4;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SERVICE ANALYSIS:', summaryCol2X + 2, serviceY);
  
  serviceY += 4;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  
  const utilizationPercent = ((calculations.totalAmps || 0) / mainBreaker) * 100;
  const spareCapacityPercent = calculations.spareCapacity || 0;
  
  pdf.text(`Service Rating: ${mainBreaker} A`, summaryCol2X + 3, serviceY);
  serviceY += 3;
  pdf.text(`Calculated Load: ${(calculations.totalAmps || 0).toFixed(1)} A`, summaryCol2X + 3, serviceY);
  serviceY += 3;
  pdf.text(`Utilization: ${utilizationPercent.toFixed(1)}%`, summaryCol2X + 3, serviceY);
  serviceY += 3;
  pdf.text(`Spare Capacity: ${spareCapacityPercent.toFixed(1)}%`, summaryCol2X + 3, serviceY);
  serviceY += 4;
  
  // Service adequacy indicator
  let statusText = '';
  let statusColor: [number, number, number] = [0, 0, 0];
  let bgColor: [number, number, number] = [243, 244, 246];
  
  if (utilizationPercent < 100) {
    statusText = '✓ SERVICE ADEQUATE';
    statusColor = [21, 128, 61];
    bgColor = [220, 252, 231];
  } else {
    statusText = '✗ SERVICE UPGRADE REQUIRED';
    statusColor = [185, 28, 28];
    bgColor = [254, 226, 226];
  }
  
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.rect(summaryCol2X + 1, serviceY - 2, summaryColWidth - 2, 6, 'F');
  pdf.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.setLineWidth(1);
  pdf.rect(summaryCol2X + 1, serviceY - 2, summaryColWidth - 2, 6);
  
  pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text(statusText, summaryCol2X + summaryColWidth/2, serviceY + 1, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  sectionY += 30;

  // ADD LOAD MANAGEMENT DETAILS SECTION
  if (loadManagementType !== 'none') {
    pdf.setFillColor(147, 51, 234); // Professional purple
    pdf.rect(margin, sectionY - 3, sectionWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LOAD MANAGEMENT SYSTEM DETAILS', margin + 2, sectionY + 1);
    
    pdf.setTextColor(0, 0, 0);
    sectionY += 10;

    pdf.setFillColor(252, 252, 253);
    pdf.rect(margin, sectionY, sectionWidth, 25, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(margin, sectionY, sectionWidth, 25);
    
    sectionY += 4;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    
    if (loadManagementType === 'simpleswitch') {
      pdf.text('SimpleSwitch Load Management System (UL 916 Listed)', margin + 2, sectionY);
      sectionY += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      if (simpleSwitchMode === 'branch_sharing') {
        pdf.text(`Operating Mode: Branch Circuit Sharing`, margin + 3, sectionY);
        sectionY += 3;
        
        if (simpleSwitchLoadA && simpleSwitchLoadB) {
          pdf.text(`Load A: ${simpleSwitchLoadA.name} (${simpleSwitchLoadA.amps}A)`, margin + 3, sectionY);
          sectionY += 3;
          pdf.text(`Load B: ${simpleSwitchLoadB.name} (${simpleSwitchLoadB.amps}A)`, margin + 3, sectionY);
          sectionY += 3;
          pdf.text(`Maximum Shared Current: ${Math.max(simpleSwitchLoadA.amps, simpleSwitchLoadB.amps)}A`, margin + 3, sectionY);
        } else {
          pdf.text(`Load A and Load B not configured`, margin + 3, sectionY);
          sectionY += 3;
        }
        sectionY += 3;
        pdf.text('Complies with NEC 625.42(C) for automatic load management', margin + 3, sectionY);
      } else {
        pdf.text(`Operating Mode: Feeder Monitoring`, margin + 3, sectionY);
        sectionY += 3;
        pdf.text('Monitors service feeder to prevent overload conditions', margin + 3, sectionY);
        sectionY += 3;
        pdf.text('Automatically reduces EV charging when needed', margin + 3, sectionY);
        sectionY += 3;
        pdf.text('Complies with NEC 625.42(C) for automatic load management', margin + 3, sectionY);
      }
    } else if (loadManagementType === 'ems') {
      pdf.text('Energy Management System (NEC Article 750)', margin + 2, sectionY);
      sectionY += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('Centralized load management and demand response system', margin + 3, sectionY);
      sectionY += 3;
      pdf.text('Real-time monitoring and control of electrical loads', margin + 3, sectionY);
      sectionY += 3;
      pdf.text('Complies with NEC 625.42(C) for EVSE load management', margin + 3, sectionY);
    } else if (loadManagementType === 'dcc') {
      pdf.text('Demand Control Center (DCC)', margin + 2, sectionY);
      sectionY += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('Automatic demand limiting control system', margin + 3, sectionY);
      sectionY += 3;
      pdf.text('Prevents electrical loads from exceeding service capacity', margin + 3, sectionY);
      sectionY += 3;
      pdf.text('NEC compliant load shedding and demand control', margin + 3, sectionY);
    }
    
    sectionY += 8;
  }

  // WIRE SIZING RECOMMENDATIONS
  pdf.setFillColor(16, 185, 129); // Professional teal
  pdf.rect(margin, sectionY - 3, sectionWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WIRE SIZING RECOMMENDATIONS', margin + 2, sectionY + 1);
  
  pdf.setTextColor(0, 0, 0);
  sectionY += 10;

  // Wire sizing table
  pdf.setFillColor(243, 244, 246);
  pdf.rect(margin, sectionY, sectionWidth, 6, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Application', col1X + 1, sectionY + 3);
  pdf.text('Wire Size (Copper THWN)', col2X + 1, sectionY + 3);
  pdf.text('Conduit Size', col3X + 1, sectionY + 3);
  pdf.text('Protection', col4X + 1, sectionY + 3);
  
  sectionY += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  const wiringSizes = [
    [`Service Entrance (${mainBreaker}A)`, 
     mainBreaker <= 100 ? '#4 AWG' : mainBreaker <= 200 ? '4/0 AWG' : '350 MCM',
     mainBreaker <= 100 ? '1.25"' : mainBreaker <= 200 ? '2"' : '2.5"',
     `${mainBreaker}A Main Breaker`],
    ['EV Charger (48A)', '#6 AWG', '1"', '60A Breaker'],
    ['EV Charger (32A)', '#10 AWG', '3/4"', '40A Breaker'],
    ['Electric Range (40A)', '#8 AWG', '1"', '50A Breaker'],
    ['Electric Dryer (24A)', '#10 AWG', '3/4"', '30A Breaker'],
    ['HVAC Equipment', 'Per nameplate + 25%', 'Per wire size', 'Per equipment specs']
  ];

  wiringSizes.forEach(([application, wireSize, conduitSize, protection], index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, sectionY - 1, sectionWidth, 4, 'F');
    }
    pdf.text(application, col1X + 1, sectionY + 2);
    pdf.text(wireSize, col2X + 1, sectionY + 2);
    pdf.text(conduitSize, col3X + 1, sectionY + 2);
    pdf.text(protection, col4X + 1, sectionY + 2);
    sectionY += 4;
  });

  // Solar/Battery section (if present)
  if (calculations.solarCapacityKW > 0 || calculations.batteryCapacityKW > 0) {
    sectionY += 5;
    pdf.setFillColor(245, 158, 11); // Professional amber
    pdf.rect(margin, sectionY - 3, sectionWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RENEWABLE ENERGY SYSTEMS', margin + 2, sectionY + 1);
    
    pdf.setTextColor(0, 0, 0);
    sectionY += 10;

    pdf.setFillColor(252, 252, 253);
    pdf.rect(margin, sectionY, sectionWidth, 20, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(margin, sectionY, sectionWidth, 20);
    
    sectionY += 4;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    if (calculations.solarCapacityKW > 0) {
      pdf.text(`Solar PV System: ${calculations.solarCapacityKW.toFixed(1)} kW`, margin + 2, sectionY);
      sectionY += 3;
    }
    
    if (calculations.batteryCapacityKW > 0) {
      pdf.text(`Battery Storage: ${calculations.batteryCapacityKW.toFixed(1)} kW`, margin + 2, sectionY);
      sectionY += 3;
    }
    
    pdf.text('NEC 705.12 Interconnection Compliance:', margin + 2, sectionY);
    const interconnectionStatus = calculations.interconnectionCompliant ? 
      '✓ COMPLIANT' : '✗ NON-COMPLIANT';
    const statusColor = calculations.interconnectionCompliant ? [21, 128, 61] : [185, 28, 28];
    
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(interconnectionStatus, margin + 120, sectionY);
    pdf.setTextColor(0, 0, 0);
    sectionY += 6;
  }

  // Code compliance section
  if (calculations.warnings.length > 0 || calculations.errors.length > 0) {
    sectionY += 3;
    pdf.setFillColor(185, 28, 28);
    pdf.rect(margin, sectionY - 3, sectionWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CODE COMPLIANCE ISSUES', margin + 2, sectionY + 1);
    
    pdf.setTextColor(0, 0, 0);
    sectionY += 8;
    
    pdf.setFillColor(254, 242, 242);
    pdf.rect(margin, sectionY, sectionWidth, 10, 'F');
    
    sectionY += 4;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${calculations.errors.length} Error(s), ${calculations.warnings.length} Warning(s)`, margin + 2, sectionY);
    sectionY += 4;
    pdf.text('Review calculation transparency for details', margin + 2, sectionY);
    sectionY += 8;
  }

  // === AERIAL VIEW ATTACHMENTS SECTION ===
  if (projectId) {
    try {
      const exportAttachments = await AttachmentService.prepareAttachmentsForPDF(projectId);
      
      if (exportAttachments.length > 0) {
        // Add new page for attachments if needed
        if (sectionY > 200) {
          pdf.addPage();
          sectionY = 20;
        }
        
        // Section header
        sectionY += 10;
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, sectionY - 6, contentWidth, 12, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SITE DOCUMENTATION & AERIAL VIEWS', margin + 2, sectionY);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${exportAttachments.length} attachment(s) for permit application`, margin + 2, sectionY + 4);
        
        sectionY += 16;
        pdf.setTextColor(0, 0, 0);
        
        // Add each attachment
        for (const attachment of exportAttachments) {
          // Check if we need a new page
          if (sectionY > 220) {
            pdf.addPage();
            sectionY = 20;
          }
          
          // Attachment header
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(attachment.name, margin, sectionY);
          
          sectionY += 6;
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          
          // Metadata
          let metadataText = `Type: ${attachment.type.replace('_', ' ')} • Source: ${attachment.source.replace('_', ' ')}`;
          if (attachment.metadata.coordinates) {
            metadataText += ` • Location: ${attachment.metadata.coordinates.latitude.toFixed(4)}, ${attachment.metadata.coordinates.longitude.toFixed(4)}`;
          }
          if (attachment.metadata.zoom) {
            metadataText += ` • Zoom: ${attachment.metadata.zoom}`;
          }
          if (attachment.metadata.heading !== undefined) {
            metadataText += ` • Heading: ${attachment.metadata.heading}°`;
          }
          
          pdf.text(metadataText, margin, sectionY);
          sectionY += 8;
          
          // Add image if base64 data is available
          if (attachment.base64Data) {
            try {
              const imageWidth = Math.min(contentWidth * 0.8, 120);
              const imageHeight = (imageWidth * 0.75); // Maintain aspect ratio
              
              pdf.addImage(
                attachment.base64Data,
                'PNG',
                margin + (contentWidth - imageWidth) / 2, // Center the image
                sectionY,
                imageWidth,
                imageHeight
              );
              
              sectionY += imageHeight + 10;
            } catch (imageError) {
              console.error('Failed to add image to PDF:', imageError);
              pdf.setFontSize(8);
              pdf.setTextColor(220, 38, 38);
              pdf.text('Image could not be embedded in PDF', margin, sectionY);
              sectionY += 6;
              pdf.setTextColor(0, 0, 0);
            }
          }
          
          // Description
          if (attachment.description) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.text(attachment.description, margin, sectionY);
            sectionY += 8;
          }
          
          sectionY += 5; // Space between attachments
        }
      }
    } catch (attachmentError) {
      console.error('Failed to add attachments to PDF:', attachmentError);
      // Continue without attachments rather than failing the entire export
    }
  }

  // PROFESSIONAL FOOTER SECTION - Dynamic positioning
  sectionY += 5; // Add some space before footer
  const footerY = Math.min(sectionY, 255); // Ensure footer doesn't go off page
  
  // Professional footer with branding
  pdf.setFillColor(41, 55, 71);
  pdf.rect(margin, footerY - 8, contentWidth, 12, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ELECTRICAL LOAD CALCULATION REPORT', margin + 2, footerY - 2);
  
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`NEC ${codeYear} Compliant Calculation • Generated: ${new Date().toLocaleDateString()}`, margin + 2, footerY + 1);
  
  // Key metrics in footer
  const footerSpareCapacity = calculations.spareCapacity || 0;
  pdf.text(`Total Load: ${(calculations.totalAmps || 0).toFixed(1)}A`, margin + contentWidth - 60, footerY - 2);
  pdf.text(`Service: ${mainBreaker}A • Spare: ${footerSpareCapacity.toFixed(0)}%`, margin + contentWidth - 60, footerY + 1);
  
  pdf.setTextColor(0, 0, 0);

  // Professional disclaimer
  const disclaimerY = footerY + 6;
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(107, 114, 128);
  pdf.text('This calculation is based on NEC requirements and actual usage may vary. Consult local jurisdiction for specific requirements.', margin, disclaimerY);
  
  // Save the PDF with professional naming
  const projectNameFile = projectInfo.customerName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Project';
  const dateStamp = new Date().toISOString().split('T')[0];
  const fileName = `Electrical_Load_Calculation_${projectNameFile}_${dateStamp}.pdf`;
  pdf.save(fileName);
};