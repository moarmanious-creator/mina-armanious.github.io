import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import { Partnership } from '../types/partnership';
import { calculateClearancePercentage, calculateDaysToExpiry } from '../data/initialPartnerships';

// Helper to format date
const getFormattedDate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

/**
 * Export Partnerships data to Excel (.xlsx) with multiple sheets and formatting
 */
export const exportToExcel = (partnerships: Partnership[], filename?: string) => {
  const name = filename || `Strategic_Partnerships_Register_${getFormattedDate()}.xlsx`;

  // 1. Main Register Sheet
  const registerRows = partnerships.map((p) => {
    const clearance = calculateClearancePercentage(p);
    const daysToExpiry = calculateDaysToExpiry(p.expiryDate);

    return {
      'Partnership ID': p.id,
      'Partner Name': p.partnerName,
      'Category': p.category,
      'Entity': p.entity,
      'Internal Owner': p.owner,
      'Scope of Agreement': p.scope.join('; '),
      'Document Type': p.documentType,
      'Document Status': p.documentStatus,
      'Pipeline Stage': p.stage,
      'Priority': p.priority,
      'Health Status': p.healthStatus || 'Green',
      'Clearance %': `${clearance}%`,
      'Growth Engine': p.valueDrivers.growthEngine ? 'Yes' : 'No',
      'Venture Clienting': p.valueDrivers.ventureClienting ? 'Yes' : 'No',
      'Startup Friendly Bank': p.valueDrivers.startupFriendlyBank ? 'Yes' : 'No',
      'Ecosystem Engagement': p.valueDrivers.ecosystemEngagement ? 'Yes' : 'No',
      'Investment': p.valueDrivers.investment ? 'Yes' : 'No',
      'Target Signature Date': p.targetSignatureDate || 'N/A',
      'Expiry Date': p.expiryDate || 'N/A',
      'Days to Expiry': daysToExpiry !== null ? daysToExpiry : 'N/A',
      'Internal SPOC': p.internalSPOC || 'N/A',
      'Partner SPOC': p.partnerSPOC || 'N/A',
      'Notes & Remarks': p.notes || '',
    };
  });

  const wsRegister = XLSX.utils.json_to_sheet(registerRows);

  // Auto column widths
  const colWidths = [
    { wch: 14 }, // ID
    { wch: 25 }, // Partner Name
    { wch: 22 }, // Category
    { wch: 18 }, // Entity
    { wch: 18 }, // Owner
    { wch: 35 }, // Scope
    { wch: 16 }, // Doc Type
    { wch: 18 }, // Doc Status
    { wch: 18 }, // Stage
    { wch: 12 }, // Priority
    { wch: 14 }, // Health Status
    { wch: 12 }, // Clearance
    { wch: 14 }, // Drivers...
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 }, // Dates
    { wch: 16 },
    { wch: 14 },
    { wch: 18 }, // SPOCs
    { wch: 18 },
    { wch: 30 }, // Notes
  ];
  wsRegister['!cols'] = colWidths;

  // 2. Executive Summary Sheet
  const total = partnerships.length;
  const avgClearance = total > 0 
    ? Math.round(partnerships.reduce((acc, p) => acc + calculateClearancePercentage(p), 0) / total) 
    : 0;
  const greenCount = partnerships.filter((p) => (p.healthStatus || 'Green') === 'Green').length;
  const amberCount = partnerships.filter((p) => p.healthStatus === 'Amber').length;
  const redCount = partnerships.filter((p) => p.healthStatus === 'Red').length;
  const completedCount = partnerships.filter((p) => p.healthStatus === 'Completed').length;
  const highPriorityCount = partnerships.filter((p) => p.priority === 'High').length;

  const summaryRows = [
    { 'Executive Metric': 'Total Registered Partnerships', 'Value': total, 'Notes': 'Active portfolio records' },
    { 'Executive Metric': 'Average Strategic Clearance %', 'Value': `${avgClearance}%`, 'Notes': 'Compliance & readiness index' },
    { 'Executive Metric': 'High Priority Agreements', 'Value': highPriorityCount, 'Notes': 'Requires executive oversight' },
    { 'Executive Metric': 'Health: Green (On Track)', 'Value': greenCount, 'Notes': 'Normal operational pace' },
    { 'Executive Metric': 'Health: Amber (Attention Needed)', 'Value': amberCount, 'Notes': 'At risk of milestone delay' },
    { 'Executive Metric': 'Health: Red (Blocked / Escalated)', 'Value': redCount, 'Notes': 'Immediate escalation required' },
    { 'Executive Metric': 'Health: Completed (Signed & Executed)', 'Value': completedCount, 'Notes': 'Fully finalized agreements' },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 35 }];

  // 3. Create Workbook & Append Sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsRegister, 'Partnership Register');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // Write file
  XLSX.writeFile(wb, name);
};

