export async function GET() {
  return new Response('Probely', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
