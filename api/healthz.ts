type HealthResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
};

type HealthResponseWriter = {
  status: (code: number) => { json: (body: HealthResponse) => unknown };
};

export default function handler(_req: unknown, res: HealthResponseWriter) {
  res.status(200).json({
    status: 'ok',
    service: 'enjY-ai-coo',
    timestamp: new Date().toISOString(),
  });
}
