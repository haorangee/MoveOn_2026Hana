export type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  end: () => void;
};

export function configureCors(request: ApiRequest, response: ApiResponse) {
  const originHeader = request.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}
