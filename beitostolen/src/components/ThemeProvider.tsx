'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = { dark: boolean; largeText: boolean };
type ThemeCtx = Theme & { setDark: (v: boolean) => void; setLargeText: (v: boolean) => void };

const Ctx = createContext<ThemeCtx>({
  dark: false, largeText: false,
  setDark: () => {}, setLargeText: () => {},
});

export function useTheme() { return useContext(Ctx); }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState(false);
  const [largeText, setLargeTextState] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem('theme') === 'dark';
    const l = localStorage.getItem('largeText') === '1';
    setDarkState(d);
    setLargeTextState(l);
    applyClasses(d, l);
  }, []);

  function setDark(v: boolean) {
    setDarkState(v);
    localStorage.setItem('theme', v ? 'dark' : 'light');
    applyClasses(v, largeText);
  }

  function setLargeText(v: boolean) {
    setLargeTextState(v);
    localStorage.setItem('largeText', v ? '1' : '0');
    applyClasses(dark, v);
  }

  return (
    <Ctx.Provider value={{ dark, largeText, setDark, setLargeText }}>
      {children}
    </Ctx.Provider>
  );
}

function applyClasses(dark: boolean, largeText: boolean) {
  const html = document.documentElement;
  html.classList.toggle('dark', dark);
  html.classList.toggle('large-text', largeText);
}
