import { useState } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-background">
      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <Paperclip className="size-5" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <Smile className="size-5" />
        </Button>
        
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-10 max-h-32 resize-none"
          rows={1}
        />
        
        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          disabled={!message.trim()}
        >
          <Send className="size-5" />
        </Button>
      </div>
    </form>
  );
}
