import { NextResponse } from 'next/server';

// A versão é lida do package.json em tempo de build.
// Para que o endpoint retorne uma versão nova a cada deploy,
// usamos um BUILD_ID gerado no momento do build (via next.config.mjs).
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';

export async function GET() {
  return NextResponse.json(
    { version: APP_VERSION },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
