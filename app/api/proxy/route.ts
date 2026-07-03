import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url, method, headers, body } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Missing destination target URL' }, { status: 400 });
    }

    const cleanHeaders = new Headers();
    if (headers && typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          cleanHeaders.set(key, value);
        }
      });
    }

    const startTime = performance.now();
    
    // Perform outbound proxy request
    const response = await fetch(url, {
      method: method || 'GET',
      headers: cleanHeaders,
      body: ['GET', 'HEAD'].includes(method) ? undefined : body,
    });

    const endTime = performance.now();
    const elapsedTime = Math.round(endTime - startTime);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get('content-type') || '';
    let responseData: any = null;

    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => null);
    } else {
      responseData = await response.text().catch(() => '');
    }

    const dataSize = responseData 
      ? typeof responseData === 'object' 
        ? JSON.stringify(responseData).length 
        : String(responseData).length 
      : 0;

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      time: elapsedTime,
      size: dataSize,
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to proxy request to target server', 
        details: error.message || error 
      }, 
      { status: 502 }
    );
  }
}