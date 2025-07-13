import jsPDF from 'jspdf';
import type { 
  CalculationResults, 
  ProjectInformation, 
  LoadState, 
  CalculationMethod,
  PanelDetails,
  ContractorInformation,
  AHJInformation
} from '../types';

// Default contractor and AHJ info (can be overridden)
const defaultContractor: ContractorInformation = {
  companyName: 'Your Company Name',
  address: '123 Main Street, City, State 12345',
  phone: '(555) 123-4567',
  email: 'info@yourcompany.com',
  licenseNumber: 'License #12345'
};

const defaultAHJ: AHJInformation = {
  jurisdictionName: '',
  inspectorName: '',
  inspectionDate: '',
  notes: '',
  approved: false
};

export const exportToPDF = (
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
  contractor: ContractorInformation = defaultContractor,
  ahj: AHJInformation = defaultAHJ
) => {
  const pdf = new jsPDF('portrait', 'mm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = 15;

  // === HEADER SECTION ===
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LOAD CALCULATION', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`NEC ${codeYear} Compliant`, pageWidth / 2, currentY, { align: 'center' });
  
  // Right side - Permit Information Box
  const permitBoxX = pageWidth - 60;
  const permitBoxY = 10;
  const permitBoxWidth = 55;
  const permitBoxHeight = 35;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(permitBoxX, permitBoxY, permitBoxWidth, permitBoxHeight);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BUILDING DEVELOPMENT', permitBoxX + 2, permitBoxY + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Permit #: ${projectInfo.permitNumber || 'N/A'}`, permitBoxX + 2, permitBoxY + 10);
  pdf.text(`Issue Date: ${projectInfo.issueDate || 'N/A'}`, permitBoxX + 2, permitBoxY + 15);
  pdf.text(`Approved By: ${projectInfo.approvedBy || 'N/A'}`, permitBoxX + 2, permitBoxY + 20);
  pdf.text(`PRN #: ${projectInfo.prnNumber || 'N/A'}`, permitBoxX + 2, permitBoxY + 25);

  currentY += 20;

  // === PROJECT INFORMATION SECTION ===
  const leftColX = 15;
  const rightColX = pageWidth - 85;
  const mainContentWidth = pageWidth - 120;

  // Main calculation area border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.rect(leftColX, currentY, mainContentWidth, 160);

  currentY += 8;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESIDENTIAL LOAD CALCULATION', leftColX + 5, currentY);
  
  currentY += 5;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const methodText = calculationMethod === 'optional' ? 'NEC 220.82: Existing Dwelling Unit' : 
                     calculationMethod === 'standard' ? 'NEC 220.42-220.55: Standard Method' :
                     'NEC 220.87: Existing Dwelling';
  pdf.text(`Load Calculation Performed per Section ${methodText}`, leftColX + 5, currentY);

  currentY += 10;

  // Customer Information Box
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.rect(leftColX + 5, currentY, mainContentWidth - 10, 20);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', leftColX + 8, currentY + 5);
  pdf.text('Address:', leftColX + 8, currentY + 10);
  pdf.text('Voltage:', leftColX + 8, currentY + 15);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(projectInfo.customerName || 'N/A', leftColX + 25, currentY + 5);
  pdf.text(`${projectInfo.propertyAddress || 'N/A'}, ${projectInfo.city || ''}, ${projectInfo.state || ''}`, leftColX + 25, currentY + 10);
  pdf.text('240V', leftColX + 25, currentY + 15);

  currentY += 25;

  // === PART A: GENERAL LOADS (NEC 220.82/220.83) ===
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Part A: First 8 kVA of load taken at 100% of load, remainder at 40% of load:', leftColX + 5, currentY);
  
  currentY += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Article 220.83 - (B)(1) General Lighting/Receptacle:', leftColX + 8, currentY);
  
  // General lighting table
  currentY += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Building Type', leftColX + 10, currentY);
  pdf.text('VA/SqFt', leftColX + 50, currentY);
  pdf.text('Total Square Footage', leftColX + 75, currentY);
  pdf.text('VA', leftColX + 120, currentY);
  pdf.text('Amps', leftColX + 135, currentY);
  
  currentY += 5;
  pdf.text('Dwelling Unit', leftColX + 10, currentY);
  pdf.text('3', leftColX + 50, currentY);
  pdf.text(squareFootage.toString(), leftColX + 75, currentY);
  pdf.text((squareFootage * 3).toLocaleString(), leftColX + 120, currentY);
  pdf.text(((squareFootage * 3) / 240).toFixed(1), leftColX + 135, currentY);

  currentY += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Article 220.83(B)(2) & (3) - Appliances fastened in place / on dedicated circuit:', leftColX + 8, currentY);
  
  // Appliances table headers
  currentY += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Circuit Name', leftColX + 10, currentY);
  pdf.text('VA', leftColX + 50, currentY);
  pdf.text('Circuit Name', leftColX + 75, currentY);
  pdf.text('VA', leftColX + 120, currentY);
  
  currentY += 5;
  
  // Small appliance and laundry circuits (these are the mandatory NEC 220.52 loads)
  pdf.text('Small Appliance #1', leftColX + 10, currentY);
  pdf.text('1500', leftColX + 50, currentY);
  pdf.text('Small Appliance #2', leftColX + 75, currentY);
  pdf.text('1500', leftColX + 120, currentY);
  
  currentY += 4;
  pdf.text('Laundry Circuit', leftColX + 10, currentY);
  pdf.text('1500', leftColX + 50, currentY);
  pdf.text('Bathroom Circuit', leftColX + 75, currentY);
  pdf.text('1500', leftColX + 120, currentY);
  
  // Add appliance loads dynamically
  const activeAppliances = loads.generalLoads.filter(load => load.quantity > 0);
  let applianceY = currentY;
  activeAppliances.forEach((appliance, index) => {
    if (index < 3) { // Show first 3 appliances
      applianceY += 4;
      pdf.text(appliance.name.substring(0, 15), leftColX + 10, applianceY);
      pdf.text(appliance.total.toLocaleString(), leftColX + 50, applianceY);
    }
  });

  currentY = Math.max(currentY + 15, applianceY + 10);

  // Calculation breakdown
  const baseGeneralVA = squareFootage * 3 + 3000 + 1500 + 1500; // Basic NEC 220.52 loads
  const applianceVA = calculations.applianceDemand || 0;
  const totalGeneralVA = baseGeneralVA + applianceVA;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total VA (from above): ${totalGeneralVA.toLocaleString()} VA`, leftColX + 25, currentY);
  
  // Show demand calculation transparency
  currentY += 5;
  const first8kVA = Math.min(totalGeneralVA, 8000);
  const remainder = Math.max(totalGeneralVA - 8000, 0);
  
  pdf.text(`8,000 VA taken at 100%: ${first8kVA.toLocaleString()} VA`, leftColX + 25, currentY);
  currentY += 4;
  pdf.text(`Remaining at 40%: ${remainder.toLocaleString()} x 40% = ${(remainder * 0.4).toLocaleString()} VA`, leftColX + 25, currentY);
  currentY += 4;
  pdf.text(`8000 + ${(remainder * 0.4).toLocaleString()} = ${(calculations.generalDemand || 0).toLocaleString()} VA`, leftColX + 25, currentY);
  
  // Part A Summary Box
  currentY += 8;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.rect(leftColX + 100, currentY - 2, 40, 15);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total VA', leftColX + 105, currentY + 3);
  pdf.text('Total Amps', leftColX + 120, currentY + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text((calculations.generalDemand || 0).toLocaleString(), leftColX + 105, currentY + 8);
  pdf.text(((calculations.generalDemand || 0) / 240).toFixed(1), leftColX + 120, currentY + 8);

  currentY += 20;

  // === PART B: HVAC AND OTHER LOADS ===
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Part B: Article 220.83(B) - Loads taken at 100% (A/C, Heating, etc.):', leftColX + 5, currentY);
  
  currentY += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('*Larger load of either the Heating or A/C Load will be used', leftColX + 8, currentY);
  
  currentY += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text('VA', leftColX + 120, currentY);
  pdf.text('Amps', leftColX + 135, currentY);
  
  currentY += 5;
  pdf.text('Heating / Cooling Load(s):', leftColX + 20, currentY);
  pdf.text((calculations.hvacDemand || 0).toLocaleString(), leftColX + 120, currentY);
  pdf.text(((calculations.hvacDemand || 0) / 240).toFixed(0), leftColX + 135, currentY);
  
  currentY += 8;
  pdf.text('EV Charger Load(s):', leftColX + 20, currentY);
  pdf.text((calculations.evseDemand || 0).toLocaleString(), leftColX + 120, currentY);
  pdf.text(((calculations.evseDemand || 0) / 240).toFixed(0), leftColX + 135, currentY);
  
  // Part B Summary Box
  currentY += 12;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.rect(leftColX + 100, currentY - 2, 40, 15);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total VA', leftColX + 105, currentY + 3);
  pdf.text('Total Amps', leftColX + 120, currentY + 3);
  pdf.setFont('helvetica', 'normal');
  const partBVA = (calculations.hvacDemand || 0) + (calculations.evseDemand || 0);
  pdf.text(partBVA.toLocaleString(), leftColX + 105, currentY + 8);
  pdf.text((partBVA / 240).toFixed(0), leftColX + 120, currentY + 8);

  currentY += 20;

  // === TOTAL CALCULATION ===
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total from Parts A & B:', leftColX + 5, currentY);
  
  currentY += 8;
  const partAVA = calculations.generalDemand || 0;
  
  // Summary table
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('VA', leftColX + 30, currentY);
  pdf.text('AMPS', leftColX + 55, currentY);
  
  currentY += 5;
  pdf.text('Part A', leftColX + 8, currentY);
  pdf.text(partAVA.toLocaleString(), leftColX + 30, currentY);
  pdf.text((partAVA / 240).toFixed(1), leftColX + 55, currentY);
  
  currentY += 4;
  pdf.text('Part B', leftColX + 8, currentY);
  pdf.text(partBVA.toLocaleString(), leftColX + 30, currentY);
  pdf.text((partBVA / 240).toFixed(0), leftColX + 55, currentY);
  
  currentY += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL', leftColX + 8, currentY);
  pdf.text((calculations.totalVA || 0).toLocaleString(), leftColX + 30, currentY);
  pdf.text((calculations.totalAmps || 0).toFixed(1), leftColX + 55, currentY);

  // Service adequacy box
  currentY += 10;
  pdf.setFontSize(11);
  pdf.text(`Main OCPD = ${mainBreaker}A`, leftColX + 80, currentY);
  
  currentY += 8;
  // Green box for total load
  pdf.setFillColor(144, 238, 144); // Light green
  pdf.rect(leftColX + 75, currentY - 5, 35, 12, 'F');
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Load:', leftColX + 77, currentY);
  pdf.text(`${(calculations.totalAmps || 0).toFixed(1)} Amps`, leftColX + 77, currentY + 5);

  // === RIGHT COLUMN: CUSTOMER & CONTRACTOR INFO ===
  const rightColWidth = 70;
  let rightY = 60;

  // Customer Information Box
  pdf.setFillColor(240, 240, 240);
  pdf.rect(rightColX, rightY, rightColWidth, 35, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(rightColX, rightY, rightColWidth, 35);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CUSTOMER INFORMATION', rightColX + 2, rightY + 5);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`NAME: ${projectInfo.customerName || 'N/A'}`, rightColX + 2, rightY + 10);
  pdf.text(`ADDRESS: ${projectInfo.propertyAddress || 'N/A'}`, rightColX + 2, rightY + 14);
  pdf.text(`${projectInfo.city || ''}, ${projectInfo.state || ''} ${projectInfo.zipCode || ''}`, rightColX + 2, rightY + 18);
  pdf.text(`PHONE: ${projectInfo.phone || 'N/A'}`, rightColX + 2, rightY + 22);
  pdf.text(`APN: ${projectInfo.jobNumber || 'N/A'}`, rightColX + 2, rightY + 26);
  pdf.text(`UTILITY: ${projectInfo.jurisdiction || 'N/A'}`, rightColX + 2, rightY + 30);

  rightY += 45;

  // Contractor Information Box
  pdf.setFillColor(240, 240, 240);
  pdf.rect(rightColX, rightY, rightColWidth, 35, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(rightColX, rightY, rightColWidth, 35);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONTRACTOR INFORMATION', rightColX + 2, rightY + 5);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(contractor.companyName, rightColX + 2, rightY + 10);
  pdf.text(contractor.address, rightColX + 2, rightY + 14);
  pdf.text(`Phone: ${contractor.phone}`, rightColX + 2, rightY + 18);
  pdf.text(`Email: ${contractor.email}`, rightColX + 2, rightY + 22);
  pdf.text(`License: ${contractor.licenseNumber}`, rightColX + 2, rightY + 26);

  rightY += 45;

  // Drawing Information Box
  pdf.setFillColor(240, 240, 240);
  pdf.rect(rightColX, rightY, rightColWidth, 25, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(rightColX, rightY, rightColWidth, 25);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DRAWING INFORMATION', rightColX + 2, rightY + 5);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`PRN NUMBER: ${projectInfo.prnNumber || 'N/A'}`, rightColX + 2, rightY + 10);
  pdf.text(`REV: A`, rightColX + 2, rightY + 14);
  pdf.text(`DATE: ${new Date().toLocaleDateString()}`, rightColX + 2, rightY + 18);
  pdf.text(`SHEET: E-01`, rightColX + 2, rightY + 22);

  // === AHJ STAMP AREA ===
  const stampY = pageHeight - 80;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(leftColX, stampY, 80, 50);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AUTHORITY HAVING JURISDICTION', leftColX + 5, stampY + 8);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('STAMP / APPROVAL:', leftColX + 5, stampY + 15);
  
  pdf.setFontSize(8);
  pdf.text(`Inspector: ${ahj.inspectorName || '_________________________'}`, leftColX + 5, stampY + 25);
  pdf.text(`Date: ${ahj.inspectionDate || '_____________'}`, leftColX + 5, stampY + 30);
  pdf.text(`Jurisdiction: ${ahj.jurisdictionName || '_________________________'}`, leftColX + 5, stampY + 35);
  
  if (ahj.notes) {
    pdf.text('Notes:', leftColX + 5, stampY + 40);
    const notesLines = pdf.splitTextToSize(ahj.notes, 70);
    pdf.text(notesLines, leftColX + 5, stampY + 44);
  }

  // === PROFESSIONAL CERTIFICATION ===
  const certY = pageHeight - 25;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROFESSIONAL CERTIFICATION', rightColX, certY);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Calculated by: ${projectInfo.calculatedBy || '_________________________'}`, rightColX, certY + 5);
  pdf.text(`License #: ${contractor.licenseNumber || '_____________'}`, rightColX, certY + 9);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, rightColX, certY + 13);
  pdf.text('Signature: _________________________', rightColX, certY + 17);

  // === FOOTER DISCLAIMERS ===
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This calculation is based on the National Electrical Code and should be verified by a licensed electrical professional.', 15, pageHeight - 10);
  pdf.text('Local codes and Authority Having Jurisdiction requirements may supersede NEC requirements.', 15, pageHeight - 6);

  // Save the PDF
  const fileName = `Load_Calculation_${projectInfo.customerName?.replace(/\s+/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};