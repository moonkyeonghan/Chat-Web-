import { Search, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  online?: boolean;
}

interface ChatSidebarProps {
  contacts: Contact[];
  selectedContactId: string;
  onSelectContact: (id: string) => void;
}

export function ChatSidebar({ contacts, selectedContactId, onSelectContact }: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl">Messages</h1>
          <button className="p-2 hover:bg-accent rounded-full">
            <MoreVertical className="size-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className={`w-full p-3 rounded-lg flex items-start gap-3 hover:bg-accent transition-colors ${
                selectedContactId === contact.id ? "bg-accent" : ""
              }`}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback>{contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate">{contact.name}</span>
                  <span className="text-xs text-muted-foreground">{contact.timestamp}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.lastMessage}
                  </p>
                  {contact.unread && contact.unread > 0 && (
                    <span className="min-w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full px-1.5">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
