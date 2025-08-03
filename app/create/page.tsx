"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Sparkles, Building, User } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { LYZR_INTEGRATION } from "@/lib/lyzr-api"
import { useToast } from "@/hooks/use-toast" // Import useToast
import Image from "next/image"

// Template data for pre-filling forms
const templateDefaults = {
  nda: {
    documentType: "nda",
    projectDescription: "Confidential information sharing for potential business collaboration",
    terms: "Mutual confidentiality, 2-year term, return of information upon request",
    additionalNotes: "Standard NDA with mutual protection clauses",
  },
  proposal: {
    documentType: "proposal",
    projectDescription: "Professional services proposal including scope, timeline, and deliverables",
    terms: "Net 30 payment terms, milestone-based delivery, change order process",
    additionalNotes: "Comprehensive proposal with detailed project breakdown",
  },
  partnership: {
    documentType: "partnership",
    projectDescription: "Business partnership agreement defining roles, responsibilities, and profit sharing",
    terms: "Equal partnership, shared decision making, quarterly profit distribution",
    additionalNotes: "Partnership agreement with clear governance structure",
  },
  service: {
    documentType: "service",
    projectDescription: "Professional service agreement with defined scope and deliverables",
    terms: "Monthly payment schedule, specific deliverables, termination clauses",
    additionalNotes: "Service agreement with performance metrics",
  },
  consulting: {
    documentType: "consulting",
    projectDescription: "Consulting services agreement with hourly rates and project scope",
    terms: "Hourly billing, monthly invoicing, intellectual property clauses",
    additionalNotes: "Consulting agreement with expertise-based pricing",
  },
  employment: {
    documentType: "employment",
    projectDescription: "Employment agreement with job description, compensation, and benefits",
    terms: "At-will employment, standard benefits, confidentiality requirements",
    additionalNotes: "Standard employment contract with competitive compensation",
  },
}

