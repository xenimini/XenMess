export type Theme = "green" | "blue" | "orange";

export interface ThemeConfig {
    name: string;
    emoji: string;
    bgPrimary: string;
    bgSecondary: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    messageOwn: string;
    messageOther: string;
    border: string;
}

export const themes: Record<Theme, ThemeConfig> = {
    green: {
        name: "Зелёная",
        emoji: "🌿",
        bgPrimary: "linear-gradient(160deg, #0b1f14 0%, #0f2e1c 40%, #143d24 100%)",
        bgSecondary: "#0d1f15",
        textPrimary: "#ffffff",
        textSecondary: "#b7d4c2",
        accent: "#2e7d32",
        messageOwn: "#1b5e20",
        messageOther: "#2e7d32",
        border: "rgba(46, 125, 50, 0.45)",
    },
    blue: {
        name: "Голубая",
        emoji: "💧",
        bgPrimary: "linear-gradient(160deg, #d6f0ff 0%, #b3e5fc 50%, #e1f5fe 100%)",
        bgSecondary: "#e3f2fd",
        textPrimary: "#0d1b2a",
        textSecondary: "#37474f",
        accent: "#0288d1",
        messageOwn: "#81d4fa",
        messageOther: "#e1f5fe",
        border: "rgba(2, 136, 209, 0.35)",
    },
    orange: {
        name: "Оранжевая",
        emoji: "🔥",
        bgPrimary: "linear-gradient(160deg, #1a0f0a 0%, #2b1810 45%, #3d2314 100%)",
        bgSecondary: "#1a120c",
        textPrimary: "#ffffff",
        textSecondary: "#ffcc80",
        accent: "#ff6d00",
        messageOwn: "#000000",
        messageOther: "#1a1a1a",
        border: "rgba(255, 109, 0, 0.4)",
    },
};

export const THEME_KEY = "selected-theme";

export function getSavedTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && saved in themes) {
        return saved as Theme;
    }
    return "green";
}

export function saveTheme(theme: Theme) {
    localStorage.setItem(THEME_KEY, theme);
}