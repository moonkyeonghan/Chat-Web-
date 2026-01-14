import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLoginMode) {
      // --- 로그인 모드 ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        // 로그인 에러 메시지 번역
        if (error.message.includes("Invalid login credentials")) {
          alert("❌ 아이디(이메일)가 없거나 비밀번호가 틀렸습니다.");
        } else {
          alert("로그인 에러: " + error.message);
        }
      }
    } else {
      // --- 회원가입 모드 ---
      if (!name.trim()) {
        alert("이름을 입력해주세요!");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        // ⭐ 여기가 핵심! 에러 원인을 정확히 알려줍니다.
        if (error.message.includes("User already registered")) {
          alert("🚨 이미 가입된 '이메일'입니다!\n다른 이메일을 사용하거나 로그인을 해주세요.");
        } else if (error.message.includes("Password")) {
          alert("🔒 비밀번호 보안 문제!\n비밀번호는 최소 6자리 이상이어야 합니다.");
        } else if (error.message.includes("valid email")) {
          alert("📧 이메일 형식이 아닙니다.\n올바른 이메일 주소를 입력해주세요.");
        } else {
          alert("회원가입 실패: " + error.message);
        }
      } else {
        alert("🎉 회원가입 성공! 이제 로그인 해주세요.");
        setIsLoginMode(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold">
          {isLoginMode ? "채팅방 입장" : "회원가입"}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          {isLoginMode
            ? "로그인하여 친구들과 대화를 시작하세요."
            : "이름을 설정하고 채팅에 참여하세요."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLoginMode && (
            <div>
              <input
                type="text"
                placeholder="사용할 이름 (닉네임)"
                className="w-full rounded border p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-400 pl-1">
                * 이름은 중복되어도 가입됩니다.
              </p>
            </div>
          )}

          <input
            type="email"
            placeholder="이메일"
            className="rounded border p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호 (6자리 이상)"
            className="rounded border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`rounded p-2 text-white disabled:opacity-50 ${
              isLoginMode
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "처리 중..." : isLoginMode ? "로그인" : "회원가입"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">
            {isLoginMode
              ? "아직 계정이 없으신가요? "
              : "이미 계정이 있으신가요? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setEmail("");
              setPassword("");
              setName("");
            }}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            {isLoginMode ? "회원가입 하러가기" : "로그인 하러가기"}
          </button>
        </div>
      </div>
    </div>
  );
}