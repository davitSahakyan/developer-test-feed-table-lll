const TARGET = 'http://130.61.77.93:50940/api/developer/QueryFeed'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const res = await fetch(TARGET, {
      method: 'POST',
      headers: {
        'DeveloperKey': 'usearch-dev-2025',
        'Content-Type': 'application/json',
      },
      body: event.body,
    })

    const text = await res.text()

    return {
      statusCode: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
      body: text,
    }
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Bad Gateway', message: err?.message || 'Proxy error' }),
    }
  }
}


