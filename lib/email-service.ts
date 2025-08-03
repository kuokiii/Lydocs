interface EmailData {
  to: string[]
  subject: string
  body: string
  documentContent: string
  attachment?: {
    filename: string
    content: string // Base64 encoded content
    contentType: string
  }
}

class EmailService {
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Get the logo URL from an environment variable
      // This variable should be set after you upload the logo to Vercel Blob
      const lyzrLogoUrl =
        process.env.NEXT_PUBLIC_LYZR_LOGO_URL ||
        "https://assets.v0.dev/placeholder.svg?height=48&width=48&query=Lyzr%20Logo" // Fallback to a v0 placeholder if not set

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          // Pass the logo URL to the HTML formatting function
          html: this.formatEmailAsHTML(emailData.body, emailData.documentContent, lyzrLogoUrl),
          text: `${emailData.body}\n\n--- Document Content ---\n${emailData.documentContent}`,
          attachment: emailData.attachment,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("Email sending failed:", result)

        if (result.error === "Domain verification required") {
          throw new Error("Please verify your domain 'aadityanaharjain.online' in your Resend dashboard first.")
        }

        if (result.fallback) {
          this.openMailtoLink(emailData)
          return false
        }

        throw new Error(result.details || "Failed to send email")
      }

      console.log("Email sent successfully:", result)
      return true
    } catch (error) {
      console.error("Email sending failed:", error)
      this.openMailtoLink(emailData)
      return false
    }
  }

  prepareEmailContent(emailData: EmailData): { fullBody: string; mailtoLink: string } {
    const fullBody = `${emailData.body}\n\n--- Document Content ---\n${emailData.documentContent}`
    const encodedSubject = encodeURIComponent(emailData.subject)
    const encodedBody = encodeURIComponent(fullBody)
    const mailtoLink = `mailto:${emailData.to.join(",")}?subject=${encodedSubject}&body=${encodedBody}`

    return { fullBody, mailtoLink }
  }

  private formatEmailAsHTML(body: string, documentContent: string, lyzrLogoUrl: string): string {
    // Use the passed lyzrLogoUrl for the image source
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document from Lydocs</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background-color: #1f2937; /* Dark background for header */
              color: white;
              border-radius: 8px;
            }
            .header img {
              width: 48px;
              height: 48px;
              margin: 0 auto 10px auto;
              display: block;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content-block {
              background: white;
              padding: 25px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              margin-bottom: 20px;
            }
            .document-body {
              white-space: pre-wrap;
              font-size: 15px;
              line-height: 1.7;
              color: #374151;
              padding-bottom: 15px;
            }
            .separator {
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            }
            .document-content-box {
              background: #f9fafb;
              padding: 20px;
              border-radius: 6px;
              border-left: 3px solid #3b82f6;
            }
            .document-content-box h3 {
              color: #1f2937;
              margin: 0 0 10px 0;
              font-size: 16px;
              font-weight: 600;
            }
            .document-content-text {
              white-space: pre-wrap;
              font-size: 13px;
              line-height: 1.6;
              color: #4b5563;
              font-family: 'Courier New', monospace;
              background: white;
              padding: 15px;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .footer {
              text-align: center;
              padding: 20px;
              background-color: #374151; /* Dark background for footer */
              color: white;
              border-radius: 8px;
            }
            .footer p {
              margin: 0;
              font-size: 13px;
              opacity: 0.8;
            }
            .footer a {
              color: #93c5fd;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <img src="${lyzrLogoUrl}" alt="Lyzr Logo" width="48" height="48">
              <h1>📄 Lydocs</h1>
              <p>Professional Document Management</p>
              <p>Powered by Lyzr AI Agents</p>
            </div>
            
            <!-- Main Content -->
            <div class="content-block">
              <div class="document-body">
                ${body.replace(/\n/g, "<br>")}
              </div>
              
              <div class="separator"></div>

              <div class="document-content-box">
                <h3>📋 Document Content</h3>
                <div class="document-content-text">
                  ${documentContent.replace(/\n/g, "<br>")}
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p>✨ Generated with Lydocs AI</p>
              <p>Professional Document Management Platform</p>
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p>
                  Visit <a href="https://lydocs-lyzr-ai.vercel.app">lydocs-lyzr-ai.vercel.app</a>
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private openMailtoLink(emailData: EmailData): void {
    const fullBody = `${emailData.body}\n\n--- Document Content ---\n${emailData.documentContent}`
    const encodedSubject = encodeURIComponent(emailData.subject)
    const encodedBody = encodeURIComponent(fullBody)
    const mailtoLink = `mailto:${emailData.to.join(",")}?subject=${encodedSubject}&body=${encodedBody}`
    window.open(mailtoLink, "_blank")
  }

  generateEmailBody(documentTitle: string, senderName: string, recipientName: string): string {
    return `Dear ${recipientName},

I hope this email finds you well. Please find the ${documentTitle} ready for your review and signature.

📋 Document Details:
Document: ${documentTitle}
Sender: ${senderName}
Date: ${new Date().toLocaleDateString()}
Status: Ready for Signature

Please review the document carefully and provide your signature where indicated. The document includes all necessary terms and conditions we discussed.

If you have any questions or need clarification on any terms, please don't hesitate to reach out to me directly.

📝 Next Steps:
1. Review all sections carefully
2. Click on the signature fields to add your signature
3. Add the date where required
4. Submit the completed document

Thank you for your time and consideration. I look forward to working with you.

Best regards,
${senderName}

---
This document was generated and sent via Lydocs
Professional Document Management Platform
Powered by Lyzr AI Agents
Visit lydocs-lyzr-ai.vercel.app`
  }
}

export const emailService = new EmailService()
