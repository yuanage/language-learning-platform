import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// UI 偏好：亮/暗主题（持久化；index.html 有防闪烁预置脚本同步读取该键）
export const useUiStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        document.documentElement.dataset.theme = next;
      },
      initTheme: () => {
        // 以持久化值校准 DOM（防闪烁脚本可能已按系统偏好预设）
        document.documentElement.dataset.theme = get().theme;
      }
    }),
    { name: 'llp-ui' }
  )
);
