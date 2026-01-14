import { supabase } from "../supabaseClient";
import { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
  onBack: () => void;
}

export default function MyPage({ user, onBack }: Props) {
  // 사용자 정보 가져오기
  const userName = user?.user_metadata.full_name || user?.email?.split("@")[0] || "익명";
  const userEmail = user?.email || "";

  // 로그아웃 처리
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* 1. 상단 네비게이션 (뒤로가기, 타이틀) */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button onClick={onBack} className="text-xl p-2 hover:bg-gray-100 rounded-full">
          ←
        </button>
        <span className="font-bold text-lg">{userName}</span>
        <div className="w-8"></div> {/* 균형 맞추기용 빈칸 */}
      </div>

      {/* 2. 프로필 정보 섹션 */}
      <div className="p-4">
        <div className="flex items-center gap-6 mb-6">
          {/* 프로필 이미지 */}
          <div className="h-20 w-20 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden border">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} 
              alt="프사" 
              className="h-full w-full object-cover"
            />
          </div>

          {/* 스탯 (사진이 없어졌으니 게시물 수는 0으로 고정하거나 숨겨도 됩니다) */}
          <div className="flex flex-1 justify-around text-center">
            <div>
              <div className="font-bold text-lg">0</div>
              <div className="text-xs text-gray-500">게시물</div>
            </div>
            <div>
              <div className="font-bold text-lg">0</div>
              <div className="text-xs text-gray-500">팔로워</div>
            </div>
            <div>
              <div className="font-bold text-lg">0</div>
              <div className="text-xs text-gray-500">팔로잉</div>
            </div>
          </div>
        </div>

        {/* 이름 및 소개글 */}
        <div className="mb-6 space-y-1">
          <div className="font-bold text-base">{userName}</div>
          <div className="text-sm text-gray-600">상태 메시지를 입력해주세요. ✏️</div>
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

      {/* 하단 여백 채우기 (깔끔하게 선 하나 긋기) */}
      <div className="border-t mt-2 flex-1 bg-gray-50/50"></div>
    </div>
  );
}