export default function CreateDocument() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast() // Initialize useToast
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    documentType: "",
    companyName: "",
    companyAddress: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    clientCompanyName: "",
    clientAddress: "",
    clientContactName: "",
    clientContactEmail: "",
    clientContactPhone: "",
    projectDescription: "",
    terms: "",
    amount: "",
    duration: "",
    additionalNotes: "",
  })

  const [isGenerating, setIsGenerating] = useState(false)
  // const [uploadedAnalysis, setUploadedAnalysis] = useState("") // Removed as FileUploadZone is removed

  // Check for template parameter and pre-fill form
  useEffect(() => {
    const template = searchParams.get("template")
    if (template && templateDefaults[template as keyof typeof templateDefaults]) {
      const defaults = templateDefaults[template as keyof typeof templateDefaults]
      setFormData((prev) => ({
        ...prev,
        ...defaults,
      }))
    }
  }, [searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    // Basic validation for current step before moving next
    if (currentStep === 1 && !formData.documentType) {
      toast({
        title: "Missing Information",
        description: "Please select a document type.",
        variant: "destructive",
      })
      return
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenerate = async () => {
    if (!formData.documentType) {
      toast({
        title: "Missing Information",
        description: "Please select a document type before generating.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      // Store form data in localStorage for the preview page
      localStorage.setItem("lydocs-form-data", JSON.stringify(formData))
      // localStorage.setItem("lydocs-uploaded-analysis", uploadedAnalysis) // Removed

      // Generate document using Lyzr AI
      const generatedContent = await LYZR_INTEGRATION.generateDocument(formData)
      localStorage.setItem("lydocs-generated-content", generatedContent)

      router.push("/document/preview")
    } catch (error) {
      console.error("Document generation failed:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate document. Please check your input and try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/lyzr_platform_logo.jpeg" alt="Lyzr Logo" width={32} height={32} className="mr-2" />
              <span className="text-2xl font-bold text-black">Lydocs</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              {[
                { number: 1, title: "Document Type & Company" },
                { number: 2, title: "Client Information" },
                { number: 3, title: "Project Details" },
                { number: 4, title: "Terms & Finalize" },
              ].map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.number <= currentStep ? "bg-black text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step.number}
                    </div>
                    <p
                      className={`text-xs mt-2 text-center max-w-20 ${
                        step.number <= currentStep ? "text-black font-medium" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-16 h-0.5 mx-2 mt-[-20px] ${step.number < currentStep ? "bg-black" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">
              {currentStep === 1 && "Document Type & Your Company"}
              {currentStep === 2 && "Client Information"}
              {currentStep === 3 && "Project Details"}
              {currentStep === 4 && "Terms & Additional Information"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Select document type and enter your company information"}
              {currentStep === 2 && "Provide details about your client or partner"}
              {currentStep === 3 && "Describe the project or service details"}
              {currentStep === 4 && "Add terms, conditions, and any additional notes"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Document Type & Company Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="documentType" className="text-black">
                    Document Type
                  </Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => handleInputChange("documentType", value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-black">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nda">Non-Disclosure Agreement (NDA)</SelectItem>
                      <SelectItem value="proposal">Sales Proposal</SelectItem>
                      <SelectItem value="partnership">Partnership Agreement</SelectItem>
                      <SelectItem value="service">Service Agreement</SelectItem>
                      <SelectItem value="consulting">Consulting Agreement</SelectItem>
                      <SelectItem value="employment">Employment Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Building className="h-5 w-5 text-black" />
                      <h3 className="font-semibold text-black">Your Company</h3>
                    </div>

                    <div>
                      <Label htmlFor="companyName" className="text-black">
                        Company Name
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="Your company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyAddress" className="text-black">
                        Company Address
                      </Label>
                      <Textarea
                        id="companyAddress"
                        value={formData.companyAddress}
                        onChange={(e) => handleInputChange("companyAddress", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="Full company address"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="h-5 w-5 text-black" />
                      <h3 className="font-semibold text-black">Your Contact Information</h3>
                    </div>

                    <div>
                      <Label htmlFor="contactName" className="text-black">
                        Contact Name
                      </Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange("contactName", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactEmail" className="text-black">
                        Email
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactPhone" className="text-black">
                        Phone
                      </Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Client Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Building className="h-5 w-5 text-black" />
                      <h3 className="font-semibold text-black">Client Company</h3>
                    </div>

                    <div>
                      <Label htmlFor="clientCompanyName" className="text-black">
                        Company Name
                      </Label>
                      <Input
                        id="clientCompanyName"
                        value={formData.clientCompanyName}
                        onChange={(e) => handleInputChange("clientCompanyName", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="Client company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientAddress" className="text-black">
                        Company Address
                      </Label>
                      <Textarea
                        id="clientAddress"
                        value={formData.clientAddress}
                        onChange={(e) => handleInputChange("clientAddress", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="Client company address"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="h-5 w-5 text-black" />
                      <h3 className="font-semibold text-black">Client Contact</h3>
                    </div>

                    <div>
                      <Label htmlFor="clientContactName" className="text-black">
                        Contact Name
                      </Label>
                      <Input
                        id="clientContactName"
                        value={formData.clientContactName}
                        onChange={(e) => handleInputChange("clientContactName", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="Client contact name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientContactEmail" className="text-black">
                        Email
                      </Label>
                      <Input
                        id="clientContactEmail"
                        type="email"
                        value={formData.clientContactEmail}
                        onChange={(e) => handleInputChange("clientContactEmail", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="client@email.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientContactPhone" className="text-black">
                        Phone
                      </Label>
                      <Input
                        id="clientContactPhone"
                        value={formData.clientContactPhone}
                        onChange={(e) => handleInputChange("clientContactPhone", e.target.value)}
                        className="border-gray-300 focus:border-black"
                        placeholder="Client phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Project Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="projectDescription" className="text-black">
                    Project/Service Description
                  </Label>
                  <Textarea
                    id="projectDescription"
                    value={formData.projectDescription}
                    onChange={(e) => handleInputChange("projectDescription", e.target.value)}
                    className="border-gray-300 focus:border-black"
                    placeholder="Describe the project, service, or purpose of this agreement..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="amount" className="text-black">
                      Amount/Value
                    </Label>
                    <Input
                      id="amount"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      className="border-gray-300 focus:border-black"
                      placeholder="$10,000 or TBD"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration" className="text-black">
                      Duration/Timeline
                    </Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", e.target.value)}
                      className="border-gray-300 focus:border-black"
                      placeholder="3 months, 6 weeks, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Terms & Additional Info */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="terms" className="text-black">
                    Key Terms & Conditions
                  </Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => handleInputChange("terms", e.target.value)}
                    className="border-gray-300 focus:border-black"
                    placeholder="Payment terms, deliverables, milestones, confidentiality requirements, etc."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="additionalNotes" className="text-black">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                    className="border-gray-300 focus:border-black"
                    placeholder="Any additional information, special requirements, or notes..."
                    rows={3}
                  />
                </div>

                {/* Removed FileUploadZone */}
                {/* <div>
                  <Label className="text-black">Reference Documents (Optional)</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload any reference documents to help generate better content
                  </p>
                  <FileUploadZone selectedModel="lyzr" onFileAnalyzed={(analysis) => setUploadedAnalysis(analysis)} />
                </div> */}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext} className="bg-black text-white hover:bg-gray-800">
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Document"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
