import { HealthResponse, THealthResponse } from '../schemas/health.schema';

export class HealthService {
  async execute(): Promise<THealthResponse> {
    return HealthResponse.parse('ok');
  }
}

export const healthService = new HealthService();
