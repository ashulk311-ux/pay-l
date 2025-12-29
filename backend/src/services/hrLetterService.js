const PDFDocument = require('pdfkit');
const { Employee, Company } = require('../models');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * HR Letter Generation Service
 * Generates various HR letters like Offer Letter, Relieving Letter, Experience Certificate, etc.
 */

class HRLetterService {
  constructor() {
    this.lettersDir = path.join(__dirname, '../../uploads/hr-letters');
    if (!fs.existsSync(this.lettersDir)) {
      fs.mkdirSync(this.lettersDir, { recursive: true });
    }
  }

  /**
   * Generate Offer Letter
   */
  async generateOfferLetter(employeeId, offerDetails) {
    try {
      const employee = await Employee.findByPk(employeeId, {
        include: [{ model: Company, as: 'company' }]
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const company = employee.company;
      const doc = new PDFDocument({ margin: 50 });
      const filename = `Offer_Letter_${employee.employeeCode}_${Date.now()}.pdf`;
      const filepath = path.join(this.lettersDir, filename);
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('OFFER LETTER', { align: 'center' });
      doc.moveDown();

      // Company details
      doc.fontSize(12).font('Helvetica-Bold').text(company.name || 'Company Name');
      doc.fontSize(10).font('Helvetica').text(company.address || '');
      doc.text(`Phone: ${company.phone || ''} | Email: ${company.email || ''}`);
      doc.moveDown();

      // Date
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.moveDown();

      // Candidate details
      doc.fontSize(12).font('Helvetica-Bold').text('Dear ' + (employee.firstName || 'Candidate') + ',');
      doc.moveDown();

      doc.fontSize(11).font('Helvetica').text(
        `We are pleased to offer you the position of ${offerDetails.designation || employee.designation || 'Employee'} ` +
        `in our ${offerDetails.department || employee.department || ''} department.`
      );
      doc.moveDown();

      // Terms and conditions
      doc.fontSize(12).font('Helvetica-Bold').text('Terms and Conditions:');
      doc.moveDown(0.5);

      const terms = [
        `Position: ${offerDetails.designation || employee.designation || 'N/A'}`,
        `Department: ${offerDetails.department || employee.department || 'N/A'}`,
        `Date of Joining: ${offerDetails.dateOfJoining || employee.dateOfJoining || 'N/A'}`,
        `CTC: ₹${offerDetails.ctc || offerDetails.grossSalary || 'N/A'}`,
        `Location: ${offerDetails.location || employee.location || company.address || 'N/A'}`,
        `Reporting Manager: ${offerDetails.reportingManager || 'N/A'}`,
        offerDetails.noticePeriod ? `Notice Period: ${offerDetails.noticePeriod}` : null,
        offerDetails.probationPeriod ? `Probation Period: ${offerDetails.probationPeriod}` : null
      ].filter(Boolean);

      terms.forEach(term => {
        doc.fontSize(10).font('Helvetica').text(`• ${term}`, { indent: 20 });
      });

      doc.moveDown();

      // Additional terms
      if (offerDetails.additionalTerms) {
        doc.fontSize(11).font('Helvetica').text(offerDetails.additionalTerms);
        doc.moveDown();
      }

      // Closing
      doc.text('We look forward to welcoming you to our team.');
      doc.moveDown();
      doc.text('Please confirm your acceptance of this offer by signing and returning a copy of this letter.');
      doc.moveDown(2);

      // Signature
      doc.text('Best Regards,');
      doc.moveDown();
      doc.text(offerDetails.issuedBy || 'HR Department');
      doc.text(company.name || '');

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            success: true,
            filepath,
            filename,
            downloadUrl: `/api/hr-letters/download/${filename}`
          });
        });
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Generate offer letter error:', error);
      throw error;
    }
  }

  /**
   * Generate Relieving Letter
   */
  async generateRelievingLetter(employeeId, relievingDetails) {
    try {
      const employee = await Employee.findByPk(employeeId, {
        include: [{ model: Company, as: 'company' }]
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const company = employee.company;
      const doc = new PDFDocument({ margin: 50 });
      const filename = `Relieving_Letter_${employee.employeeCode}_${Date.now()}.pdf`;
      const filepath = path.join(this.lettersDir, filename);
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('RELIEVING LETTER', { align: 'center' });
      doc.moveDown();

      // Company details
      doc.fontSize(12).font('Helvetica-Bold').text(company.name || 'Company Name');
      doc.fontSize(10).font('Helvetica').text(company.address || '');
      doc.text(`Phone: ${company.phone || ''} | Email: ${company.email || ''}`);
      doc.moveDown();

      // Date
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.moveDown();

      // Employee details
      doc.fontSize(12).font('Helvetica-Bold').text(`To,`);
      doc.text(`${employee.firstName} ${employee.lastName}`);
      doc.text(`Employee ID: ${employee.employeeCode}`);
      doc.text(employee.address || '');
      doc.moveDown();

      // Subject
      doc.fontSize(12).font('Helvetica-Bold').text('Subject: Relieving Letter', { align: 'center' });
      doc.moveDown();

      // Body
      doc.fontSize(11).font('Helvetica').text(
        `This is to certify that ${employee.firstName} ${employee.lastName} (Employee ID: ${employee.employeeCode}) ` +
        `was employed with ${company.name} from ${new Date(employee.dateOfJoining).toLocaleDateString('en-IN')} ` +
        `to ${new Date(relievingDetails.lastWorkingDate || new Date()).toLocaleDateString('en-IN')} ` +
        `in the capacity of ${employee.designation || 'Employee'}.`
      );
      doc.moveDown();

      doc.text(
        `During the tenure, ${employee.firstName} ${employee.lastName} has been found to be sincere, hardworking, ` +
        `and dedicated to the assigned duties.`
      );
      doc.moveDown();

      if (relievingDetails.clearanceStatus === 'cleared') {
        doc.text('All dues have been cleared and there are no outstanding obligations.');
        doc.moveDown();
      }

      doc.text('We wish him/her all the best for future endeavors.');
      doc.moveDown(2);

      // Signature
      doc.text('Best Regards,');
      doc.moveDown();
      doc.text(relievingDetails.issuedBy || 'HR Department');
      doc.text(company.name || '');

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            success: true,
            filepath,
            filename,
            downloadUrl: `/api/hr-letters/download/${filename}`
          });
        });
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Generate relieving letter error:', error);
      throw error;
    }
  }

  /**
   * Generate Experience Certificate
   */
  async generateExperienceCertificate(employeeId, experienceDetails) {
    try {
      const employee = await Employee.findByPk(employeeId, {
        include: [{ model: Company, as: 'company' }]
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const company = employee.company;
      const doc = new PDFDocument({ margin: 50 });
      const filename = `Experience_Certificate_${employee.employeeCode}_${Date.now()}.pdf`;
      const filepath = path.join(this.lettersDir, filename);
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('EXPERIENCE CERTIFICATE', { align: 'center' });
      doc.moveDown();

      // Company details
      doc.fontSize(12).font('Helvetica-Bold').text(company.name || 'Company Name');
      doc.fontSize(10).font('Helvetica').text(company.address || '');
      doc.text(`Phone: ${company.phone || ''} | Email: ${company.email || ''}`);
      doc.moveDown();

      // Date
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.moveDown();

      // Body
      doc.fontSize(11).font('Helvetica').text(
        `This is to certify that ${employee.firstName} ${employee.lastName} (Employee ID: ${employee.employeeCode}) ` +
        `has been working with ${company.name} from ${new Date(employee.dateOfJoining).toLocaleDateString('en-IN')} ` +
        `to ${experienceDetails.endDate ? new Date(experienceDetails.endDate).toLocaleDateString('en-IN') : 'Present'} ` +
        `as ${employee.designation || 'Employee'} in the ${employee.department || ''} department.`
      );
      doc.moveDown();

      doc.text(
        `During the period of employment, ${employee.firstName} ${employee.lastName} has demonstrated ` +
        `professional competence, dedication, and integrity in the performance of duties.`
      );
      doc.moveDown();

      if (experienceDetails.lastDrawnSalary) {
        doc.text(`Last drawn salary: ₹${experienceDetails.lastDrawnSalary}`);
        doc.moveDown();
      }

      doc.text('We wish him/her continued success in future endeavors.');
      doc.moveDown(2);

      // Signature
      doc.text('Best Regards,');
      doc.moveDown();
      doc.text(experienceDetails.issuedBy || 'HR Department');
      doc.text(company.name || '');

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            success: true,
            filepath,
            filename,
            downloadUrl: `/api/hr-letters/download/${filename}`
          });
        });
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Generate experience certificate error:', error);
      throw error;
    }
  }

  /**
   * Generate Salary Certificate
   */
  async generateSalaryCertificate(employeeId, salaryDetails) {
    try {
      const employee = await Employee.findByPk(employeeId, {
        include: [{ model: Company, as: 'company' }]
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const company = employee.company;
      const doc = new PDFDocument({ margin: 50 });
      const filename = `Salary_Certificate_${employee.employeeCode}_${Date.now()}.pdf`;
      const filepath = path.join(this.lettersDir, filename);
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('SALARY CERTIFICATE', { align: 'center' });
      doc.moveDown();

      // Company details
      doc.fontSize(12).font('Helvetica-Bold').text(company.name || 'Company Name');
      doc.fontSize(10).font('Helvetica').text(company.address || '');
      doc.text(`Phone: ${company.phone || ''} | Email: ${company.email || ''}`);
      doc.moveDown();

      // Date
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.moveDown();

      // Employee details
      doc.fontSize(12).font('Helvetica-Bold').text(`To Whom It May Concern,`);
      doc.moveDown();

      doc.fontSize(11).font('Helvetica').text(
        `This is to certify that ${employee.firstName} ${employee.lastName} (Employee ID: ${employee.employeeCode}) ` +
        `is currently employed with ${company.name} as ${employee.designation || 'Employee'}.`
      );
      doc.moveDown();

      // Salary details
      doc.fontSize(12).font('Helvetica-Bold').text('Salary Details:');
      doc.moveDown(0.5);

      const salaryInfo = [
        `Monthly Gross Salary: ₹${salaryDetails.grossSalary || 'N/A'}`,
        `Monthly Net Salary: ₹${salaryDetails.netSalary || 'N/A'}`,
        `Annual CTC: ₹${salaryDetails.annualCTC || 'N/A'}`,
        salaryDetails.basicSalary ? `Basic Salary: ₹${salaryDetails.basicSalary}` : null,
        salaryDetails.hra ? `HRA: ₹${salaryDetails.hra}` : null,
        salaryDetails.otherAllowances ? `Other Allowances: ₹${salaryDetails.otherAllowances}` : null
      ].filter(Boolean);

      salaryInfo.forEach(info => {
        doc.fontSize(10).font('Helvetica').text(`• ${info}`, { indent: 20 });
      });

      doc.moveDown();
      doc.text('This certificate is issued for official purposes only.');
      doc.moveDown(2);

      // Signature
      doc.text('Best Regards,');
      doc.moveDown();
      doc.text(salaryDetails.issuedBy || 'HR Department');
      doc.text(company.name || '');

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            success: true,
            filepath,
            filename,
            downloadUrl: `/api/hr-letters/download/${filename}`
          });
        });
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Generate salary certificate error:', error);
      throw error;
    }
  }
}

module.exports = new HRLetterService();



