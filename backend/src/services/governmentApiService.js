const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Government API Integration Service for PF/ESI
 * This service integrates with official government portals for PF and ESI
 */

class GovernmentApiService {
  constructor() {
    // Base URLs for government APIs (these would be actual government portal URLs)
    this.pfBaseUrl = process.env.PF_API_BASE_URL || 'https://unifiedportal-epfo.epfindia.gov.in';
    this.esiBaseUrl = process.env.ESI_API_BASE_URL || 'https://www.esic.in';
    
    // API credentials (should be stored securely)
    this.pfCredentials = {
      username: process.env.PF_API_USERNAME,
      password: process.env.PF_API_PASSWORD,
      establishmentCode: process.env.PF_ESTABLISHMENT_CODE
    };
    
    this.esiCredentials = {
      username: process.env.ESI_API_USERNAME,
      password: process.env.ESI_API_PASSWORD,
      codeNumber: process.env.ESI_CODE_NUMBER
    };
  }

  /**
   * Authenticate with PF portal
   */
  async authenticatePF() {
    try {
      // This is a placeholder - actual implementation would use real PF portal API
      const response = await axios.post(`${this.pfBaseUrl}/api/auth/login`, {
        username: this.pfCredentials.username,
        password: this.pfCredentials.password
      });
      
      return response.data.token;
    } catch (error) {
      logger.error('PF Authentication error:', error);
      throw new Error('Failed to authenticate with PF portal');
    }
  }

  /**
   * Authenticate with ESI portal
   */
  async authenticateESI() {
    try {
      // This is a placeholder - actual implementation would use real ESI portal API
      const response = await axios.post(`${this.esiBaseUrl}/api/auth/login`, {
        username: this.esiCredentials.username,
        password: this.esiCredentials.password
      });
      
      return response.data.token;
    } catch (error) {
      logger.error('ESI Authentication error:', error);
      throw new Error('Failed to authenticate with ESI portal');
    }
  }

  /**
   * Submit PF challan/challan data
   */
  async submitPFChallan(companyId, month, year, pfData) {
    try {
      const token = await this.authenticatePF();
      
      const challanData = {
        establishmentCode: this.pfCredentials.establishmentCode,
        month,
        year,
        employees: pfData.map(emp => ({
          uan: emp.uan,
          employeeContribution: emp.employeePF,
          employerContribution: emp.employerPF,
          totalContribution: emp.totalPF
        })),
        totalEmployeeContribution: pfData.reduce((sum, emp) => sum + emp.employeePF, 0),
        totalEmployerContribution: pfData.reduce((sum, emp) => sum + emp.employerPF, 0),
        totalContribution: pfData.reduce((sum, emp) => sum + emp.totalPF, 0)
      };

      const response = await axios.post(
        `${this.pfBaseUrl}/api/challan/submit`,
        challanData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        challanNumber: response.data.challanNumber,
        receiptNumber: response.data.receiptNumber,
        submittedAt: new Date(),
        data: response.data
      };
    } catch (error) {
      logger.error('PF Challan submission error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Submit ESI challan/challan data
   */
  async submitESIChallan(companyId, month, year, esiData) {
    try {
      const token = await this.authenticateESI();
      
      const challanData = {
        codeNumber: this.esiCredentials.codeNumber,
        month,
        year,
        employees: esiData.map(emp => ({
          esiNumber: emp.esiNumber,
          employeeContribution: emp.employeeESI,
          employerContribution: emp.employerESI,
          totalContribution: emp.totalESI
        })),
        totalEmployeeContribution: esiData.reduce((sum, emp) => sum + emp.employeeESI, 0),
        totalEmployerContribution: esiData.reduce((sum, emp) => sum + emp.employerESI, 0),
        totalContribution: esiData.reduce((sum, emp) => sum + emp.totalESI, 0)
      };

      const response = await axios.post(
        `${this.esiBaseUrl}/api/challan/submit`,
        challanData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        challanNumber: response.data.challanNumber,
        receiptNumber: response.data.receiptNumber,
        submittedAt: new Date(),
        data: response.data
      };
    } catch (error) {
      logger.error('ESI Challan submission error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Verify UAN status
   */
  async verifyUAN(uan) {
    try {
      const token = await this.authenticatePF();
      
      const response = await axios.get(
        `${this.pfBaseUrl}/api/uan/verify/${uan}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        uan: response.data.uan,
        name: response.data.name,
        status: response.data.status,
        kycStatus: response.data.kycStatus
      };
    } catch (error) {
      logger.error('UAN verification error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Verify ESI number
   */
  async verifyESINumber(esiNumber) {
    try {
      const token = await this.authenticateESI();
      
      const response = await axios.get(
        `${this.esiBaseUrl}/api/esi/verify/${esiNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        esiNumber: response.data.esiNumber,
        name: response.data.name,
        status: response.data.status
      };
    } catch (error) {
      logger.error('ESI number verification error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get PF contribution history
   */
  async getPFContributionHistory(uan, fromDate, toDate) {
    try {
      const token = await this.authenticatePF();
      
      const response = await axios.get(
        `${this.pfBaseUrl}/api/uan/contributions`,
        {
          params: { uan, fromDate, toDate },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        contributions: response.data.contributions
      };
    } catch (error) {
      logger.error('PF contribution history error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get ESI contribution history
   */
  async getESIContributionHistory(esiNumber, fromDate, toDate) {
    try {
      const token = await this.authenticateESI();
      
      const response = await axios.get(
        `${this.esiBaseUrl}/api/esi/contributions`,
        {
          params: { esiNumber, fromDate, toDate },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        contributions: response.data.contributions
      };
    } catch (error) {
      logger.error('ESI contribution history error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Download PF challan
   */
  async downloadPFChallan(challanNumber) {
    try {
      const token = await this.authenticatePF();
      
      const response = await axios.get(
        `${this.pfBaseUrl}/api/challan/download/${challanNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'arraybuffer'
        }
      );

      return {
        success: true,
        pdf: Buffer.from(response.data),
        filename: `PF_Challan_${challanNumber}.pdf`
      };
    } catch (error) {
      logger.error('PF challan download error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Download ESI challan
   */
  async downloadESIChallan(challanNumber) {
    try {
      const token = await this.authenticateESI();
      
      const response = await axios.get(
        `${this.esiBaseUrl}/api/challan/download/${challanNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'arraybuffer'
        }
      );

      return {
        success: true,
        pdf: Buffer.from(response.data),
        filename: `ESI_Challan_${challanNumber}.pdf`
      };
    } catch (error) {
      logger.error('ESI challan download error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new GovernmentApiService();



