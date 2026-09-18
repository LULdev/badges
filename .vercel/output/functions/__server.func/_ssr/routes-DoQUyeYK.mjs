import { i as __toESM } from "../_runtime.mjs";
import { i as require_react, r as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as Settings2 } from "../_libs/lucide-react.mjs";
import { n as Route, r as getBadgeFeed } from "./router-Dcr0kZi0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DoQUyeYK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DAYS = [
	"SO.",
	"MO.",
	"DI.",
	"MI.",
	"DO.",
	"FR.",
	"SA."
];
var MONTHS = [
	"JANUAR",
	"FEBRUAR",
	"MÄRZ",
	"APRIL",
	"MAI",
	"JUNI",
	"JULI",
	"AUGUST",
	"SEPTEMBER",
	"OKTOBER",
	"NOVEMBER",
	"DEZEMBER"
];
var TZ = "Europe/Berlin";
var CHANNEL_KEY = "tb.channel";
function berlinParts(d = /* @__PURE__ */ new Date()) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: TZ,
		weekday: "short",
		day: "numeric",
		month: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23"
	}).formatToParts(d);
	const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
	return {
		dayIndex: {
			SU: 0,
			MO: 1,
			TU: 2,
			WE: 3,
			TH: 4,
			FR: 5,
			SA: 6
		}[(get("weekday") || "Fri").slice(0, 2).toUpperCase()] ?? 5,
		day: Number(get("day")),
		month: Number(get("month")),
		year: Number(get("year")),
		hour: Number(get("hour")),
		minute: Number(get("minute")),
		second: Number(get("second"))
	};
}
function fmtClockFromParts(p) {
	return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}
