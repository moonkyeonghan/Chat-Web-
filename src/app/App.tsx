import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Session } from "@supabase/supabase-js";

import Login from "./components/Login";
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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

    // ⭐ 핵심 변경: 이메일 대신 저장해둔 '이름(full_name)'을 가져옵니다.
    // 만약 이름이 없으면(옛날 계정 등) 이메일 앞부분을 씁니다.
    const userName = session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "익명";

    const { error } = await supabase.from("messages").insert([
      {
        content: text,
        sender_name: userName, // 여기에 이름을 저장!
        is_me: false,
      },
    ]);

    if (error) console.error("전송 에러:", error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Login />;
  }

  // ⭐ 현재 접속자 이름 가져오기
  const currentUserName = session.user.user_metadata.full_name || session.user.email?.split("@")[0];

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar contacts={[]} onSelectContact={() => {}} selectedContactId={null} />
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b p-4">
            <ChatHeader
            contact={{
                id: "1",
                name: `접속중: ${currentUserName}`, // 헤더에도 내 이름 표시
                avatar: "",
                status: "online",
                lastMessage: "",
                timestamp: "",
                unread: 0,
            }}
            />
            <button 
                onClick={handleLogout}
                className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
            >
                로그아웃
            </button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              // 보낸 사람이 '내 이름'과 같은지 확인
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