import { hasConfiguredGeminiApiKey } from '../src/server/assistantService';

export default function handler(_request: any, response: any) {
  response.status(200).json({
    status: 'ok',
    hasGeminiKey: hasConfiguredGeminiApiKey(),
    timestamp: new Date().toISOString(),
  });
}