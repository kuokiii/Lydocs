import Link from "next/link"
import Image from "next/image" // Import Image component
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Zap, Shield, Download, Share2, FileText } from "lucide-react" // Added FileText

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/images/lyzr_platform_logo.jpeg" alt="Lyzr Logo" width={32} height={32} className="mr-2" />
            <span className="text-2xl font-bold text-black">Lydocs</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-black hover:bg-gray-100">
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-black text-white hover:bg-gray-800">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Image src="/images/lyzr_platform_logo.jpeg" alt="Lyzr Logo" width={48} height={48} className="mr-3" />
            <p className="text-lg font-semibold text-gray-700">Powered by Lyzr AI Agents</p>
          </div>
          <h1 className="text-5xl font-bold text-black mb-6">
            Create, Sign & Send
            <br />
            <span className="text-gray-600">Professional Agreements</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate AI-powered user agreements and sales proposals with built-in signing and sending capabilities.
            Streamline your document workflow.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                Get Started
              </Button>
            </Link>
            <a href="https://lyzr.ai" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-black text-black hover:bg-gray-50 bg-transparent">
                Create your first AI agent
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-black mb-12">Everything you need to manage documents</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-gray-200">
              <CardHeader>
                <Zap className="h-10 w-10 text-black mb-2" />
                <CardTitle className="text-black">AI-Powered Generation</CardTitle>
                <CardDescription>Generate personalized agreements using advanced AI technology</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <Users className="h-10 w-10 text-black mb-2" />
                <CardTitle className="text-black">Built-in Signatures</CardTitle>
                <CardDescription>Collect signatures with drag-and-drop fields and drawing tools</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <Share2 className="h-10 w-10 text-black mb-2" />
                <CardTitle className="text-black">Easy Sharing</CardTitle>
                <CardDescription>Send documents via Gmail and create shareable links</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <Download className="h-10 w-10 text-black mb-2" />
                <CardTitle className="text-black">Export Options</CardTitle>
                <CardDescription>Export your documents as PDF or Word files</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <Shield className="h-10 w-10 text-black mb-2" />
                <CardTitle className="text-black">Secure & Compliant</CardTitle>
                <CardDescription>Enterprise-grade security for your sensitive documents</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <FileText className="h-10 w-10 text-black mb-2" /> {/* Kept FileText here for template library card */}
                <CardTitle className="text-black">Template Library</CardTitle>
                <CardDescription>Choose from NDAs, proposals, and partnership agreements</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-black text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to streamline your document workflow?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using Lydocs to create, sign, and send professional agreements.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="container mx-auto text-center text-gray-600">
          <p>&copy; 2024 Lydocs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