/**
 * Export Partnerships data to PDF document with Executive summary header and formatted table
 */
export const exportToPDF = (partnerships: Partnership[], filename?: string) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const name = filename || `Strategic_Partnerships_Report_${getFormattedDate()}.pdf`;

  // Colors
  const primaryColor: [number, number, number] = [112, 22, 39]; // #701627
  const goldColor: [number, number, number] = [217, 119, 6]; // amber-600
  const darkSlate: [number, number, number] = [30, 41, 59];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 24, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('STRATEGIC PARTNERSHIPS REGISTER & PORTFOLIO REPORT', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 226, 226);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}  |  Confidential & Proprietary`, 14, 18);

  // Summary Metrics Bar
  const total = partnerships.length;
  const avgClearance = total > 0 
    ? Math.round(partnerships.reduce((acc, p) => acc + calculateClearancePercentage(p), 0) / total) 
    : 0;
  const highCount = partnerships.filter((p) => p.priority === 'High').length;
  const greenCount = partnerships.filter((p) => (p.healthStatus || 'Green') === 'Green').length;
  const amberCount = partnerships.filter((p) => p.healthStatus === 'Amber').length;
  const redCount = partnerships.filter((p) => p.healthStatus === 'Red').length;
  const completedCount = partnerships.filter((p) => p.healthStatus === 'Completed').length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 28, 269, 14, 2, 2, 'FD');

  doc.setTextColor(...darkSlate);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  const summaryText = `Total Records: ${total}   |   Avg Clearance: ${avgClearance}%   |   High Priority: ${highCount}   |   Green: ${greenCount}   |   Amber: ${amberCount}   |   Red: ${redCount}   |   Completed: ${completedCount}`;
  doc.text(summaryText, 18, 36);

  // Table Columns & Rows
  const tableHeaders = [
    'ID',
    'Partner Name',
    'Category',
    'Entity',
    'Stage',
    'Priority',
    'Health',
    'Clearance',
    'Target / Expiry',
    'Owner / SPOC',
  ];

  const tableData = partnerships.map((p) => {
    const clearance = calculateClearancePercentage(p);
    const health = p.healthStatus || 'Green';
    const dates = `${p.targetSignatureDate || 'N/A'}\n${p.expiryDate ? `Exp: ${p.expiryDate}` : ''}`;
    const spoc = `${p.owner}\nSPOC: ${p.internalSPOC || 'N/A'}`;

    return [
      p.id,
      p.partnerName,
      p.category,
      p.entity,
      p.stage,
      p.priority,
      health,
      `${clearance}%`,
      dates,
      spoc,
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold' }, // ID
      1: { cellWidth: 42, fontStyle: 'bold' }, // Partner Name
      2: { cellWidth: 32 }, // Category
      3: { cellWidth: 26 }, // Entity
      4: { cellWidth: 32 }, // Stage
      5: { cellWidth: 18 }, // Priority
      6: { cellWidth: 20, fontStyle: 'bold' }, // Health
      7: { cellWidth: 20, halign: 'center' }, // Clearance
      8: { cellWidth: 30 }, // Dates
      9: { cellWidth: 33 }, // SPOC
    },
    didParseCell: (data) => {
      // Highlight Health Status
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw as string;
        if (val === 'Green') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (val === 'Amber') {
          data.cell.styles.textColor = [217, 119, 6];
        } else if (val === 'Red') {
          data.cell.styles.textColor = [225, 29, 72];
        } else if (val === 'Completed') {
          data.cell.styles.textColor = [37, 99, 235];
        }
      }
      // Highlight Priority
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw as string;
        if (val === 'High') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Strategic Partnerships Register • Page ${data.pageNumber} of ${totalPages}`,
        14,
        202
      );
    },
  });

  doc.save(name);
};

