import { createHash } from 'node:crypto';

type JsonSchema = Record<string, unknown>;

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function responseText(response: OpenAIResponse) {
  if (response.output_text) return response.output_text;

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && content.text) return content.text;
    }
  }

  throw new Error('OPENAI_EMPTY_RESPONSE');
}

export async function generateStructuredJson<T>(params: {
  model: string;
  schemaName: string;
  schema: JsonSchema;
  instructions: string;
  input: unknown;
  userId: string;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_NOT_CONFIGURED');

  const safetyIdentifier = createHash('sha256')
    .update(`moveon:${params.userId}`)
    .digest('hex');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      store: false,
      safety_identifier: safetyIdentifier,
      reasoning: { effort: 'low' },
      instructions: params.instructions,
      input: JSON.stringify(params.input),
      text: {
        verbosity: 'low',
        format: {
          type: 'json_schema',
          name: params.schemaName,
          strict: true,
          schema: params.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OPENAI_REQUEST_FAILED:${response.status}:${detail.slice(0, 300)}`);
  }

  const payload = await response.json() as OpenAIResponse;
  return JSON.parse(responseText(payload)) as T;
}
