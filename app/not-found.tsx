import { NotFoundView } from "@/components/layout/not-found-view";
import { CelestialSky } from "@/components/sky/celestial-sky";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialSky motes={false} />
      <div className="relative z-[1] flex flex-1 flex-col">
        <NotFoundView />
      </div>
    </main>
  );
}