/**
 * Export Partnerships data to PowerPoint presentation (.pptx) with executive slides
 */
export const exportToPPTX = (partnerships: Partnership[], filename?: string) => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Strategic Partnerships Executive Report';
  pptx.author = 'Partnerships & Ecosystem Office';

  const primaryColorHex = '701627';
  const goldHex = 'D97706';
  const darkSlateHex = '1E293B';
  const lightBgHex = 'F8FAFC';

  const total = partnerships.length;
  const avgClearance = total > 0 
    ? Math.round(partnerships.reduce((acc, p) => acc + calculateClearancePercentage(p), 0) / total) 
    : 0;
  const highCount = partnerships.filter((p) => p.priority === 'High').length;
  const greenCount = partnerships.filter((p) => (p.healthStatus || 'Green') === 'Green').length;
  const amberCount = partnerships.filter((p) => p.healthStatus === 'Amber').length;
  const redCount = partnerships.filter((p) => p.healthStatus === 'Red').length;
  const completedCount = partnerships.filter((p) => p.healthStatus === 'Completed').length;

  // --------------------------------------------------------------------------
  // SLIDE 1: Title Slide
  // --------------------------------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { color: primaryColorHex };

  // Decorative accent line
  slide1.addShape('rect' as any, {
    x: 0.8,
    y: 1.8,
    w: 0.15,
    h: 3.5,
    fill: { color: goldHex },
    line: { color: goldHex },
  });

  slide1.addText('STRATEGIC PARTNERSHIPS REGISTER', {
    x: 1.2,
    y: 2.0,
    w: 10.5,
    h: 1.0,
    fontSize: 32,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
  });

  slide1.addText('Executive Portfolio & Governance Report', {
    x: 1.2,
    y: 2.9,
    w: 10.5,
    h: 0.6,
    fontSize: 20,
    color: 'FDE68A', // Amber/gold tint
    fontFace: 'Arial',
  });

  slide1.addText(
    `Single Source of Truth • Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}\nTotal Active Records: ${total} Agreements`,
    {
      x: 1.2,
      y: 4.2,
      w: 10.5,
      h: 0.8,
      fontSize: 13,
      color: 'FECDD3',
      fontFace: 'Arial',
    }
  );

  // --------------------------------------------------------------------------
  // SLIDE 2: Executive KPI & Health Overview
  // --------------------------------------------------------------------------
  const slide2 = pptx.addSlide();
  slide2.background = { color: lightBgHex };

  // Slide Header
  slide2.addShape('rect' as any, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.9,
    fill: { color: primaryColorHex },
  });

  slide2.addText('EXECUTIVE SUMMARY & HEALTH METRICS', {
    x: 0.6,
    y: 0.25,
    w: 11,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
  });

  // 4 KPI Cards across top
  const kpis = [
    { label: 'Total Partnerships', val: `${total}`, sub: 'Active Register', color: '1E293B' },
    { label: 'Avg Strategic Clearance', val: `${avgClearance}%`, sub: 'Compliance Index', color: '0284C7' },
    { label: 'High Priority', val: `${highCount}`, sub: 'Requires Oversight', color: 'DC2626' },
    { label: 'Completed Finalized', val: `${completedCount}`, sub: 'Signed Agreements', color: '16A34A' },
  ];

  kpis.forEach((kpi, idx) => {
    const xPos = 0.6 + idx * 3.05;
    // Card background
    slide2.addShape('rect' as any, {
      x: xPos,
      y: 1.2,
      w: 2.8,
      h: 1.6,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.1,
    });

    slide2.addText(kpi.label.toUpperCase(), {
      x: xPos + 0.2,
      y: 1.35,
      w: 2.4,
      h: 0.3,
      fontSize: 9,
      bold: true,
      color: '64748B',
      fontFace: 'Arial',
    });

    slide2.addText(kpi.val, {
      x: xPos + 0.2,
      y: 1.65,
      w: 2.4,
      h: 0.7,
      fontSize: 28,
      bold: true,
      color: kpi.color,
      fontFace: 'Arial',
    });

    slide2.addText(kpi.sub, {
      x: xPos + 0.2,
      y: 2.4,
      w: 2.4,
      h: 0.3,
      fontSize: 9,
      color: '94A3B8',
      fontFace: 'Arial',
    });
  });

  // Health Status Distribution Block
  slide2.addShape('rect' as any, {
    x: 0.6,
    y: 3.1,
    w: 12.1,
    h: 3.6,
    fill: { color: 'FFFFFF' },
    line: { color: 'CBD5E1', width: 1 },
  });

  slide2.addText('HEALTH STATUS BREAKDOWN & RISK PROFILE', {
    x: 0.9,
    y: 3.3,
    w: 11.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: primaryColorHex,
    fontFace: 'Arial',
  });

  const healthItems = [
    { status: 'Green (On Track)', count: greenCount, desc: 'Progressing according to schedule without governance blockers.', color: '16A34A', bg: 'DCFCE7' },
    { status: 'Amber (Attention Needed)', count: amberCount, desc: 'Minor delays or pending document clearance requiring follow-up.', color: 'D97706', bg: 'FEF3C7' },
    { status: 'Red (Blocked / Delayed)', count: redCount, desc: 'Critical blockers, legal hold, or immediate escalation needed.', color: 'DC2626', bg: 'FEE2E2' },
    { status: 'Completed (Signed & Final)', count: completedCount, desc: 'Fully executed contracts and operationalized partnerships.', color: '2563EB', bg: 'DBEAFE' },
  ];

  healthItems.forEach((h, idx) => {
    const yPos = 3.9 + idx * 0.68;
    slide2.addShape('rect' as any, {
      x: 0.9,
      y: yPos,
      w: 11.5,
      h: 0.55,
      fill: { color: h.bg },
      line: { color: h.color, width: 1 },
    });

    slide2.addText(`${h.status}: ${h.count}`, {
      x: 1.1,
      y: yPos + 0.1,
      w: 3.5,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: h.color,
      fontFace: 'Arial',
    });

    slide2.addText(h.desc, {
      x: 4.6,
      y: yPos + 0.1,
      w: 7.6,
      h: 0.35,
      fontSize: 10,
      color: darkSlateHex,
      fontFace: 'Arial',
    });
  });

  // --------------------------------------------------------------------------
  // SLIDE 3: Partnership Register Key Accounts Table
  // --------------------------------------------------------------------------
  const slide3 = pptx.addSlide();
  slide3.background = { color: lightBgHex };

  slide3.addShape('rect' as any, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.9,
    fill: { color: primaryColorHex },
  });

  slide3.addText('KEY PARTNERSHIPS PORTFOLIO SUMMARY', {
    x: 0.6,
    y: 0.25,
    w: 11,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
  });

  // Create table rows for top 10 records
  const pptTableHead = [
    { text: 'ID', options: { bold: true, fill: { color: primaryColorHex }, color: 'FFFFFF', fontSize: 9 } },
    { text: 'Partner Name', options: { bold: true, fill: { color: primaryColorHex }, color: 'FFFFFF', fontSize: 9 } },
    { text: 'Category', options: { bold: true, fill: { color: primaryColorHex }, color: 'FFFFFF', fontSize: 9 } },
    { text: 'Entity', options: { bold: true, fill: { color: primaryColorHex }, color: 'FFFFFF', fontSize: 9 } },
    { text: 'Stage', options: { bold: true, fill: { color: primaryColorHex }, color: 'FFFFFF', fontSize: 9 } },
    { text: 'Priority', options: { bold: true, fill: { color: primaryColorHex }, color: 'FFFFFF', fontSize: 9 } },
    { text: 'Health', options: { bold: true, fill: { color: primaryColorHex }, color: 'FFFFFF', fontSize: 9 } },
    { text: 'Clearance', options: { bold: true, fill: { color: primaryColorHex }, color: 'FFFFFF', fontSize: 9 } },
  ];

  const pptTableRows = partnerships.slice(0, 9).map((p) => {
    const clearance = calculateClearancePercentage(p);
    return [
      { text: p.id, options: { fontSize: 8, bold: true } },
      { text: p.partnerName, options: { fontSize: 8, bold: true } },
      { text: p.category, options: { fontSize: 8 } },
      { text: p.entity, options: { fontSize: 8 } },
      { text: p.stage, options: { fontSize: 8 } },
      { text: p.priority, options: { fontSize: 8, color: p.priority === 'High' ? 'DC2626' : '1E293B' } },
      { text: p.healthStatus || 'Green', options: { fontSize: 8, bold: true, color: p.healthStatus === 'Red' ? 'DC2626' : p.healthStatus === 'Amber' ? 'D97706' : '16A34A' } },
      { text: `${clearance}%`, options: { fontSize: 8 } },
    ];
  });

  slide3.addTable([pptTableHead, ...pptTableRows], {
    x: 0.6,
    y: 1.2,
    w: 12.1,
    colW: [0.8, 2.5, 2.2, 1.6, 2.0, 1.0, 1.0, 1.0],
    border: { pt: 1, color: 'E2E8F0' },
  });

  pptx.writeFile({ fileName: filename || `Strategic_Partnerships_Presentation_${getFormattedDate()}.pptx` });
};

