import * as React from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SettingsDialog } from "./SettingsDialog"
import { ProjectDialog } from "./ProjectDialog"
import { Project } from "@/types"
import { Steps } from "@/components/Steps"
import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

interface WelcomeFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

type Step = {
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    title: "Welcome to Hide",
    description: "Automate your coding tasks to ship faster and deliver higher quality software."
  },
  {
    title: "Connect Your AI",
    description: "Set up your AI provider to start automating your development workflow."
  },
  {
    title: "Create Your First Project",
    description: "Set up a project to start coding."
  }
]

export function WelcomeFlow({ open, onOpenChange, onComplete }: WelcomeFlowProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [showSettings, setShowSettings] = React.useState(false)
  const [showProject, setShowProject] = React.useState(false)
  const [settingsError, setSettingsError] = React.useState<string | null>(null)

  useEffect(() => {
    if (currentStep === 1) {  // When on Connect AI step
      setSettingsError(null);  // Reset any previous errors
    }
  }, [currentStep]);

  const handleSettingsSaved = () => {
    setShowSettings(false)
    setCurrentStep(2)
  }

  const handleProjectSaved = async (project: Project) => {
    try {
      if (!window.projects?.create) {
        throw new Error('Projects API is not available');
      }

      await window.projects.create(project);
      
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
        duration: 3000,
        variant: "success"
      });
      
      setShowProject(false);
      onComplete();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        duration: 3000,
        variant: "destructive"
      });
    }
  }

  const currentStepData = STEPS[currentStep] || STEPS[0];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Button 
              onClick={() => setCurrentStep(1)} 
              className="w-full"
              size="lg"
            >
              Get Started
            </Button>
          </motion.div>
        )
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Button 
              onClick={() => setShowSettings(true)} 
              className="w-full"
              size="lg"
            >
              Connect AI Provider
            </Button>
          </motion.div>
        )
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Button 
              onClick={() => setShowProject(true)} 
              className="w-full"
              size="lg"
            >
              Create Your First Project
            </Button>
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={onOpenChange}
      >
        <DialogOverlay className="bg-background/80 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentStepData.title}</DialogTitle>
            <DialogDescription>
              {currentStepData.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {renderStep()}
            <Steps 
              steps={STEPS.length} 
              currentStep={currentStep} 
              className="mt-8"
            />
          </div>
        </DialogContent>
      </Dialog>

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        error={settingsError}
        onSuccess={handleSettingsSaved}
        className="bg-background border-border"
      />
      <ProjectDialog
        project={{} as Project}
        open={showProject}
        onOpenChange={setShowProject}
        onSave={handleProjectSaved}
      />
    </>
  )
} 