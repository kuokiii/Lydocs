interface LyzrAgent {
  id: string
  name: string
  sessionId: string
}

interface LyzrResponse {
  response?: string
  message?: string
  error?: string
}

class LyzrIntegration {
  private readonly apiKey = "sk-default-8dqOl0HQnZgLp6Urb0a3anctaHzaSbpP"
  private readonly baseUrl = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/"
  private readonly userId = "nirupam@lyzr.ai"

  private agents: Record<string, LyzrAgent> = {
    contentGenerator: {
      id: "688b33fe4bb02b79e0fc9c71",
      name: "Document Content Generator",
      sessionId: "688b33fe4bb02b79e0fc9c71-5mckimw0l6u",
    },
    toneAdjuster: {
      id: "688b345fd4f38948a00c4575",
      name: "Document Tone Adjuster",
      sessionId: "688b345fd4f38948a00c4575-9kmrh9uz7to",
    },
    legalClauseGenerator: {
      id: "688b34940ed13a6d1b946482",
      name: "Legal Clause Generator",
      sessionId: "688b34940ed13a6d1b946482-chh7728r3og",
    },
    sectionRegenerator: {
      id: "688b34cd4bb02b79e0fc9c97",
      name: "Document Section Regenerator",
      sessionId: "688b34cd4bb02b79e0fc9c97-ji85o9o0xlc",
    },
    validator: {
      id: "688b35030ed13a6d1b94649e",
      name: "Document Validator",
      sessionId: "688b35030ed13a6d1b94649e-d2qmlvfvorq",
    },
    emailSender: {
      id: "688c5d240ed13a6d1b946d44",
      name: "Email Sender Agent (Gmail)",
      sessionId: "688c5d240ed13a6d1b946d44-qzptln6h4g",
    },
  }

  private async callAgent(agentKey: string, message: string): Promise<string> {
    const agent = this.agents[agentKey]
    if (!agent) {
      throw new Error(`Agent ${agentKey} not found`)
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          user_id: this.userId,
          agent_id: agent.id,
          session_id: agent.sessionId,
          message: message,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: LyzrResponse = await response.json()
      return data.response || data.message || "No response received"
    } catch (error) {
      console.error(`Error calling ${agent.name}:`, error)
      throw new Error(`Failed to call ${agent.name}: ${error}`)
    }
  }

  async generateDocument(formData: any): Promise<string> {
    const prompt = `Generate a professional ${formData.documentType} document with the following information:

**Your Company:**
- Name: ${formData.companyName}
- Address: ${formData.companyAddress}
- Contact: ${formData.contactName}
- Email: ${formData.contactEmail}
- Phone: ${formData.contactPhone}

**Client Company:**
- Name: ${formData.clientCompanyName}
- Address: ${formData.clientAddress}
- Contact: ${formData.clientContactName}
- Email: ${formData.clientContactEmail}
- Phone: ${formData.clientContactPhone}

**Project Details:**
- Description: ${formData.projectDescription}
- Amount/Value: ${formData.amount}
- Duration: ${formData.duration}

**Terms & Conditions:**
${formData.terms}

**Additional Notes:**
${formData.additionalNotes}

Please generate a complete, professional document with proper formatting, legal language where appropriate, and all necessary sections. Return only the document content without any code block markers or formatting prefixes.`

    const response = await this.callAgent("contentGenerator", prompt)

    // Clean up any code block markers or markdown bolding that might be returned
    return response
      .replace(/^```[\w]*\n?/, "") // Remove opening code block
      .replace(/\n?```$/, "") // Remove closing code block
      .replace(/^plaintext\n?/, "") // Remove plaintext prefix
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove ** for bolding
      .trim()
  }

  async adjustDocumentTone(content: string, tone: string): Promise<string> {
    const prompt = `Please adjust the tone of the following document to be more ${tone}. Preserve all factual information, dates, and legal requirements while modifying the language style:

${content}`

    return await this.callAgent("toneAdjuster", prompt)
  }

  async generateLegalClauses(documentType: string, requirements: string): Promise<string> {
    const prompt = `Generate appropriate legal clauses for a ${documentType} document with the following requirements:

${requirements}

Please include standard clauses for: confidentiality/NDA, termination conditions, intellectual property rights, liability limitations, dispute resolution, and governing law.`

    return await this.callAgent("legalClauseGenerator", prompt)
  }

  async regenerateSection(fullDocument: string, sectionToRegenerate: string, instructions: string): Promise<string> {
    const prompt = `Please regenerate the following section of the document with these instructions: ${instructions}

**Full Document Context:**
${fullDocument}

**Section to Regenerate:**
${sectionToRegenerate}

Please maintain consistency with the document's tone and style.`

    return await this.callAgent("sectionRegenerator", prompt)
  }

  async validateDocument(content: string): Promise<string> {
    const prompt = `Please review the following document for completeness, consistency, and potential issues. Provide specific feedback on areas that need improvement:

${content}`

    return await this.callAgent("validator", prompt)
  }

  async analyzeDocument(content: string, model: string, fileName: string): Promise<string> {
    const prompt = `Please analyze the following document and provide insights, key points, and recommendations:

**File Name:** ${fileName}
**Content:**
${content}

Please provide a comprehensive analysis including key findings, important sections, and actionable insights.`

    return await this.callAgent("validator", prompt)
  }

  // Removed the sendDocumentViaAgent method entirely.
}

export const LYZR_INTEGRATION = new LyzrIntegration()
