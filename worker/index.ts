import { createMcp } from './mcp';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) return createMcp(env)(request);
    if (url.pathname === '/api/download') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
      const path = url.searchParams.get('path') ?? '';
      let decoded: string;
      try { decoded = decodeURIComponent(path); } catch { return new Response('Invalid path', { status: 400 }); }
      if (!/^\/docs(?:\/[^?#\\]+)?\.md$/.test(decoded) || decoded.split('/').some(p => p === '.' || p === '..')) return new Response('Invalid document path', { status: 400 });
      const asset = new URL(url.origin); asset.pathname = decoded;
      const response = await env.ASSETS.fetch(new Request(asset, { method: request.method }));
      if (!response.ok) return response;
      const name = decoded.split('/').at(-1) ?? 'skill.md';
      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/markdown; charset=utf-8');
      headers.set('content-disposition', `attachment; filename="skill.md"; filename*=UTF-8''${encodeURIComponent(name).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`);
      headers.set('x-content-type-options', 'nosniff');
      return new Response(response.body, { status: response.status, headers });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
