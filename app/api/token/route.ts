export async function POST(request: Request) {
  try {
    const headers = new Headers()
    headers.append('Content-Type', 'application/x-www-form-urlencoded')
    headers.append('accept', 'application/json')

    const payload = {
      grant_type: '',
      client_id: '',
      client_secret: '',
      username: 'ib1',
      password: 'secret',
      scope: '',
    }
    
    const res = await fetch('https://data-provider.ib1.org/token', {
      method: 'POST',
      headers,
      body: new URLSearchParams(payload),
      redirect: 'follow',
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('Could not fetch', { status: 500 });
  }
}