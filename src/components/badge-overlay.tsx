import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { getBadgeFeed } from "@/lib/badge-feed";
import type { Badge, BadgeFeed } from "@/lib/badge-types";

const DAYS = ["SO.", "MO.", "DI.", "MI.", "DO.", "FR.", "SA."];
const MONTHS = [
  "JANUAR", "FEBRUAR", "MÄRZ", "APRIL", "MAI", "JUNI",
  "JULI", "AUGUST", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DEZEMBER",
];
const TZ = "Europe/Berlin";
const CHANNEL_KEY = "tb.channel";

function berlinParts(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const wd = (get("weekday") || "Fri").slice(0, 2).toUpperCase();
  const map: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  return {
    dayIndex: map[wd] ?? 5,
    day: Number(get("day")),
    month: Number(get("month")),
    year: Number(get("year")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

function fmtClockFromParts(p: ReturnType<typeof berlinParts>): string {
  return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

function fmtDateFromParts(p: ReturnType<typeof berlinParts>): string {
  return `${DAYS[p.dayIndex]}, ${p.day}. ${MONTHS[p.month - 1]} ${p.year}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function daysAgo(iso: string | null): string {
  if (!iso) return "aktiv";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "heute";
  if (d === 1) return "vor 1 Tag";
  return `vor ${d} Tg`;
}

function countdown(iso: string | null): string {
  if (!iso) return "—  :  —  :  —";
  const t = new Date(iso).getTime() - Date.now();
  if (t <= 0) return "00  :  00  :  00";
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  if (h > 99) {
    const days = Math.floor(h / 24);
    return `${pad(days)}T ${pad(h % 24)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(h)}  :  ${pad(m)}  :  ${pad(s)}`;
}

function LiveCountdown({ iso }: { iso: string | null }) {
  const [text, setText] = useState("—  :  —  :  —");
  useEffect(() => {
    const tick = () => setText(countdown(iso));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return <span className="tb-timer">{text}</span>;
}

function LiveBar({ badge }: { badge: Badge }) {
  const [w, setW] = useState(8);
  useEffect(() => {
    setW(progress(badge));
  }, [badge.id, badge.start, badge.end]);
  return <i style={{ width: `${w}%` }} />;
}

function progress(b: Badge): number {
  if (!b.start || !b.end) return 8;
  const a = new Date(b.start).getTime();
  const z = new Date(b.end).getTime();
  const n = Date.now();
  if (z <= a) return 8;
  return Math.round(Math.max(4, Math.min(96, ((n - a) / (z - a)) * 100)));
}

function costLabel(b: Badge): string {
  if (b.status === "upcoming") return "DEMNÄCHST";
  return b.free ? "KOSTENLOS" : "BEZAHLT";
}

function chipClass(b: Badge): string {
  if (b.status === "upcoming") return "tb-chip soon";
  return b.free ? "tb-chip" : "tb-chip paid";
}

function howLabel(b: Badge): string {
  if (b.how === "ticket") return "TICKET";
  if (b.how === "sub") return "SUB / GIFT";
  return "WATCHTIME";
}

function collectors(n: number | null): string {
  if (n == null) return "—";
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function withinDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const dt = Date.now() - new Date(iso).getTime();
  return dt >= 0 && dt <= days * 86400000;
}

function endsWithin(iso: string | null, hours: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime() - Date.now();
  return t > 0 && t <= hours * 3600000;
}

function useChannel(urlChannel?: string) {
  const [channel, setChannel] = useState(urlChannel ?? "");
  useEffect(() => {
    if (urlChannel) {
      setChannel(urlChannel);
      localStorage.setItem(CHANNEL_KEY, urlChannel);
      return;
    }
    const stored = localStorage.getItem(CHANNEL_KEY);
    if (stored) setChannel(stored);
  }, [urlChannel]);
  const save = (value: string) => {
    setChannel(value);
    localStorage.setItem(CHANNEL_KEY, value);
  };
  return { channel, save };
}

function useClock() {
  const [now, setNow] = useState<ReturnType<typeof berlinParts> | null>(null);
  useEffect(() => {
    setNow(berlinParts());
    const id = setInterval(() => setNow(berlinParts()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

type Props = {
  channelParam?: string;
  intervalSec?: number;
  initialFeed?: BadgeFeed;
};

export function BadgeOverlay({ channelParam, intervalSec = 8, initialFeed }: Props) {
  const interval = Math.max(4, intervalSec) * 1000;
  const { channel, save } = useChannel(channelParam);
  const now = useClock();
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const q = useQuery({
    queryKey: ["badge-feed"],
    queryFn: () => getBadgeFeed(),
    initialData: initialFeed,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const badges = q.data?.badges ?? [];
  const active = useMemo(
    () => badges.filter((b) => b.status === "active"),
    [badges],
  );
  const upcoming = useMemo(
    () => badges.filter((b) => b.status === "upcoming"),
    [badges],
  );
  const endingSoon = useMemo(
    () => active.filter((b) => endsWithin(b.end, 72)),
    [active],
  );
  const recent = useMemo(() => {
    const list = active.filter((b) => withinDays(b.start, 14));
    const src = list.length ? list : active;
    return [...src].sort((a, b) => (b.start ?? "").localeCompare(a.start ?? "")).slice(0, 14);
  }, [active]);

  const pool = active.length ? active : badges;
  const safeIdx = pool.length ? idx % pool.length : 0;
  const featured = pool[safeIdx];

  useEffect(() => {
    if (!pool.length || paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % pool.length), interval);
    return () => clearInterval(id);
  }, [pool.length, paused, interval]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.code === "ArrowRight" && pool.length) setIdx((i) => (i + 1) % pool.length);
      if (e.code === "ArrowLeft" && pool.length) setIdx((i) => (i - 1 + pool.length) % pool.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pool.length]);

  const nextFour = pool.length
    ? [1, 2, 3, 4].map((off) => pool[(safeIdx + off) % pool.length])
    : [];

  const ticker = [...active, ...upcoming];

  return (
    <div className="tb-root">
      <div className="tb-fit">
        <div className="tb-stage">
          <header className="tb-header">
            <div>
              <div className="tb-clock">{now ? fmtClockFromParts(now) : "00:00:00"}</div>
              <div className="tb-date">{now ? fmtDateFromParts(now) : "—"}</div>
            </div>
            <div className="tb-brand">
              <div className="tb-dot" />
              <div className="min-w-0">
                <div className="tb-logo">
                  Twitch<span>Badges</span>
                </div>
                <div className="tb-channel">
                  {channel ? `${channel} · LIVE BADGE-TRACKER` : "LIVE BADGE-TRACKER"}
                </div>
              </div>
            </div>
            <div className="tb-stats">
              <div className="tb-pill ending">
                <i className="tb-dot-h" />
                <span className="n">{endingSoon.length}</span>&nbsp;BALD
              </div>
              <div className="tb-pill aktiv">
                <i className="tb-dot-g" />
                <span className="n">{active.length}</span>&nbsp;AKTIV
              </div>
              <div className="tb-pill soon">
                <i className="tb-dot-a" />
                <span className="n">{upcoming.length}</span>&nbsp;DEMNÄCHST
              </div>
              <button className="tb-gear" type="button" aria-label="Kanalname" onClick={() => setOpen((v) => !v)}>
                <Settings2 size={16} />
              </button>
            </div>
          </header>

          <div className="tb-main">
            <aside className="tb-panel">
              <div className="tb-panel-h"><i className="tb-mark p" /> Neu · Letzte 14 Tage</div>
              <div className="tb-list">
                {recent.length === 0 ? (
                  <div className="tb-empty">KEINE EINTRÄGE</div>
                ) : (
                  recent.map((b) => (
                    <div key={b.id} className={`tb-item ${featured?.id === b.id ? "on" : ""}`}>
                      <img src={b.image} alt="" width={32} height={32} />
                      <div className="min-w-0">
                        <div className="name">{b.name}</div>
                        <div className="sub">
                          {daysAgo(b.start)} · {b.free ? "KOSTENLOS" : "BEZAHLT"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>

            <section className="tb-center">
              <article className="tb-hero">
                {featured ? (
                  <div key={featured.id} className="tb-hero-inner tb-swap">
                    <div className="tb-hero-art">
                      <img src={featured.image} alt={featured.name} width={168} height={168} />
                    </div>
                    <div className="min-w-0 pt-2">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className={chipClass(featured)}>{costLabel(featured)}</span>
                        <span className="tb-idx">
                          {pad(safeIdx + 1)} / {pad(pool.length)}
                        </span>
                      </div>
                      <h1>{featured.name}</h1>
                      <p className="tb-desc">
                        {featured.description || featured.howText || `${howLabel(featured)} · ${costLabel(featured)}`}
                      </p>
                      <div className={`tb-ends ${featured.status === "upcoming" ? "start" : ""}`}>
                        {featured.status === "upcoming" ? "STARTET IN" : "ENDET IN"}
                        <LiveCountdown iso={featured.status === "upcoming" ? featured.start : featured.end} />
                        <span className="tb-idx">{howLabel(featured)}</span>
                      </div>
                      <div className="tb-bar-wrap">
                        <div className="tb-bar">
                          <LiveBar badge={featured} />
                        </div>
                        <div className="tb-bar-lbl">
                          <span>FREIGESCHALTET</span>
                          <span>{collectors(featured.collectors)} — SAMMLER</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="tb-hero-inner">
                    <div className="tb-empty">Lade BadgeBase…</div>
                  </div>
                )}
              </article>
              <div className="tb-strip">
                {nextFour.map((b) => (
                  <div key={b.id} className="tb-mini">
                    <img src={b.image} alt="" width={40} height={40} />
                    <div className="min-w-0">
                      <div className="name">{b.name}</div>
                      <div className="tick" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="tb-panel">
              <div className="tb-panel-h"><i className="tb-mark a" /> Demnächst</div>
              <div className="tb-list">
                {upcoming.length === 0 ? (
                  <div className="tb-empty">KEINE EINTRÄGE</div>
                ) : (
                  upcoming.map((b) => (
                    <div key={b.id} className="tb-item">
                      <img src={b.image} alt="" width={32} height={32} />
                      <div className="min-w-0">
                        <div className="name">{b.name}</div>
                        <div className="sub">
                          {b.start ? `in ${Math.max(0, Math.ceil((new Date(b.start).getTime() - Date.now()) / 86400000))} Tg` : "TBA"}
                          {" · "}
                          {b.free ? "KOSTENLOS" : "BEZAHLT"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>

          <footer className="tb-foot">
            <div className="tb-navn">{channel ? channel.slice(0, 1).toUpperCase() : "N"}</div>
            <div className="tb-ticker">
              <div className="tb-track">
                {ticker.concat(ticker).map((b, i) => (
                  <span key={`${b.id}-${i}`}>
                    {b.name}
                    <span className="sep">◆</span>
                  </span>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>

      {open ? (
        <div className="tb-settings">
          <label htmlFor="channel">Kanalname im Header</label>
          <input
            id="channel"
            value={channel}
            onChange={(e) => save(e.target.value)}
            placeholder="z. B. D0GECOIN"
            maxLength={32}
          />
          <p>Steht dauerhaft oben neben TwitchBadges. In OBS als Browser-Source 1920×1080 nutzen.</p>
        </div>
      ) : null}

      <div className="tb-mobile">
        <div className="tb-m-head">
          <div>
            <div className="tb-clock" style={{ fontSize: 28 }}>{now ? fmtClockFromParts(now) : "00:00:00"}</div>
            <div className="tb-logo" style={{ fontSize: 22, marginTop: 6 }}>
              Twitch<span>Badges</span>
            </div>
            <div className="tb-channel">{channel || "LIVE BADGE-TRACKER"}</div>
          </div>
          <button className="tb-gear" type="button" aria-label="Kanalname" onClick={() => setOpen((v) => !v)}>
            <Settings2 size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="tb-pill ending"><i className="tb-dot-h" /><span className="n">{endingSoon.length}</span>&nbsp;ENDET BALD</div>
          <div className="tb-pill aktiv"><i className="tb-dot-g" /><span className="n">{active.length}</span>&nbsp;AKTIV</div>
          <div className="tb-pill soon"><i className="tb-dot-a" /><span className="n">{upcoming.length}</span>&nbsp;DEMNÄCHST</div>
        </div>
        {featured ? (
          <div className="tb-m-hero">
            <img src={featured.image} alt={featured.name} width={72} height={72} />
            <div className="min-w-0">
              <span className={chipClass(featured)}>{costLabel(featured)}</span>
              <h1 className="mt-2 text-2xl font-extrabold uppercase leading-tight">{featured.name}</h1>
              <p className="mt-1 text-sm text-muted">{featured.description}</p>
              <p className="tb-timer mt-2 text-sm">
                {featured.status === "upcoming" ? "STARTET" : "ENDET"}{" "}
                <LiveCountdown iso={featured.status === "upcoming" ? featured.start : featured.end} />
              </p>
            </div>
          </div>
        ) : null}
        <div className="tb-panel-h px-0"><i className="tb-mark p" /> Aktiv jetzt</div>
        <div className="tb-m-list">
          {active.map((b) => (
            <div key={b.id} className="tb-item">
              <img src={b.image} alt="" width={32} height={32} />
              <div className="min-w-0">
                <div className="name">{b.name}</div>
                <div className="sub">{howLabel(b)} · endet <LiveCountdown iso={b.end} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="tb-panel-h px-0"><i className="tb-mark a" /> Demnächst</div>
        <div className="tb-m-list">
          {upcoming.map((b) => (
            <div key={b.id} className="tb-item">
              <img src={b.image} alt="" width={32} height={32} />
              <div className="min-w-0">
                <div className="name">{b.name}</div>
                <div className="sub">{b.free ? "KOSTENLOS" : "BEZAHLT"} · {howLabel(b)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
