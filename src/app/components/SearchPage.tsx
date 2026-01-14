import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { User } from "@supabase/supabase-js";

interface Props {
  currentUser: User | null;
  onStartChat: (targetUserEmail: string) => void;
}

export default function SearchPage({ currentUser, onStartChat }: Props) {
  const [users, setUsers] = useState<string[]>([]);
  // ⭐ 친구별 안 읽은 메시지 개수 저장할 공간 ({ "철수": 3, "영희": 0 })
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const myName = currentUser?.user_metadata.full_name || currentUser?.email?.split("@")[0];

  useEffect(() => {
    if (!myName) return;

    const fetchData = async () => {
      // 1. 친구 목록 가져오기 (기존 로직)
      const { data: usersData } = await supabase
        .from("messages")
        .select("sender_name")
        .neq("sender_name", myName);

      if (usersData) {
        const uniqueUsers = Array.from(new Set(usersData.map((u) => u.sender_name)));
        setUsers(uniqueUsers);
      }

      // 2. ⭐ 안 읽은 메시지 개수 가져오기
      // 조건: 받는 사람이 '나'여야 하는데, 지금은 1:1 방 로직상
      // "방 이름에 내 이름이 포함됨" && "보낸 사람이 내가 아님" && "is_read가 false"인 것을 찾습니다.
      const { data: unreadData } = await supabase
        .from("messages")
        .select("sender_name, room_id")
        .eq("is_read", false)     // 안 읽은 것만
        .neq("sender_name", myName); // 내가 보낸 건 제외

      if (unreadData) {
        // 친구 별로 개수 세기
        const counts: Record<string, number> = {};
        unreadData.forEach((msg) => {
          // 메시지가 온 방에 내 이름이 포함되어 있어야 진짜 나한테 온 것
          if (msg.room_id.includes(myName)) {
             counts[msg.sender_name] = (counts[msg.sender_name] || 0) + 1;
          }
        });
        setUnreadCounts(counts);
      }
    };

    fetchData();
    
    // (선택) 실시간으로 뱃지 숫자가 올라가게 하려면 구독 설정이 필요하지만,
    // 일단 새로고침하거나 탭을 눌렀을 때 갱신되도록 간단하게 처리했습니다.
    
  }, [myName]);

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-bold">친구 목록</h2>
        <p className="text-sm text-gray-500">대화하고 싶은 상대를 선택하세요.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {users.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            아직 대화한 사람이 없어요.<br/>
            메인에서 먼저 대화를 시작해보세요!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((name, index) => (
              <button
                key={index}
                onClick={() => onStartChat(name)}
                className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:bg-blue-50 transition"
              >
                <div className="flex items-center gap-4">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} 
                    alt={name} 
                    className="w-12 h-12 rounded-full bg-gray-200"
                  />
                  <div className="text-left">
                    <div className="font-bold text-gray-800">{name}</div>
                    <div className="text-xs text-gray-400">대화하기 👋</div>
                  </div>
                </div>

                {/* ⭐ 카카오톡 스타일 빨간 뱃지 */}
                {unreadCounts[name] > 0 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md">
                    {unreadCounts[name] > 99 ? "99+" : unreadCounts[name]}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}