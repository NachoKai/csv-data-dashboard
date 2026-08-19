import { inferMetadata } from '@/lib/types/csv'
import { parseCsv } from '@/lib/hooks/useCsvParser'

export async function POST(request: Request) {
  try {
    const { csvText } = await request.json()
    const dataset = parseCsv(String(csvText || ''))
    return Response.json(inferMetadata(dataset.rows))
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Invalid CSV' }, { status: 400 })
  }
}
