import { Phone, Video, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import type { Contact } from "./chat-sidebar";

interface ChatHeaderProps {
  contact: Contact;
}

export function ChatHeader({ contact }: ChatHeaderProps) {
  return (
    <div className="border-b p-4 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar>
              <AvatarImage src={contact.avatar} alt={contact.name} />
              <AvatarFallback>{contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {contact.online && (
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          
          <div>
            <h2 className="font-medium">{contact.name}</h2>
            <p className="text-sm text-muted-foreground">
              {contact.online ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="size-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="size-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
