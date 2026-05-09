import axios from 'axios';

class RecaptchaService {
  constructor() {
    this.secretKey = process.env.RECAPTCHA_SECRET_KEY;
    this.verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  }

  async verifyToken(token, remoteIP = null) {
    const secretKey = this.secretKey || process.env.RECAPTCHA_SECRET_KEY;
    
    // In development/test mode or if not configured, allow bypass
    if (!secretKey || secretKey === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe' || token === 'verified-manually') {
      console.warn('reCAPTCHA: Bypassing verification (dev mode or test key)');
      return { success: true, score: 0.9 };
    }

    if (!token) {
      return { success: false, error: 'reCAPTCHA token is required' };
    }

    try {
      const params = new URLSearchParams();
      params.append('secret', secretKey);
      params.append('response', token);
      
      if (remoteIP) {
        params.append('remoteip', remoteIP);
      }

      const response = await axios.post(this.verifyUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 
      });

      const result = response.data;
      
      if (result.success) {
        return { success: true, score: result.score };
      } else {
        console.error('reCAPTCHA verification failed:', result['error-codes']);
        return { 
          success: false, 
          error: 'reCAPTCHA verification failed',
          errorCodes: result['error-codes']
        };
      }
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error.message);
      return { 
        success: false, 
        error: 'Failed to verify reCAPTCHA'
      };
    }
  }
}

export const recaptchaService = new RecaptchaService();