function fmtDateFromParts(p) {
	return `${DAYS[p.dayIndex]}, ${p.day}. ${MONTHS[p.month - 1]} ${p.year}`;
}
function pad(n) {
	return String(n).padStart(2, "0");
}
function daysAgo(iso) {
	if (!iso) return "aktiv";
	const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
	if (d <= 0) return "heute";
	if (d === 1) return "vor 1 Tag";
	return `vor ${d} Tg`;
}
function countdown(iso) {
	if (!iso) return "—  :  —  :  —";
	const t = new Date(iso).getTime() - Date.now();
	if (t <= 0) return "00  :  00  :  00";
	const h = Math.floor(t / 36e5);
	const m = Math.floor(t % 36e5 / 6e4);
	const s = Math.floor(t % 6e4 / 1e3);
	if (h > 99) return `${pad(Math.floor(h / 24))}T ${pad(h % 24)}:${pad(m)}:${pad(s)}`;
	return `${pad(h)}  :  ${pad(m)}  :  ${pad(s)}`;
}
function LiveCountdown({ iso }) {
	const [text, setText] = (0, import_react.useState)("—  :  —  :  —");
	(0, import_react.useEffect)(() => {
		const tick = () => setText(countdown(iso));
		tick();
		const id = setInterval(tick, 1e3);
		return () => clearInterval(id);
	}, [iso]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "tb-timer",
		children: text
	});
}
function LiveBar({ badge }) {
	const [w, setW] = (0, import_react.useState)(8);
	(0, import_react.useEffect)(() => {
		setW(progress(badge));
	}, [
		badge.id,
		badge.start,
		badge.end
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${w}%` } });
}
function progress(b) {
	if (!b.start || !b.end) return 8;
	const a = new Date(b.start).getTime();
	const z = new Date(b.end).getTime();
	const n = Date.now();
	if (z <= a) return 8;
	return Math.round(Math.max(4, Math.min(96, (n - a) / (z - a) * 100)));
}
function costLabel(b) {
	if (b.status === "upcoming") return "DEMNÄCHST";
	return b.free ? "KOSTENLOS" : "BEZAHLT";
}
function chipClass(b) {
	if (b.status === "upcoming") return "tb-chip soon";
	return b.free ? "tb-chip" : "tb-chip paid";
}
function howLabel(b) {
	if (b.how === "ticket") return "TICKET";
	if (b.how === "sub") return "SUB / GIFT";
	return "WATCHTIME";
}
function collectors(n) {
	if (n == null) return "—";
	return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function withinDays(iso, days) {
	if (!iso) return false;
	const dt = Date.now() - new Date(iso).getTime();
	return dt >= 0 && dt <= days * 864e5;
}
function endsWithin(iso, hours) {
	if (!iso) return false;
	const t = new Date(iso).getTime() - Date.now();
	return t > 0 && t <= hours * 36e5;
}
function useChannel(urlChannel) {
	const [channel, setChannel] = (0, import_react.useState)(urlChannel ?? "");
	(0, import_react.useEffect)(() => {
		if (urlChannel) {
			setChannel(urlChannel);
			localStorage.setItem(CHANNEL_KEY, urlChannel);
			return;
		}
		const stored = localStorage.getItem(CHANNEL_KEY);
		if (stored) setChannel(stored);
	}, [urlChannel]);
	const save = (value) => {
		setChannel(value);
		localStorage.setItem(CHANNEL_KEY, value);
	};
	return {
		channel,
		save
	};
}
function useClock() {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setNow(berlinParts());
		const id = setInterval(() => setNow(berlinParts()), 1e3);
		return () => clearInterval(id);
	}, []);
	return now;
}
function BadgeOverlay({ channelParam, intervalSec = 8, initialFeed }) {
	const interval = Math.max(4, intervalSec) * 1e3;
	const { channel, save } = useChannel(channelParam);
	const now = useClock();
	const [idx, setIdx] = (0, import_react.useState)(0);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [paused, setPaused] = (0, import_react.useState)(false);
	const badges = useQuery({
		queryKey: ["badge-feed"],
		queryFn: () => getBadgeFeed(),
		initialData: initialFeed,
		refetchInterval: 6e4,
		staleTime: 3e4
	}).data?.badges ?? [];
	const active = (0, import_react.useMemo)(() => badges.filter((b) => b.status === "active"), [badges]);
	const upcoming = (0, import_react.useMemo)(() => badges.filter((b) => b.status === "upcoming"), [badges]);
	const endingSoon = (0, import_react.useMemo)(() => active.filter((b) => endsWithin(b.end, 72)), [active]);
	const recent = (0, import_react.useMemo)(() => {
		const list = active.filter((b) => withinDays(b.start, 14));
		return [...list.length ? list : active].sort((a, b) => (b.start ?? "").localeCompare(a.start ?? "")).slice(0, 14);
	}, [active]);
	const pool = active.length ? active : badges;
	const safeIdx = pool.length ? idx % pool.length : 0;
	const featured = pool[safeIdx];
	(0, import_react.useEffect)(() => {
		if (!pool.length || paused) return;
		const id = setInterval(() => setIdx((i) => (i + 1) % pool.length), interval);
		return () => clearInterval(id);
	}, [
		pool.length,
		paused,
		interval
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
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
	const nextFour = pool.length ? [
		1,
		2,
		3,
		4
	].map((off) => pool[(safeIdx + off) % pool.length]) : [];
	const ticker = [...active, ...upcoming];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "tb-root",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "tb-fit",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "tb-stage",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "tb-header",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "tb-clock",
									children: now ? fmtClockFromParts(now) : "00:00:00"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "tb-date",
									children: now ? fmtDateFromParts(now) : "—"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "tb-brand",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tb-dot" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "tb-logo",
											children: ["Twitch", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Badges" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "tb-channel",
											children: channel ? `${channel} · LIVE BADGE-TRACKER` : "LIVE BADGE-TRACKER"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "tb-stats",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "tb-pill ending",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-dot-h" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "n",
													children: endingSoon.length
												}),
												"\xA0BALD"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "tb-pill aktiv",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-dot-g" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "n",
													children: active.length
												}),
												"\xA0AKTIV"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "tb-pill soon",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-dot-a" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "n",
													children: upcoming.length
												}),
												"\xA0DEMNÄCHST"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "tb-gear",
											type: "button",
											"aria-label": "Kanalname",
											onClick: () => setOpen((v) => !v),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { size: 16 })
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "tb-main",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
									className: "tb-panel",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "tb-panel-h",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-mark p" }), " Neu · Letzte 14 Tage"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "tb-list",
										children: recent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "tb-empty",
											children: "KEINE EINTRÄGE"
										}) : recent.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `tb-item ${featured?.id === b.id ? "on" : ""}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: b.image,
												alt: "",
												width: 32,
												height: 32
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "name",
													children: b.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "sub",
													children: [
														daysAgo(b.start),
														" · ",
														b.free ? "KOSTENLOS" : "BEZAHLT"
													]
												})]
											})]
										}, b.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "tb-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
										className: "tb-hero",
										children: featured ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "tb-hero-inner tb-swap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "tb-hero-art",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: featured.image,
													alt: featured.name,
													width: 168,
													height: 168
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 pt-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mb-2.5 flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: chipClass(featured),
															children: costLabel(featured)
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "tb-idx",
															children: [
																pad(safeIdx + 1),
																" / ",
																pad(pool.length)
															]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: featured.name }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "tb-desc",
														children: featured.description || featured.howText || `${howLabel(featured)} · ${costLabel(featured)}`
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: `tb-ends ${featured.status === "upcoming" ? "start" : ""}`,
														children: [
															featured.status === "upcoming" ? "STARTET IN" : "ENDET IN",
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveCountdown, { iso: featured.status === "upcoming" ? featured.start : featured.end }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "tb-idx",
																children: howLabel(featured)
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "tb-bar-wrap",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "tb-bar",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveBar, { badge: featured })
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "tb-bar-lbl",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "FREIGESCHALTET" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [collectors(featured.collectors), " — SAMMLER"] })]
														})]
													})
												]
											})]
										}, featured.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "tb-hero-inner",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "tb-empty",
												children: "Lade BadgeBase…"
											})
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "tb-strip",
										children: nextFour.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "tb-mini",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: b.image,
												alt: "",
												width: 40,
												height: 40
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "name",
													children: b.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tick" })]
											})]
										}, b.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
									className: "tb-panel",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "tb-panel-h",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-mark a" }), " Demnächst"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "tb-list",
										children: upcoming.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "tb-empty",
											children: "KEINE EINTRÄGE"
										}) : upcoming.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "tb-item",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: b.image,
												alt: "",
												width: 32,
												height: 32
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "name",
													children: b.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "sub",
													children: [
														b.start ? `in ${Math.max(0, Math.ceil((new Date(b.start).getTime() - Date.now()) / 864e5))} Tg` : "TBA",
														" · ",
														b.free ? "KOSTENLOS" : "BEZAHLT"
													]
												})]
											})]
										}, b.id))
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
							className: "tb-foot",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "tb-navn",
								children: channel ? channel.slice(0, 1).toUpperCase() : "N"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "tb-ticker",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "tb-track",
									children: ticker.concat(ticker).map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [b.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sep",
										children: "◆"
									})] }, `${b.id}-${i}`))
								})
							})]
						})
					]
				})
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "tb-settings",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "channel",
						children: "Kanalname im Header"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "channel",
						value: channel,
						onChange: (e) => save(e.target.value),
						placeholder: "z. B. D0GECOIN",
						maxLength: 32
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Steht dauerhaft oben neben TwitchBadges. In OBS als Browser-Source 1920×1080 nutzen." })
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "tb-mobile",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "tb-m-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "tb-clock",
								style: { fontSize: 28 },
								children: now ? fmtClockFromParts(now) : "00:00:00"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "tb-logo",
								style: {
									fontSize: 22,
									marginTop: 6
								},
								children: ["Twitch", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Badges" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "tb-channel",
								children: channel || "LIVE BADGE-TRACKER"
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "tb-gear",
							type: "button",
							"aria-label": "Kanalname",
							onClick: () => setOpen((v) => !v),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { size: 16 })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "tb-pill ending",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-dot-h" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "n",
										children: endingSoon.length
									}),
									"\xA0ENDET BALD"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "tb-pill aktiv",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-dot-g" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "n",
										children: active.length
									}),
									"\xA0AKTIV"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "tb-pill soon",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-dot-a" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "n",
										children: upcoming.length
									}),
									"\xA0DEMNÄCHST"
								]
							})
						]
					}),
					featured ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "tb-m-hero",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: featured.image,
							alt: featured.name,
							width: 72,
							height: 72
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: chipClass(featured),
									children: costLabel(featured)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-2 text-2xl font-extrabold uppercase leading-tight",
									children: featured.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: featured.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "tb-timer mt-2 text-sm",
									children: [
										featured.status === "upcoming" ? "STARTET" : "ENDET",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveCountdown, { iso: featured.status === "upcoming" ? featured.start : featured.end })
									]
								})
							]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "tb-panel-h px-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-mark p" }), " Aktiv jetzt"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "tb-m-list",
						children: active.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "tb-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: b.image,
								alt: "",
								width: 32,
								height: 32
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "name",
									children: b.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "sub",
									children: [
										howLabel(b),
										" · endet ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveCountdown, { iso: b.end })
									]
								})]
							})]
						}, b.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "tb-panel-h px-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tb-mark a" }), " Demnächst"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "tb-m-list",
						children: upcoming.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "tb-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: b.image,
								alt: "",
								width: 32,
								height: 32
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "name",
									children: b.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "sub",
									children: [
										b.free ? "KOSTENLOS" : "BEZAHLT",
										" · ",
										howLabel(b)
									]
								})]
							})]
						}, b.id))
					})
				]
			})
		]
	});
}
function Home() {
	const { channel, interval } = Route.useSearch();
	const initial = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeOverlay, {
		channelParam: channel,
		intervalSec: Number.isFinite(interval) ? interval : 8,
		initialFeed: initial
	});
}
//#endregion
export { Home as component };
