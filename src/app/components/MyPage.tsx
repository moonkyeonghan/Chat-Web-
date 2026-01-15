import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
  onBack: () => void;
}

type Post = {
  id: number;
  image_url: string;
  content: string;
};

export default function MyPage({ user, onBack }: Props) {
  const userName = user?.user_metadata.full_name || user?.email?.split("@")[0] || "익명";
  const userEmail = user?.email || "";

  // === 상태 메시지 관련 ===
  const [status, setStatus] = useState(user?.user_metadata?.status || "상태 설정 ✨");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const [description, setDescription] = useState(user?.user_metadata?.description || "오늘 기분은 어떠신가요? ✏️");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newDescription, setNewDescription] = useState("");

  // === ⭐ 사진 게시물 관련 ===
  const [posts, setPosts] = useState<Post[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 내 게시물 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false });
      if (data) setPosts(data);
    };
    fetchPosts();
  }, [userEmail]);

  // 2. 사진 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(filePath, file);

    if (uploadError) {
      alert("업로드 실패: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("posts")
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase.from("posts").insert([
      {
        user_email: userEmail,
        image_url: publicUrl,
        content: "새로운 게시물",
      },
    ]);

    if (dbError) {
      alert("DB 저장 실패: " + dbError.message);
    } else {
      // 목록 새로고침
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false });
      if (data) setPosts(data);
    }
    setUploading(false);
  };

  // 3. ⭐ 게시물 삭제 함수 (새로 추가됨)
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    // DB에서 삭제
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      // 화면에서도 바로 지우기
      setPosts(posts.filter((p) => p.id !== postId));
    }
  };

  // === 기존 로그아웃 및 상태 저장 함수들 ===
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const saveStatus = async () => {
    if (!newStatus.trim()) return;
    const { error } = await supabase.auth.updateUser({ data: { status: newStatus } });
    if (!error) { setStatus(newStatus); setIsEditingStatus(false); }
  };

  const saveDescription = async () => {
    const text = newDescription.trim() || "오늘 기분은 어떠신가요? ✏️";
    const { error } = await supabase.auth.updateUser({ data: { description: text } });
    if (!error) { setDescription(text); setIsEditingDesc(false); }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* 상단바 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button onClick={onBack} className="text-xl p-2 hover:bg-gray-100 rounded-full">←</button>
        <span className="font-bold text-lg">{userName}</span>
        
        {/* 카메라 아이콘 버튼 */}
        <button 
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()} 
          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
        >
          {uploading ? "..." : (
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          )}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="image/*"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* 프로필 정보 */}
          <div className="flex items-center gap-6 mb-6">
            <div className="h-20 w-20 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden border">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="프사" className="h-full w-full object-cover"/>
            </div>
            <div className="flex flex-1 justify-around text-center">
              <div>
                <div className="font-bold text-lg">{posts.length}</div>
                <div className="text-xs text-gray-500">게시물</div>
              </div>
              <div><div className="font-bold text-lg">0</div><div className="text-xs text-gray-500">팔로워</div></div>
              <div><div className="font-bold text-lg">0</div><div className="text-xs text-gray-500">팔로잉</div></div>
            </div>
          </div>

          {/* 상태 메시지 & 소개글 */}
          <div className="mb-6 space-y-3">
             <div className="flex flex-col gap-1">
                <div className="font-bold text-base">{userName}</div>
                {isEditingStatus ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input type="text" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-32 rounded border px-2 py-1 text-xs" autoFocus />
                    <button onClick={saveStatus} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">저장</button>
                    <button onClick={() => setIsEditingStatus(false)} className="text-xs bg-gray-200 px-2 py-1 rounded">취소</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer w-fit" onClick={() => { setNewStatus(status); setIsEditingStatus(true); }}>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{status}</span>
                    <svg className="w-3 h-3 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                )}
             </div>
             
             <div>
                {isEditingDesc ? (
                   <div className="flex flex-col gap-2">
                     <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full rounded border p-2 text-sm resize-none" rows={2} autoFocus />
                     <div className="flex gap-2">
                       <button onClick={saveDescription} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded">저장</button>
                       <button onClick={() => setIsEditingDesc(false)} className="text-xs bg-gray-200 px-3 py-1.5 rounded">취소</button>
                     </div>
                   </div>
                ) : (
                   <div className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded -ml-1 transition group" onClick={() => { setNewDescription(description); setIsEditingDesc(true); }}>
                     {description} <span className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 text-xs">✎</span>
                   </div>
                )}
             </div>
             <div className="text-xs text-blue-500 bg-blue-50 inline-block px-2 py-1 rounded">{userEmail}</div>
          </div>

          <div className="flex gap-2 mb-6">
            <button className="flex-1 rounded-md bg-gray-100 py-2 text-sm font-semibold hover:bg-gray-200">프로필 편집</button>
            <button onClick={handleLogout} className="flex-1 rounded-md bg-red-50 py-2 text-sm font-semibold text-red-500 hover:bg-red-100">로그아웃</button>
          </div>
        </div>

        {/* ⭐ 사진 그리드 영역 */}
        <div className="border-t">
            <div className="flex justify-around py-2 border-b">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            
            <div className="grid grid-cols-3 gap-0.5">
                {posts.map((post) => (
                    <div key={post.id} className="aspect-square bg-gray-100 relative group">
                        <img src={post.image_url} alt="게시물" className="w-full h-full object-cover" />
                        
                        {/* ⭐ 마우스 올리면(hover) 나타나는 삭제 버튼 */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="text-white bg-red-500 p-2 rounded-full hover:bg-red-600"
                            title="삭제하기"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                    </div>
                ))}
                {posts.length === 0 && (
                    <div className="col-span-3 text-center py-10 text-gray-400 text-sm">
                        아직 게시물이 없어요.<br/>오른쪽 위 버튼을 눌러 사진을 올려보세요! 📷
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}