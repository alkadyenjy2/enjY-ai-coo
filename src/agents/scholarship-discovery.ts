import { adminClient } from "../execution/durable-jobs";

export interface ScholarshipDiscoveryResult {
  id: string;
  title: string;
  provider: string;
  country: string | null;
  level: string | null;
  field: string | null;
  funding_type: string | null;
  amount: number | null;
  currency: string | null;
  deadline: string | null;
  official_source_url: string;
  source_status: "VERIFIED" | "NEEDS_VERIFICATION" | "STALE" | "CLOSED";
}

export function isScholarshipDiscoveryIntent(prompt: string): boolean {
  return /(scholarship|scholarships|منحة|منح|ابتعاث|بعثة|فرص منح)/i.test(prompt.trim());
}

export async function discoverScholarships(limit = 5): Promise<ScholarshipDiscoveryResult[]> {
  const now = new Date().toISOString();
  const client = adminClient();
  const { data, error } = await client
    .schema("scholarship_os")
    .from("scholarships")
    .select("id,title,provider,country,level,field,funding_type,amount,currency,deadline,official_source_url,source_status")
    .eq("source_status", "VERIFIED")
    .or(`deadline.is.null,deadline.gte.${now}`)
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(Math.min(Math.max(limit, 1), 10));

  if (error) throw new Error(`SCHOLARSHIP_DISCOVERY_FAILED:${error.message}`);
  return (data || []) as ScholarshipDiscoveryResult[];
}

export function formatScholarshipResults(items: ScholarshipDiscoveryResult[]): string {
  if (items.length === 0) return "لم أجد منحًا موثقة ومتاحة حاليًا في قاعدة Scholarship OS. لم أعتبر أي سجل غير موثق نتيجة صالحة.";
  const lines = items.map((item, index) => {
    const deadline = item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : "بدون موعد نهائي";
    const amount = item.amount !== null && item.currency ? `${item.amount} ${item.currency}` : "غير محدد";
    return `${index + 1}. **${item.title}** — ${item.provider}\n   ${item.country || "الدولة غير محددة"} · ${item.level || "المستوى غير محدد"} · ${item.field || "المجال غير محدد"}\n   التمويل: ${item.funding_type || "غير محدد"} · المبلغ: ${amount} · الموعد: ${deadline}\n   المصدر الرسمي: ${item.official_source_url}`;
  });
  return `🎓 **Scholarship Discovery — نتائج موثقة**\n\n${lines.join("\n\n")}\n\n*النتائج مقيدة بسجلات VERIFIED ذات مصدر رسمي؛ لا تمثل قبولًا أو أهلية نهائية.*`;
}