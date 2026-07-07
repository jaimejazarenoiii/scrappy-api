import { API_NAME, API_STATUS_RUNNING, API_VERSION } from '../../shared/constants/app.constants.js';

/**
 * Value object representing the service identity exposed at GET /.
 */
export class ServiceIdentity {
  public readonly name: string;
  public readonly version: string;
  public readonly status: string;

  /**
   * @param name - API display name
   * @param version - Semantic version
   * @param status - Runtime status indicator
   */
  constructor(name: string, version: string, status: string) {
    this.name = name;
    this.version = version;
    this.status = status;
  }

  /**
   * Creates the default service identity for Scrappy API.
   * @returns ServiceIdentity instance
   */
  static createDefault(): ServiceIdentity {
    return new ServiceIdentity(API_NAME, API_VERSION, API_STATUS_RUNNING);
  }
}
