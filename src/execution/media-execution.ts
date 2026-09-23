export type MediaExecutionOperation = "lighting";

export type MediaExecutionJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "VERIFICATION_FAILED";

export interface MediaArtifactRef {
  url: string;
  contentType?: string;
  checksum?: string;
}

export interface MediaExecutionEvidence {
  provider: string;
  providerJobId?: string;
  sourceArtifactUrl: string;
  outputArtifact?: MediaArtifactRef;
  observedAt: string;
  verification: {
    status: "PENDING" | "PASSED" | "FAILED";
    checks: string[];
    details?: string;
  };
}

export interface MediaExecutionRequest {
  operation: MediaExecutionOperation;
  sourceArtifactUrl: string;
  instruction: string;
  idempotencyKey: string;
  requestedBy: {
    userId: string;
    organizationId: string;
  };
  metadata?: Record<string, string>;
}

export interface MediaExecutionJob {
  id: string;
  status: MediaExecutionJobStatus;
  request: MediaExecutionRequest;
  evidence: MediaExecutionEvidence;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface MediaExecutionProvider {
  readonly name: string;
  execute(request: MediaExecutionRequest): Promise<{
    providerJobId?: string;
    outputArtifact: MediaArtifactRef;
  }>;
  verify?(request: MediaExecutionRequest, artifact: MediaArtifactRef): Promise<{
    passed: boolean;
    checks: string[];
    details?: string;
  }>;
}

export function normalizeLightingInstruction(instruction: string): MediaExecutionRequest["operation"] {
  const value = instruction.trim().toLowerCase();
  if (value === "lighting:darker" || /lighting\s*:\s*darker/.test(value)) return "lighting";
  throw new Error("Unsupported media instruction. Expected lighting:darker.");
}

export function createMediaExecutionJob(
  request: MediaExecutionRequest,
  now = new Date().toISOString(),
): MediaExecutionJob {
  return {
    id: request.idempotencyKey,
    status: "QUEUED",
    request,
    evidence: {
      provider: "unassigned",
      sourceArtifactUrl: request.sourceArtifactUrl,
      observedAt: now,
      verification: {
        status: "PENDING",
        checks: ["provider_execution", "output_artifact", "artifact_verification"],
      },
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function executeMediaJob(
  job: MediaExecutionJob,
  provider: MediaExecutionProvider,
  now = new Date().toISOString(),
): Promise<MediaExecutionJob> {
  if (job.status === "SUCCEEDED") return job;

  const running: MediaExecutionJob = {
    ...job,
    status: "RUNNING",
    updatedAt: now,
    evidence: { ...job.evidence, provider: provider.name, observedAt: now },
  };

  try {
    const result = await provider.execute(running.request);
    const verification = provider.verify
      ? await provider.verify(running.request, result.outputArtifact)
      : { passed: false, checks: ["artifact_verification"], details: "Provider verification is not configured." };

    const verifiedAt = new Date().toISOString();
    if (!verification.passed) {
      return {
        ...running,
        status: "VERIFICATION_FAILED",
        updatedAt: verifiedAt,
        evidence: {
          ...running.evidence,
          providerJobId: result.providerJobId,
          outputArtifact: result.outputArtifact,
          observedAt: verifiedAt,
          verification: {
            status: "FAILED",
            checks: verification.checks,
            details: verification.details,
          },
        },
        error: "Media provider returned an artifact that could not be verified.",
      };
    }

    return {
      ...running,
      status: "SUCCEEDED",
      updatedAt: verifiedAt,
      evidence: {
        ...running.evidence,
        providerJobId: result.providerJobId,
        outputArtifact: result.outputArtifact,
        observedAt: verifiedAt,
        verification: {
          status: "PASSED",
          checks: verification.checks,
          details: verification.details,
        },
      },
    };
  } catch (error: any) {
    return {
      ...running,
      status: "FAILED",
      updatedAt: new Date().toISOString(),
      error: error?.message || "Media execution failed.",
    };
  }
}
