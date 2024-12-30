import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Project as ProjectType } from '../types'

interface ProjectDialogProps {
  project: ProjectType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDialog({ project, open, onOpenChange }: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create/Edit Project</DialogTitle>
          <DialogDescription>
            Enter your project details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input 
              id="name" 
              defaultValue={project?.name}
              placeholder="project-name" 
              className="col-span-3"
              pattern="^[^\s]+$"
              title="Name cannot contain spaces"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="path" className="text-right">
              Path
            </Label>
            <div className="col-span-3 flex">
              <Input 
                id="path" 
                defaultValue={project?.uri}
                placeholder="/path/to/project" 
                className="flex-grow"
                readOnly
              />
              <Button 
                type="button" 
                variant="outline" 
                className="ml-2"
                onClick={() => alert('Open file dialog here')}
              >
                Browse
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea 
              id="description" 
              defaultValue={project?.description}
              placeholder="Project description" 
              className="col-span-3 h-32 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

