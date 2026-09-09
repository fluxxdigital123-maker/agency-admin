import React from "react";
import { useTheme } from "./ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function TopBar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="glass-bar sticky top-0 z-30 h-12 flex items-center justify-end px-5">
      <button
        onClick={toggle}
        aria-label="Toggle color theme"
        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-200"
      >
        {theme === "dark" ? (
          <Sun className="w-[18px] h-[18px]" />
        ) : (
          <Moon className="w-[18px] h-[18px]" />
        )}
      </button>
    </header>
  );
}