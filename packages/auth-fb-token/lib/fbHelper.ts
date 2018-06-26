
import axios from 'axios';
import * as crypto from 'crypto';

export class FbHelper {
  private config: any;
  private axios: any;
  private logger: any;

  constructor(config, logger) {
    this.config = config;
    this.logger = logger;

    this.axios = axios.create({
      baseURL: config.baseURL
    });
  }

  public async getProfile(token) {
    // Check token as described here: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#checktoken
    await this.debugToken(token);

    // Proof token: https://developers.facebook.com/docs/graph-api/securing-requests
    const proof = crypto.createHmac('sha256', this.config.clientSecret).update(token).digest('hex');

    const response = await this.axios.get(this.config.userPath, {
      params: {
        fields: this.config.fields.join(','),
        access_token: token,
        appsecret_proof: proof
      }
    });

    if (response.data.email == null) {
      throw new Error('An email adress is required for authentication. However, none has been provided by facebook.');
    }

    if (response.data.id == null) {
      throw new Error('An id is required for authentication. However, none has been provided by facebook.');
    }

    return response.data;
  }

  private async debugToken(token) {
    try {
      // Proof token: https://developers.facebook.com/docs/graph-api/securing-requests
      const proof = crypto.createHmac('sha256', this.config.clientSecret).update(token).digest('hex');

      const response = await this.axios.get(this.config.debugTokenPath, {
        params: {
          input_token: token,
          access_token: this.config.clientID + '|' + this.config.clientSecret,
          appsecret_proof: proof
        }
      });

      if (response != null && response.data != null && response.data.data != null) {
        const { data } = response.data;
        if (data.is_valid === true && data.app_id.toString() === this.config.clientID.toString()) {
          return true;
        } else {
          if (data.is_valid !== true) {
            throw new Error('Token is not valid.');
          }
          if (data.app_id.toString() !== this.config.clientID.toString()) {
            throw new Error('AppId does not match.');
          }
        }
      } else {
        throw new Error('Body is null.');
      }
    } catch (e) {
      this.logger.warn('Facebook access-token is not valid.', e);
      throw new Error('Facebook access-token is not valid.');
    }
  }
}
