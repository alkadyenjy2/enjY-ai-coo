export interface MetaModelResponseResult {
  id: string;
  text: string;
  functionCalls: Array<{ name: string; args: Record<string, any>; callId: string }>;
}

type MetaInputItem =
  | string
  | { type: "function_call_output"; call_id: string; output: string };

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

export async function callMetaModelResponses(options: {
  model: string;
  instructions: string;
  input: MetaInputItem[];
  tools?: any[];
  previousResponseId?: string;
  textFormat?: any;
}): Promise<MetaModelResponseResult> {
  const apiKey = process.env.META_MODEL_API_KEY?.trim();
  if (!apiKey) throw new Error("META_MODEL_API_KEY is not configured.");

  const body: Record<string, any> = {
    model: options.model,
    instructions: options.instructions,
    input: options.input,
    reasoning: { effort: "medium" },
  };

  if (options.tools?.length) body.tools = options.tools;
  if (options.previousResponseId) body.previous_response_id = options.previousResponseId;
  if (options.textFormat) body.text = { format: options.textFormat };

  const response = await fetch("https://api.meta.ai/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Meta Model API returned HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    id: String(payload?.id || ""),
    text: extractOutputText(payload),
    functionCalls: extractFunctionCalls(payload),
  };
}
