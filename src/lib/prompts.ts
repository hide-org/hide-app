import { Project } from '@/types';


export const systemPrompt = (project: Project) => `You are an AI assistant tasked with helping user with their project called ${project.name}. The project is located in ${project.path}.

${project.description}`
