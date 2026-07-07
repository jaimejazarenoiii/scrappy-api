import type { RootResponseDto } from '../dtos/root-response.dto.js';
import { ServiceIdentity } from '../../domain/value-objects/service-identity.js';

/**
 * Use case: returns application identity information for GET /.
 */
export class GetRootUseCase {
  /**
   * @returns Root response DTO with API name, version, and status
   */
  execute(): RootResponseDto {
    const identity = ServiceIdentity.createDefault();
    return {
      name: identity.name,
      version: identity.version,
      status: identity.status,
    };
  }
}
