export interface ResponseEvidence {
  source_post_id: string;
  metric: string;
  image_index: number;
}

export interface EvidenceEnvelope {
  response: string;
  evidence: ResponseEvidence;
  evidence_id: string;
}

export class MissingEvidenceError extends Error {
  constructor() {
    super("EVIDENCE_REQUIRED");
    this.name = "MissingEvidenceError";
  }
}

function assertEvidence(evidence: ResponseEvidence | undefined): asserts evidence is ResponseEvidence {
  if (
    !evidence ||
    !evidence.source_post_id?.trim() ||
    !evidence.metric?.trim() ||
    !Number.isInteger(evidence.image_index) ||
    evidence.image_index < 0
  ) {
    throw new MissingEvidenceError();
  }
}

export function createEvidenceId(evidence: ResponseEvidence): string {
  assertEvidence(evidence);
  const raw = JSON.stringify({
    source_post_id: evidence.source_post_id,
    metric: evidence.metric,
    image_index: evidence.image_index,
  });
  return `evidence_${Buffer.from(raw).toString("base64url").slice(0, 24)}`;
}

export function gateResponse(
  response: string,
  evidence?: ResponseEvidence,
): EvidenceEnvelope | null {
  try {
    assertEvidence(evidence);
  } catch {
    return null;
  }

  const normalized = response.trim();
  if (!normalized) return null;

  return {
    response: normalized,
    evidence,
    evidence_id: createEvidenceId(evidence),
  };
}

export function requireEvidence(
  response: string,
  evidence?: ResponseEvidence,
): EvidenceEnvelope {
  const gated = gateResponse(response, evidence);
  if (!gated) throw new MissingEvidenceError();
  return gated;
}
