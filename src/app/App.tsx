import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { Session } from "@supabase/supabase-js";
import { MessageCircle, Search, User } from "lucide-react"; 

import Login from "./components/Login";
import MyPage from "./components/MyPage";
import SearchPage from "./components/SearchPage";
import { ChatHeader } from "./components/chat-header";
import { ChatMessage } from "./components/chat-message";
import { ChatInput } from "./components/chat-input";
// ScrollArea는 이제 안 쓰므로 지워도 되지만, 에러 방지를 위해 import는 둬도 상관없습니다.

type Message = {
  id: number;
  content: string;
  sender_name: string;
  created_at: string;
  room_id: string;
};

type ViewMode = "chat" | "search" | "mypage";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  
  const [currentRoom, setCurrentRoom] = useState("global");
  const [chatPartner, setChatPartner] = useState("모두의 채팅방");
  const [totalUnread, setTotalUnread] = useState(0);

  // ⭐ 스크롤을 항상 아래로 내리기 위한 참조 변수
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // 1. 메시지 로딩 & 읽음 처리
  useEffect(() => {
    if (!session) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", currentRoom)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    const markAsRead = async () => {
        const myName = session.user.user_metadata.full_name || session.user.email?.split("@")[0];
        if (currentRoom !== "global") { 
            await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("room_id", currentRoom)
                .neq("sender_name", myName)
                .eq("is_read", false);
            fetchTotalUnread(); 
        }
    };
    markAsRead();

    const channel = supabase
      .channel(`room_${currentRoom}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${currentRoom}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          fetchTotalUnread(); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, currentRoom]); 

  // ⭐ 메시지가 추가될 때마다 스크롤을 맨 아래로 내림
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. 뱃지 카운트
  const fetchTotalUnread = async () => {
    if (!session) return;
    const myName = session.user.user_metadata.full_name || session.user.email?.split("@")[0];
    
    const { data } = await supabase
      .from("messages")
      .select("room_id, sender_name")
      .eq("is_read", false)
      .neq("sender_name", myName);

    if (data) {
      const count = data.filter(msg => msg.room_id.includes(myName)).length;
      setTotalUnread(count);
    }
  };

  // 3. 전역 구독
  useEffect(() => {
    fetchTotalUnread();
    const globalChannel = supabase
      .channel("global_badge_check")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
          fetchTotalUnread(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(globalChannel); };
  }, [session]);


  const handleSendMessage = async (text: string) => {
  if (!text.trim() || !session) return;
  const userName = session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "익명";
  
  await supabase.from("messages").insert([
    { content: text, sender_name: userName, is_me: false, room_id: currentRoom, is_read: false },
  ]);
  };

  const startOneOnOneChat = (partnerName: string) => {
    const myName = session?.user.user_metadata.full_name || session?.user.email?.split("@")[0];
    if (!myName) return;
    const roomId = [myName, partnerName].sort().join("_");
    setCurrentRoom(roomId);
    setChatPartner(partnerName);
    setViewMode("chat");
  };

  const goGlobalChat = () => {
    setCurrentRoom("global");
    setChatPartner("모두의 채팅방");
    setViewMode("chat");
  };

  if (!session) return <Login />;
  const currentUserName = session.user.user_metadata.full_name || session.user.email?.split("@")[0];

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden"> {/* 전체 화면 넘침 방지 */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0"> {/* 여기가 중요! min-h-0 */}
        {viewMode === "chat" && (
          <div className="flex flex-1 flex-col overflow-hidden h-full relative">
            <ChatHeader
              contact={{
                id: "1",
                name: currentRoom === 'global' ? "🌏 모두의 채팅방" : `💬 ${chatPartner}`,
                avatar: "",
                status: "online",
                lastMessage: "",
                timestamp: "",
                unread: 0,
              }}
            />
            {currentRoom !== 'global' && (
              <div className="bg-blue-50 px-4 py-2 text-xs text-center text-blue-600 cursor-pointer hover:underline" onClick={goGlobalChat}>
                ← 전체 채팅방으로 돌아가기
              </div>
            )}
            
            {/* ⭐ ScrollArea 삭제하고 일반 div로 변경 (가장 확실한 방법) */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <div className="flex flex-col gap-4 pb-4">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    content={msg.content}
                    sender={msg.sender_name}
                    isMe={msg.sender_name === currentUserName}
                    timestamp={new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    avatar=""
                  />
                ))}
                {/* 스크롤 자동 이동을 위한 빈 태그 */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 이제 입력창이 바닥에 고정되어 잘 보일 겁니다 */}
            <div className="p-0 border-t bg-white">
                <ChatInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        )}

        {viewMode === "search" && (
          <SearchPage currentUser={session.user} onStartChat={startOneOnOneChat} />
        )}

        {viewMode === "mypage" && <MyPage user={session.user} onBack={() => {}} />}
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex h-16 items-center justify-around border-t bg-white pb-2 pt-2 shadow-inner shrink-0">
        <button onClick={goGlobalChat} className={`flex flex-col items-center gap-1 p-2 ${viewMode === 'chat' && currentRoom === 'global' ? 'text-black' : 'text-gray-400'}`}>
          <MessageCircle className={viewMode === 'chat' && currentRoom === 'global' ? "fill-black" : ""} />
          <span className="text-xs font-medium">전체채팅</span>
        </button>

        <button onClick={() => setViewMode("search")} className={`relative flex flex-col items-center gap-1 p-2 ${viewMode === 'search' ? 'text-black' : 'text-gray-400'}`}>
          <Search className={viewMode === 'search' ? "stroke-black stroke-[3px]" : ""} />
          <span className="text-xs font-medium">친구목록</span>
          {totalUnread > 0 && (
            <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {totalUnread > 99 ? "99" : totalUnread}
            </span>
          )}
        </button>

        <button onClick={() => setViewMode("mypage")} className={`flex flex-col items-center gap-1 p-2 ${viewMode === 'mypage' ? 'text-black' : 'text-gray-400'}`}>
          <User className={viewMode === 'mypage' ? "fill-black" : ""} />
          <span className="text-xs font-medium">마이</span>
        </button>
      </div>
    </div>
  );
}