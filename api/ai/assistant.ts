import { getAssistantReply } from '../../src/server/assistantService';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const body = request.body && typeof request.body === 'object' ? request.body : {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return response.status(400).json({ error: 'Prompt is required' });

  try {
    const context = body.context && typeof body.context === 'object' ? body.context : undefined;
    return response.status(200).json(await getAssistantReply(prompt, context));
  } catch (error) {
    console.error('Assistant function failed:', error instanceof Error ? error.message : 'Unknown error');
    return response.status(500).json({ error: 'Failed to process assistant request' });
  }
}