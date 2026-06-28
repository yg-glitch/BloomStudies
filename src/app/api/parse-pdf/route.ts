import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Dynamic import to avoid build issues with pdf-parse
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)

    return NextResponse.json({
      text: data.text,
      pages: data.numpages,
      info: data.info,
    })
  } catch (error: any) {
    console.error('PDF parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse PDF: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
