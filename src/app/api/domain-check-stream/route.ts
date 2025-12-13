import { NextRequest } from 'next/server';
import { ProgressiveDomainService } from '@/lib/services/progressiveDomainService';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) endpoint for progressive domain verification
 *
 * Returns results in real-time as each verification layer completes:
 * - Layer 1: ~100ms (DNS + patterns)
 * - Layer 2: ~2s (comprehensive DNS + HTTP)
 * - Layer 3: ~12s (WHOIS authoritative)
 *
 * Usage:
 * const eventSource = new EventSource('/api/domain-check-stream?domain=example.com');
 * eventSource.onmessage = (event) => {
 *   const result = JSON.parse(event.data);
 *   // Update UI with progressive results
 * };
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');

  if (!domain) {
    return new Response('Domain parameter is required', { status: 400 });
  }

  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
  if (!domainRegex.test(domain)) {
    return new Response('Invalid domain format', { status: 400 });
  }

  const encoder = new TextEncoder();
  const service = new ProgressiveDomainService();

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        const startMessage = `data: ${JSON.stringify({ type: 'start', domain })}\n\n`;
        controller.enqueue(encoder.encode(startMessage));

        // Stream progressive results
        for await (const result of service.verifyProgressive(domain)) {
          const message = `data: ${JSON.stringify({ type: 'layer', ...result })}\n\n`;
          controller.enqueue(encoder.encode(message));

          // Small delay between layers for better UX
          if (result.layer < 3) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Send completion message
        const doneMessage = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
        controller.enqueue(encoder.encode(doneMessage));

        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        const errorMessage = `data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable buffering for Nginx
    }
  });
}
