import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    // Get the form data from the request in Next.js App Router
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only .pdf or .docx files are allowed' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.GMAIL_USERNAME,
      to: process.env.EMAIL_TO, // configure recipient in .env
      subject: `Received file: ${file.name}`,
      text: `Sent a file: ${file.name}`,
      attachments: [
        {
          filename: file.name || 'attachment',
          content: buffer,
          contentType: file.type || undefined,
        },
      ],
    })

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (err) {
    console.error('Mail error', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
