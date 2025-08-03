import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  const form = await request.formData()
  const file = form.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 })
  }

  // Use a more descriptive path for the logo in Vercel Blob storage
  // The file.name will preserve the original filename (e.g., lyzr_platform_logo.jpeg)
  const blob = await put(`logos/${file.name}`, file, { access: "public" })

  return NextResponse.json(blob)
}
