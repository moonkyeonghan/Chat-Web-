import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Session } from "@supabase/supabase-js";

import Login from "./components/Login";
import MyPage from "./components/MyPage";
import { ChatSidebar } from "./components/chat-sidebar";
import { ChatHeader } from "./components/chat-header";
import { ChatMessage } from "./components/chat-message";
import { ChatInput } from "./components/chat-input";
import { ScrollArea } from "./components/ui/scroll-area";

type Message = {
  id: number;
  content: string;
  sender_name: string;
  created_at: string;
};

// 화면 모드 ('chat' 또는 'mypage')
type ViewMode = "chat" | "mypage";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) console.error("에러:", error);
      else setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel("realtime_chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !session) return;
    const userName = session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "익명";

    const { error } = await supabase.from("messages").insert([
      { content: text, sender_name: userName, is_me: false },
    ]);
    if (error) console.error("전송 에러:", error);
  };

  // 로그아웃 함수 (Supabase 로그아웃)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // 화면을 새로고침해서 로그인 페이지로 돌아가게 함
    window.location.reload(); 
  };

  if (!session) {
    return <Login />;
  }

  if (viewMode === "mypage") {
    return <MyPage user={session.user} onBack={() => setViewMode("chat")} />;
  }

  const currentUserName = session.user.user_metadata.full_name || session.user.email?.split("@")[0];

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar contacts={[]} onSelectContact={() => {}} selectedContactId={null} />
      <div className="flex flex-1 flex-col">
        {/* 상단 헤더 영역 */}
        <div className="flex items-center justify-between border-b p-4">
          <ChatHeader
            contact={{
              id: "1",
              name: `💬 채팅방 (나: ${currentUserName})`,
              avatar: "",
              status: "online",
              lastMessage: "",
              timestamp: "",
              unread: 0,
            }}
          />
          
          
          <div className="flex gap-2">
            {/* 1. 마이페이지 버튼 */}
            <button
              onClick={() => setViewMode("mypage")}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              MY
            </button>
            
            {/* 2. 로그아웃 버튼 (새로 추가됨) */}
            <button 
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-100 transition"
            >
                로그아웃
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isMyMessage = msg.sender_name === currentUserName;
              return (
                <ChatMessage
                  key={msg.id}
                  content={msg.content}
                  sender={msg.sender_name}
                  isMe={isMyMessage}
                  timestamp={new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  avatar=""
                />
              );
            })}
          </div>
        </ScrollArea>

        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}