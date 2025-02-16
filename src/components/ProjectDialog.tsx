import * as React from "react"
import { v4 as uuidv4 } from 'uuid'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Project } from '../types'

interface ProjectDialogProps {
  project: Partial<Project> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (project: Project) => void;
}

export function ProjectDialog({ project, open, onOpenChange, onSave }: ProjectDialogProps) {
  const [formData, setFormData] = React.useState({
    id: project?.id || uuidv4(),
    name: project?.name || '',
    path: project?.path || '',
    description: project?.description || ''
  });

  // Update form data when project changes
  React.useEffect(() => {
    setFormData({
      id: project?.id || uuidv4(), // Keep existing ID or generate new one
      name: project?.name || '',
      path: project?.path || '',
      description: project?.description || ''
    });
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData as Project);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{project?.name ? 'Edit Project' : 'Create Project'}</DialogTitle>
          <DialogDescription>
            {project?.name ? 'Edit your project details below.' : 'Enter details for your new project.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="project-name"
                className="col-span-3"
                pattern="^[^\s]+$"
                title="Name cannot contain spaces"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="path" className="text-right">
                Path
              </Label>
              <div className="col-span-3 flex">
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="/path/to/project"
                  className="flex-grow"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={async () => {
                    try {
                      const result = await window.electron.showDirectoryPicker();
                      if (!result.canceled && result.filePaths.length > 0) {
                        setFormData(prev => ({ ...prev, path: result.filePaths[0] }));
                      }
                    } catch (error) {
                      console.error('Error picking directory:', error);
                    }
                  }}
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
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description"
                className="col-span-3 h-32 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
