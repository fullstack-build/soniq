import * as F1 from '../core';
import securePassword from 'secure-password';

export class Auth extends F1.AbstractPackage {
  private pwd;

  constructor() {
    super();

    this.pwd = securePassword(this.$one.getConfig('securePassword'));
  }

  public async register(username, password, tenant) {
    const pool = this.$one.getDbPool();
    return true;
  }

  public async login(username, password, tenant) {
    return true;
  }

}