/**
 * Quick CSV Export
 */
export const exportToCSV = (partnerships: Partnership[], filename?: string) => {
  const headers = [
    'Partnership ID',
    'Partner Name',
    'Category',
    'Entity',
    'Owner',
    'Scope',
    'Document Type',
    'Document Status',
    'Stage',
    'Priority',
    'Health Status',
    'Strategic Clearance %',
    'Growth Engine',
    'Venture Clienting',
    'Startup Friendly Bank',
    'Ecosystem Engagement',
    'Investment',
    'Target Signature Date',
    'Expiry Date',
    'Days to Expiry',
    'Internal SPOC',
    'Partner SPOC',
    'Notes',
  ];

  const rows = partnerships.map((p) => {
    const clearance = calculateClearancePercentage(p);
    const daysToExpiry = calculateDaysToExpiry(p.expiryDate) ?? '';

    return [
      `"${p.id}"`,
      `"${p.partnerName.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      `"${p.entity}"`,
      `"${p.owner}"`,
      `"${p.scope.join('; ').replace(/"/g, '""')}"`,
      `"${p.documentType}"`,
      `"${p.documentStatus}"`,
      `"${p.stage}"`,
      `"${p.priority}"`,
      `"${p.healthStatus || 'Green'}"`,
      `"${clearance}%"`,
      p.valueDrivers.growthEngine ? 'Yes' : 'No',
      p.valueDrivers.ventureClienting ? 'Yes' : 'No',
      p.valueDrivers.startupFriendlyBank ? 'Yes' : 'No',
      p.valueDrivers.ecosystemEngagement ? 'Yes' : 'No',
      p.valueDrivers.investment ? 'Yes' : 'No',
      `"${p.targetSignatureDate || ''}"`,
      `"${p.expiryDate || ''}"`,
      `"${daysToExpiry}"`,
      `"${p.internalSPOC || ''}"`,
      `"${p.partnerSPOC || ''}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename || `Strategic_Partnerships_Register_${getFormattedDate()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
