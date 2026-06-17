/**
 * 登入狀態管理(React Context)。
 *
 * 職責:
 *   - App 啟動時從安全儲存還原 token,並向後端確認身分(/auth/me)。
 *   - 提供 login / register / logout,成功後把 token 存進安全儲存,
 *     並透過 setAuthToken() 讓之後所有 API 請求自動帶上。
 *   - 對外暴露目前 user 與 loading,讓畫面決定要顯示登入頁還是內容。
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  setAuthToken,
  registerEmail,
  loginEmail,
  fetchMe,
  ApiError,
} from "./api";
import { getItem, setItem, deleteItem } from "./storage";

const TOKEN_KEY = "hexagram_auth_token";

interface AuthContextValue {
  user: User | null;
  /** 初次啟動還原登入狀態時為 true;期間顯示載入畫面。 */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  /** 重新向後端拉一次會員資料(例如扣點 / 加點後刷新餘額)。 */
  refresh: () => Promise<void>;
  /** 直接覆寫本地 user(扣點 API 已回傳最新餘額時,免再打一次網路)。 */
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 把 token 同時寫進記憶體(api 層)與安全儲存
  const persistToken = useCallback(async (token: string | null) => {
    setAuthToken(token);
    if (token) await setItem(TOKEN_KEY, token);
    else await deleteItem(TOKEN_KEY);
  }, []);

  // 啟動時還原:有 token 就驗證一次,失效則清掉
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = await getItem(TOKEN_KEY);
        if (!token) return;
        setAuthToken(token);
        const { user: me } = await fetchMe();
        if (alive) setUserState(me);
      } catch (e) {
        // token 失效 / 過期 → 清掉,維持未登入
        if (e instanceof ApiError && e.status === 401) {
          await persistToken(null);
        }
        // 其他(網路錯誤)則保留 token,下次再試
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [persistToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user: u } = await loginEmail(email, password);
      await persistToken(token);
      setUserState(u);
    },
    [persistToken]
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { token, user: u } = await registerEmail(email, password, displayName);
      await persistToken(token);
      setUserState(u);
    },
    [persistToken]
  );

  const logout = useCallback(async () => {
    await persistToken(null);
    setUserState(null);
  }, [persistToken]);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await fetchMe();
      setUserState(me);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await persistToken(null);
        setUserState(null);
      }
    }
  }, [persistToken]);

  const setUser = useCallback((u: User) => setUserState(u), []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必須在 <AuthProvider> 之內使用");
  return ctx;
}
