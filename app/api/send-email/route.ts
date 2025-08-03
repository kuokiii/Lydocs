import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, attachment } = await request.json()

    const RESEND_API_KEY = process.env.RESEND_API_KEY

    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY found, using mock email service")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return NextResponse.json({
        success: true,
        message: "Email sent successfully (mock)",
        recipients: to,
        note: "This is a mock email service. To send real emails, add RESEND_API_KEY to your environment variables.",
      })
    }

    const attachments = attachment
      ? [
          {
            filename: attachment.filename,
            content: attachment.content, // Base64 encoded content
            contentType: attachment.contentType,
          },
        ]
      : []

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lydocs <noreply@aadityanaharjain.online>", // Using your verified domain with "Lydocs" display name
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
        text: text,
        attachments: attachments,
        reply_to: "support@aadityanaharjain.online", // Updated to support@aadityanaharjain.online
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Resend API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      if (response.status === 403 || response.status === 422) {
        return NextResponse.json(
          {
            success: false,
            error: "Domain verification required",
            details:
              "Please verify your domain 'aadityanaharjain.online' in your Resend dashboard before sending emails.",
            fallback: true,
          },
          { status: 422 },
        )
      }

      throw new Error(`Resend API error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const result = await response.json()
    console.log("Email sent successfully via Resend:", result)

    return NextResponse.json({
      success: true,
      message: "Email sent successfully! 📧",
      recipients: to,
      emailId: result.id,
      provider: "Resend",
    })
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
      },
      { status: 500 },
    )
  }
}
