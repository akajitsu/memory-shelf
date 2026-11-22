"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, prepareAudio, setSoundEnabled, subscribeSound, unlockAudio } from "@/lib/sound";

/** Unlocks Web Audio on the first user interaction (browsers require a gesture). */
export function SoundUnlocker() {
  useEffect(() => {
    // Build the engine while the browser is idle, so the first click stays fast.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => prepareAudio());
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
      cancel(handle as number);
    };
  }, []);
  return null;
}

export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, isSoundEnabled, () => true);
  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio();
        setSoundEnabled(!on);
      }}
      aria-pressed={on}
      aria-label={on ? "Mute sound effects" : "Turn on sound effects"}
      title={on ? "Sound on" : "Sound off"}
      className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-gold-soft transition-colors hover:bg-white/5 hover:text-ivory"
    >
      {on ? <Volume2 className="size-[18px]" aria-hidden /> : <VolumeX className="size-[18px]" aria-hidden />}
    </button>
  );
}
