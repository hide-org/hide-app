import { UIMessage } from "@/types";

export interface ActivityLogProps {
  message: UIMessage;
}

export const ActivityLog = ({ message }: ActivityLogProps) => {
  return (
      <div className="border text-foreground leading-relaxed w-full max-w-2xl mx-auto">{message.content}</div>
  );
}
