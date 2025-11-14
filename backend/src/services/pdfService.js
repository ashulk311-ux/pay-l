const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { Company, Employee } = require('../models');

/**
 * Generate payslip PDF with company branding
 * @param {Object} payslip - Payslip object with employee and payroll data
 * @param {Object} company - Company object with branding info
 * @returns {String} Path to generated PDF file
 */
async function generatePayslipPDF(payslip, company = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get company info if not provided
      if (!company && payslip.employee) {
        company = await Company.findByPk(payslip.employee.companyId);
      }

      // Create uploads/payslips directory if it doesn't exist
      const payslipsDir = path.join(__dirname, '../../uploads/payslips');
      if (!fs.existsSync(payslipsDir)) {
        fs.mkdirSync(payslipsDir, { recursive: true });
      }

      // Generate filename
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[payslip.month - 1];
      const employeeCode = payslip.employee?.employeeCode || payslip.employeeId || 'EMP';
      const filename = `payslip_${employeeCode}_${monthName}_${payslip.year}.pdf`;
      const filepath = path.join(payslipsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Payslip - ${monthName} ${payslip.year}`,
          Author: company?.name || 'Payroll System',
          Subject: 'Employee Payslip'
        }
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Company branding header
      const headerColor = company?.theme?.primaryColor || '#1976d2';
      const headerTextColor = company?.theme?.headerTextColor || '#ffffff';

      // Header with company logo and info
      doc.rect(0, 0, 595, 120)
        .fillColor(headerColor)
        .fill();

      doc.fillColor(headerTextColor)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(company?.name || 'Company Name', 50, 30, { align: 'left' });

      if (company?.address) {
        doc.fontSize(10)
          .font('Helvetica')
          .text(company.address, 50, 55, { align: 'left' });
      }

      if (company?.email || company?.phone) {
        const contactInfo = [company.email, company.phone].filter(Boolean).join(' | ');
        doc.fontSize(9)
          .text(contactInfo, 50, 70, { align: 'left' });
      }

      // Payslip title
      doc.fillColor('#000000')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('PAYSLIP', 400, 30, { align: 'right' });

      doc.fontSize(12)
        .font('Helvetica')
        .text(`${monthName} ${payslip.year}`, 400, 55, { align: 'right' });

      // Employee information section
      doc.moveDown(2);
      doc.fillColor('#333333')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Employee Information', 50, 140);

      // Employee details table
      const employeeInfo = payslip.employee || {};
      const empY = 165;
      let currentY = empY;

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000');

      // Employee Code
      doc.text('Employee Code:', 50, currentY);
      doc.font('Helvetica-Bold')
        .text(employeeInfo.employeeCode || 'N/A', 150, currentY);
      doc.font('Helvetica');

      // Employee Name
      currentY += 20;
      doc.text('Employee Name:', 50, currentY);
      doc.font('Helvetica-Bold')
        .text(`${employeeInfo.firstName || ''} ${employeeInfo.lastName || ''}`.trim() || 'N/A', 150, currentY);
      doc.font('Helvetica');

      // Designation
      currentY += 20;
      doc.text('Designation:', 50, currentY);
      doc.text(employeeInfo.designation || 'N/A', 150, currentY);

      // Department
      currentY += 20;
      doc.text('Department:', 50, currentY);
      doc.text(employeeInfo.department || 'N/A', 150, currentY);

      // Bank Details (if available)
      if (employeeInfo.bankAccountNumber) {
        currentY += 20;
        doc.text('Bank A/C:', 50, currentY);
        doc.text(employeeInfo.bankAccountNumber || 'N/A', 150, currentY);
      }

      // Attendance Summary
      currentY += 30;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Attendance Summary', 50, currentY);

      currentY += 20;
      doc.fontSize(10)
        .font('Helvetica');
      doc.text(`Days Worked: ${payslip.daysWorked || 0}`, 50, currentY);
      doc.text(`Days Present: ${payslip.daysPresent || 0}`, 200, currentY);
      doc.text(`Days Absent: ${payslip.daysAbsent || 0}`, 350, currentY);

      // Earnings section
      currentY += 40;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Earnings', 50, currentY);

      currentY += 25;
      const earnings = payslip.earnings || {};
      const earningsY = currentY;

      // Earnings table header
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, currentY)
        .text('Amount (₹)', 450, currentY, { align: 'right' });

      currentY += 20;
      doc.font('Helvetica')
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();

      currentY += 15;

      // Basic Salary
      if (earnings.basic) {
        doc.text('Basic Salary', 50, currentY);
        doc.text(formatCurrency(earnings.basic), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // HRA
      if (earnings.hra) {
        doc.text('House Rent Allowance (HRA)', 50, currentY);
        doc.text(formatCurrency(earnings.hra), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // Special Allowance
      if (earnings.specialAllowance) {
        doc.text('Special Allowance', 50, currentY);
        doc.text(formatCurrency(earnings.specialAllowance), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // Other Allowances
      if (earnings.otherAllowances && typeof earnings.otherAllowances === 'object') {
        Object.keys(earnings.otherAllowances).forEach(key => {
          const amount = earnings.otherAllowances[key];
          if (amount && amount > 0) {
            doc.text(key, 50, currentY);
            doc.text(formatCurrency(amount), 450, currentY, { align: 'right' });
            currentY += 18;
          }
        });
      }

      // Supplementary
      if (earnings.supplementary) {
        doc.text('Supplementary (Arrears/Incentives)', 50, currentY);
        doc.text(formatCurrency(earnings.supplementary), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      currentY += 5;
      doc.strokeColor('#000000')
        .lineWidth(1)
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();

      currentY += 10;
      doc.font('Helvetica-Bold')
        .text('Gross Salary', 50, currentY);
      doc.text(formatCurrency(earnings.adjustedGrossSalary || earnings.grossSalary || 0), 450, currentY, { align: 'right' });

      // Deductions section
      currentY += 40;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Deductions', 50, currentY);

      currentY += 25;
      const deductions = payslip.deductions || {};

      // Deductions table header
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, currentY)
        .text('Amount (₹)', 450, currentY, { align: 'right' });

      currentY += 20;
      doc.font('Helvetica')
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();

      currentY += 15;

      // PF
      if (deductions.pf) {
        doc.text('Provident Fund (PF)', 50, currentY);
        doc.text(formatCurrency(deductions.pf), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // ESI
      if (deductions.esi) {
        doc.text('Employee State Insurance (ESI)', 50, currentY);
        doc.text(formatCurrency(deductions.esi), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // TDS
      if (deductions.tds) {
        doc.text('Tax Deducted at Source (TDS)', 50, currentY);
        doc.text(formatCurrency(deductions.tds), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // PT
      if (deductions.pt) {
        doc.text('Professional Tax (PT)', 50, currentY);
        doc.text(formatCurrency(deductions.pt), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // LWF
      if (deductions.lwf) {
        doc.text('Labour Welfare Fund (LWF)', 50, currentY);
        doc.text(formatCurrency(deductions.lwf), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // Loan
      if (deductions.loan) {
        doc.text('Loan Deduction', 50, currentY);
        doc.text(formatCurrency(deductions.loan), 450, currentY, { align: 'right' });
        currentY += 18;
      }

      // Other Deductions
      if (deductions.otherDeductions && typeof deductions.otherDeductions === 'object') {
        Object.keys(deductions.otherDeductions).forEach(key => {
          const amount = deductions.otherDeductions[key];
          if (amount && amount > 0) {
            doc.text(key, 50, currentY);
            doc.text(formatCurrency(amount), 450, currentY, { align: 'right' });
            currentY += 18;
          }
        });
      }

      currentY += 5;
      doc.strokeColor('#000000')
        .lineWidth(1)
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();

      currentY += 10;
      doc.font('Helvetica-Bold')
        .text('Total Deductions', 50, currentY);
      doc.text(formatCurrency(deductions.totalDeductions || payslip.totalDeductions || 0), 450, currentY, { align: 'right' });

      // Net Salary section
      currentY += 30;
      doc.rect(50, currentY, 495, 40)
        .fillColor('#f0f0f0')
        .fill();

      currentY += 15;
      doc.fillColor('#000000')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Net Salary', 50, currentY);
      doc.text(formatCurrency(payslip.netSalary || 0), 450, currentY, { align: 'right' });

      // Footer
      const footerY = 750;
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('This is a system generated document. No signature required.', 50, footerY, { align: 'center', width: 495 });

      doc.fontSize(8)
        .text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, footerY + 15, { align: 'center', width: 495 });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        logger.info(`Payslip PDF generated: ${filepath}`);
        resolve(filepath);
      });

      stream.on('error', (error) => {
        logger.error('Error generating PDF:', error);
        reject(error);
      });

    } catch (error) {
      logger.error('Error in generatePayslipPDF:', error);
      reject(error);
    }
  });
}

/**
 * Format number as Indian currency
 * @param {Number} amount - Amount to format
 * @returns {String} Formatted currency string
 */
function formatCurrency(amount) {
  if (!amount) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Generate multiple payslip PDFs in batch
 * @param {Array} payslips - Array of payslip objects
 * @returns {Array} Array of generated PDF file paths
 */
async function generateBulkPayslipPDFs(payslips) {
  const results = [];
  
  for (const payslip of payslips) {
    try {
      const pdfPath = await generatePayslipPDF(payslip);
      results.push({
        payslipId: payslip.id,
        employeeId: payslip.employeeId,
        success: true,
        pdfPath
      });
    } catch (error) {
      logger.error(`Error generating PDF for payslip ${payslip.id}:`, error);
      results.push({
        payslipId: payslip.id,
        employeeId: payslip.employeeId,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = {
  generatePayslipPDF,
  generateBulkPayslipPDFs,
  formatCurrency
};

