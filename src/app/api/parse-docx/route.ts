import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })

    return NextResponse.json({ text: result.value, messages: result.messages })
  } catch (error: any) {
    // DOCX parse error - handled with response
    return NextResponse.json({ error: 'Failed to parse document: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}
