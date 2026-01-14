import { useState } from "react";
import { supabase } from "../supabaseClient";
import { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
  onBack: () => void;
}

export default function MyPage({ user, onBack }: Props) {
  const userName = user?.user_metadata.full_name || user?.email?.split("@")[0] || "익명";
  const userEmail = user?.email || "";

  // ---------------------------------------------------------
  // 1. 상태 태그 (Badge) 관련 변수
  // ---------------------------------------------------------
  const [status, setStatus] = useState(user?.user_metadata?.status || "상태 설정 ✨");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // 2. 소개글 (Description) 관련 변수 ⭐ (새로 추가됨)
  const [description, setDescription] = useState(user?.user_metadata?.description || "오늘 기분은 어떠신가요? ✏️");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newDescription, setNewDescription] = useState("");

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // ---------------------------------------------------------
  // 기능 A. 상태 태그 저장하기
  // ---------------------------------------------------------
  const startEditingStatus = () => {
    setNewStatus(status);
    setIsEditingStatus(true);
  };

  const saveStatus = async () => {
    if (!newStatus.trim()) return;
    const { error } = await supabase.auth.updateUser({
      data: { status: newStatus },
    });
    if (error) alert("저장 실패: " + error.message);
    else {
      setStatus(newStatus);
      setIsEditingStatus(false);
    }
  };

  // ---------------------------------------------------------
  // 기능 B. 소개글 저장하기 ⭐ (새로 추가됨)
  // ---------------------------------------------------------
  const startEditingDesc = () => {
    setNewDescription(description); // 현재 글을 입력창에 넣기
    setIsEditingDesc(true);         // 수정 모드 켜기
  };

  const saveDescription = async () => {
    // 빈칸으로 저장하면 기본 멘트로 돌리기 (선택사항)
    const textToSave = newDescription.trim() || "오늘 기분은 어떠신가요? ✏️";

    // Supabase에 'description'이라는 이름으로 저장
    const { error } = await supabase.auth.updateUser({
      data: { description: textToSave },
    });

    if (error) alert("저장 실패: " + error.message);
    else {
      setDescription(textToSave);
      setIsEditingDesc(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button onClick={onBack} className="text-xl p-2 hover:bg-gray-100 rounded-full">
          ←
        </button>
        <span className="font-bold text-lg">{userName}</span>
        <div className="w-8"></div>
      </div>

      {/* 프로필 정보 섹션 */}
      <div className="p-4">
        <div className="flex items-center gap-6 mb-6">
          <div className="h-20 w-20 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden border">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} 
              alt="프사" 
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-1 justify-around text-center">
            <div>
              <div className="font-bold text-lg">0</div>
              <div className="text-xs text-gray-500">게시물</div>
            </div>
            <div>
              <div className="font-bold text-lg">120</div>
              <div className="text-xs text-gray-500">팔로워</div>
            </div>
            <div>
              <div className="font-bold text-lg">15</div>
              <div className="text-xs text-gray-500">팔로잉</div>
            </div>
          </div>
        </div>

        {/* 이름 및 텍스트 영역 */}
        <div className="mb-6 space-y-3">
          
          {/* 1. 이름 및 상태 태그 */}
          <div className="flex flex-col gap-1">
            <div className="font-bold text-base">{userName}</div>
            
            {isEditingStatus ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-32 rounded border px-2 py-1 text-xs focus:outline-blue-500"
                  autoFocus
                />
                <button onClick={saveStatus} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">저장</button>
                <button onClick={() => setIsEditingStatus(false)} className="text-xs bg-gray-200 px-2 py-1 rounded">취소</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer w-fit" onClick={startEditingStatus}>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {status}
                </span>
                <svg className="w-3 h-3 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
            )}
          </div>

          {/* 2. 소개글 (오늘의 기분) ⭐ 수정 가능하게 변경됨 */}
          <div>
            {isEditingDesc ? (
               // 수정 모드일 때
               <div className="flex flex-col gap-2">
                 <textarea
                   value={newDescription}
                   onChange={(e) => setNewDescription(e.target.value)}
                   className="w-full rounded border p-2 text-sm focus:outline-blue-500 resize-none"
                   rows={2}
                   placeholder="오늘 기분을 적어주세요..."
                   autoFocus
                 />
                 <div className="flex gap-2">
                   <button onClick={saveDescription} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded font-semibold">저장 완료</button>
                   <button onClick={() => setIsEditingDesc(false)} className="text-xs bg-gray-200 px-3 py-1.5 rounded">취소</button>
                 </div>
               </div>
            ) : (
               // 보기 모드일 때 (클릭하면 수정)
               <div 
                 className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded -ml-1 transition group"
                 onClick={startEditingDesc}
               >
                 {description}
                 <span className="ml-2 inline-block opacity-0 group-hover:opacity-100 text-gray-400 text-xs">
                   (수정 ✏️)
                 </span>
               </div>
            )}
          </div>

          <div className="text-xs text-blue-500 bg-blue-50 inline-block px-2 py-1 rounded">
            {userEmail}
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex gap-2">
          <button className="flex-1 rounded-md bg-gray-100 py-2 text-sm font-semibold hover:bg-gray-200 transition">
            프로필 편집
          </button>
          <button 
            onClick={handleLogout}
            className="flex-1 rounded-md bg-red-50 py-2 text-sm font-semibold text-red-500 hover:bg-red-100 transition"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="border-t mt-2 flex-1 bg-gray-50/50"></div>
    </div>
  );
}