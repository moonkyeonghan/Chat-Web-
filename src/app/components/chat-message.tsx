import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ChatMessageProps {
  content: string;
  sender: string;
  isMe: boolean;
  timestamp: string;
  avatar?: string;
}

export function ChatMessage({ content, sender, isMe, timestamp, avatar }: ChatMessageProps) {
  return (
    <div
      className={`flex gap-3 mb-4 ${
        isMe ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* 상대방일 때만 아바타 표시 */}
      {!isMe && (
        <Avatar className="size-8">
          <AvatarImage src={avatar} alt={sender} />
          <AvatarFallback>{sender.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`flex flex-col gap-1 max-w-[70%] ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* 상대방 이름 */}
        {!isMe && (
          <span className="text-xs text-gray-500 px-1">
            {sender}
          </span>
        )}
        
        {/* 말풍선 디자인 (색상 강제 지정) */}
        <div
          className={`px-4 py-2 rounded-2xl text-sm break-words ${
            isMe
              ? "bg-blue-600 text-white rounded-br-sm" // 나: 파란 배경 + 흰 글씨
              : "bg-gray-100 text-black rounded-bl-sm" // 상대: 회색 배경 + 검은 글씨
          }`}
        >
          {content}
        </div>
        
        {/* 시간 표시 */}
        <span className="text-[10px] text-gray-400 px-1">
          {timestamp}
        </span>
      </div>
    </div>
  );
}