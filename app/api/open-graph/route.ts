import { NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const options = { url };
  const { error, result } = await ogs(options);

  if (error) {
    return NextResponse.json({ error: 'Cannot fetch open graph data.' }, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
