"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, prepareAudio, setSoundEnabled, subscribeSound, unlockAudio } from "@/lib/sound";
import {
  MUSIC,
  getMusicState,
  getServerMusicState,
  onVisibilityChange,
  setMusicActive,
  setMusicEnabled,
  setMusicVolume,
  startMusic,
  subscribeMusic,
} from "@/lib/music";
import { cn } from "@/lib/utils";

/**
 * Unlocks Web Audio on the first user interaction (browsers require a gesture) and
 * runs the background music while the signed-in library is on screen.
 */
export function SoundUnlocker() {
  useEffect(() => {
    // Build the engine while the browser is idle, so the first click stays fast.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => prepareAudio());
    setMusicActive(true);
    const unlock = () => {
      unlockAudio();
      startMusic();
    };
    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      cancel(handle as number);
      setMusicActive(false);
    };
  }, []);
  return null;
}

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "border-aurora/50 bg-aurora/30" : "border-ivory/15 bg-abyss/70",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 left-0.5 size-[18px] -translate-y-1/2 rounded-full transition-transform duration-200",
          checked ? "translate-x-5 bg-aurora shadow-[0_0_10px_rgb(131_217_212/0.7)]" : "bg-silver/70",
        )}
      />
    </button>
  );
}

/** Header control: a small panel for the background music and the page sound effects. */
export function SoundToggle() {
  const effects = useSyncExternalStore(subscribeSound, isSoundEnabled, () => true);
  const music = useSyncExternalStore(subscribeMusic, getMusicState, getServerMusicState);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const available = music.status !== "unavailable";
  const playing = music.status === "playing";
  const anyOn = (music.enabled && available) || effects;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          unlockAudio();
          setOpen((o) => !o);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Sound settings"
        title="Sound"
        className="relative flex size-9 cursor-pointer items-center justify-center rounded-full text-silver transition-colors hover:bg-white/[0.06] hover:text-aurora"
      >
        {anyOn ? <Volume2 className="size-[18px]" aria-hidden /> : <VolumeX className="size-[18px]" aria-hidden />}
        {playing && (
          <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 animate-pulse rounded-full bg-moon shadow-[0_0_6px_rgb(232_215_139/0.9)]" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            id={panelId}
            role="dialog"
            aria-label="Sound"
            className="night-panel absolute right-0 z-50 mt-2 w-72 origin-top-right space-y-4 rounded-2xl p-4"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-moon/10 text-moon">
                  <Music2 className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ivory">Background music</p>
                  {available ? (
                    <>
                      <p className="truncate font-serif text-[14px] leading-snug text-silver/85 italic">{MUSIC.title}</p>
                      <p className="truncate text-[11px] text-silver/55">{MUSIC.artist}</p>
                    </>
                  ) : (
                    <p className="text-[13px] text-silver/70">Not available yet</p>
                  )}
                </div>
                <Switch
                  checked={music.enabled && available}
                  disabled={!available}
                  onChange={(on) => {
                    unlockAudio();
                    setMusicEnabled(on);
                  }}
                  label="Background music"
                />
              </div>
              <label className="flex items-center gap-3 pl-11 text-xs text-silver/70">
                <span className="sr-only">Music volume</span>
                <VolumeX className="size-3.5 shrink-0" aria-hidden />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(music.volume * 100)}
                  disabled={!available || !music.enabled}
                  onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                  aria-label="Music volume"
                  className="h-1 w-full cursor-pointer accent-[#83d9d4] disabled:cursor-not-allowed disabled:opacity-40"
                />
                <Volume2 className="size-3.5 shrink-0" aria-hidden />
              </label>
            </div>
            <div className="h-px bg-ivory/8" />
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-aurora/10 text-aurora">
                <Volume2 className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ivory">Page sounds</p>
                <p className="text-[13px] text-silver/70">Books, covers and pages</p>
              </div>
              <Switch
                checked={effects}
                onChange={(on) => {
                  unlockAudio();
                  setSoundEnabled(on);
                }}
                label="Page sounds"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
