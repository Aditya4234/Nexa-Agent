import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TechStack } from "@/components/landing/TechStack";
import { AgentExecution } from "@/components/landing/AgentExecution";
import { AgentDashboard } from "@/components/landing/AgentDashboard";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { AgentTemplates } from "@/components/landing/AgentTemplates";
import { WorkflowPreview } from "@/components/landing/WorkflowPreview";
import { KnowledgeSection } from "@/components/landing/KnowledgeSection";
import { Security } from "@/components/landing/Security";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <TechStack />
        <AgentExecution />
        <AgentDashboard />
        <HowItWorks />
        <Features />
        <AgentTemplates />
        <WorkflowPreview />
        <KnowledgeSection />
        <Security />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}