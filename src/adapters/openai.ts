export interface OpenAIResponseResult {
  id: string;
  text: string;
  functionCalls: Array<{ name: string; args: Record<string, any>; callId: string }>;
}

type OpenAIInputItem =
  | string
  | { type: "function_call_output"; call_id: string; output: string };

function normalizeSchemaType(type: any): any {
  if (typeof type !== "string") return type;
  const normalized = type.toLowerCase();
  return ["object", "array", "string", "number", "integer", "boolean", "null"].includes(normalized)
    ? normalized
    : type;
}

function normalizeSchema(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  const result: Record<string, any> = { ...schema };
  if (result.type) result.type = normalizeSchemaType(result.type);
  if (result.properties && typeof result.properties === "object") {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([key, value]) => [key, normalizeSchema(value)])
    );
  }
  if (result.items) result.items = normalizeSchema(result.items);
  if (result.additionalProperties && typeof result.additionalProperties === "object") {
    result.additionalProperties = normalizeSchema(result.additionalProperties);
  }
  return result;
}

export function toOpenAITools(functionDeclarations: any[] = []) {
  return functionDeclarations.map((fn) => ({
    type: "function",
    name: fn.name,
    description: fn.description,
    parameters: normalizeSchema(fn.parameters),
  }));
}

function extractOutputText(response: any): string {
  if (typeof response?.output_text === "string") return response.output_text;
  const parts: string[] = [];
  for (const item of response?.output || []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n");
}

function extractFunctionCalls(response: any) {
  return (response?.output || [])
    .filter((item: any) => item?.type === "function_call")
    .map((item: any) => ({
      name: String(item.name),
      args: JSON.parse(item.arguments || "{}"),
      callId: String(item.call_id),
    }));
}

export async function callOpenAIResponses(options: {
  model: string;
  instructions: string;
  input: OpenAIInputItem[];
  tools?: any[];
  previousResponseId?: string;
  textFormat?: any;
}): Promise<OpenAIResponseResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const body: Record<string, any> = {
    model: options.model,
    instructions: options.instructions,
    input: options.input,
    reasoning: { effort: "medium" },
  };

  if (options.tools?.length) body.tools = options.tools;
  if (options.previousResponseId) body.previous_response_id = options.previousResponseId;
  if (options.textFormat) body.text = { format: options.textFormat };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI Responses API returned HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    id: String(payload?.id || ""),
    text: extractOutputText(payload),
    functionCalls: extractFunctionCalls(payload),
  };
}
