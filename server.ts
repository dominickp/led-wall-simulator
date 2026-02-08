/**
 * Local development server for LED Wall Simulator
 * Run with: deno run --allow-net --allow-read server.ts
 */

import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const PORT = 8000;

async function handler(req: Request): Promise<Response> {
  // Parse the URL
  const url = new URL(req.url);
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;

  try {
    // Serve the file
    const file = await Deno.open(`.${filePath}`);
    const readableStream = Deno.open(`.${filePath}`).then((f) => {
      return new ReadableStream({
        async start(controller) {
          const buffer = new Uint8Array(1024);
          let bytesRead;
          while ((bytesRead = await f.read(buffer)) !== null) {
            controller.enqueue(buffer.slice(0, bytesRead));
          }
          controller.close();
          f.close();
        },
      });
    });

    // Determine content type
    let contentType = "text/html";
    if (filePath.endsWith(".js")) contentType = "application/javascript";
    else if (filePath.endsWith(".css")) contentType = "text/css";
    else if (filePath.endsWith(".json")) contentType = "application/json";
    else if (filePath.endsWith(".mp4")) contentType = "video/mp4";
    else if (filePath.endsWith(".webm")) contentType = "video/webm";
    else if (filePath.endsWith(".mov")) contentType = "video/quicktime";

    return new Response(await readableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    // Return 404 for missing files
    return new Response("File not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

console.log(`🚀 LED Wall Simulator server running on http://localhost:${PORT}`);
console.log(`📂 Serving from: ${Deno.cwd()}`);
console.log(`\nPress Ctrl+C to stop`);

serve(handler, { port: PORT });
