"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X } from "lucide-react"
import Link from "next/link"

interface Template {
  id: string
  title: string
  description: string
  category: string
  popular: boolean
  preview: string
  fullContent: string
}

interface TemplatePreviewDialogProps {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplatePreviewDialog({ template, open, onOpenChange }: TemplatePreviewDialogProps) {
  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl text-black">{template.title}</DialogTitle>
              <DialogDescription className="mt-1">{template.description}</DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                {template.category}
              </Badge>
              {template.popular && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Popular
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Template Preview */}
          <div>
            <h3 className="font-semibold text-black mb-3">Template Preview</h3>
            <ScrollArea className="h-96 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{template.fullContent}</div>
            </ScrollArea>
          </div>

          {/* Template Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-black mb-2">What's Included</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Professional formatting and structure</li>
                <li>• Industry-standard legal language</li>
                <li>• Customizable fields and sections</li>
                <li>• Built-in signature areas</li>
                <li>• Export to PDF capability</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-2">Best For</h3>
              <p className="text-sm text-gray-600">
                {template.id === "nda" &&
                  "Protecting confidential information in business relationships, partnerships, and client engagements."}
                {template.id === "proposal" &&
                  "Presenting professional service offerings, project scopes, and pricing to potential clients."}
                {template.id === "partnership" &&
                  "Establishing formal business partnerships with clear roles, responsibilities, and profit sharing."}
                {template.id === "service" &&
                  "Defining service agreements with clear deliverables, timelines, and payment terms."}
                {template.id === "consulting" &&
                  "Consulting engagements with defined scope, rates, and intellectual property terms."}
                {template.id === "employment" &&
                  "Standard employment agreements with job descriptions, compensation, and benefits."}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Link href={`/create?template=${template.id}`} className="flex-1">
                  <Button className="w-full bg-black text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Use This Template
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
