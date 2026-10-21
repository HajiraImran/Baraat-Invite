import { Fragment, createContext, useContext, useEffect, useRef, useState } from "react";
import "./App.css";

/* ============ EDIT YOUR DETAILS HERE ============ */
const CONFIG = {
  // Invitation goes out from the BRIDE'S family (bride's name is intentionally not shown)
  groom: "Talha Imran Jhagra",
  brideInitial: "M", // only the initial is shown (on the opening screen)
  hosts: "Muhammad Miskeen Tanoli", // bride's father (the one inviting)
  groomParents: "Son of Mr. & Mrs. Muhammad Imran",
  brideFamily: "Daughter of Muhammad Miskeen Tanoli",

  dateTime: "2026-11-08T18:00:00+05:00", // start: 8 Nov 2026, 6:00 PM (Pakistan time)
  endDateTime: "2026-11-08T23:00:00+05:00", // end: 11:00 PM
  timings: "06:00 PM onwards",

  venue: "Tehzeeb Marquee",
  address: "Abbottabad, Pakistan",
  mapUrl: "", // paste the exact Google Maps link here, or leave empty to search by venue name
  note: "Your presence and duas would mean the world to us.",

  // RSVP: Bride's family
  rsvpName: "M. Miskeen Tanoli",
  phones: ["+92 321 9842192", "+92 314 5014146"],
  whatsappText: "Assalam o Alaikum, I received the Baraat invitation of Talha. ",

  // Your own photo: put the file in the `public` folder and write its name here.
  // Set to "" to use the drawn bride & groom illustration instead.
  photo: "couple.jpg",
  photoShape: "print", // "print" = normal photo, softly blended into the card | "cutout" = transparent PNG (person only)
  // icon: carriage | lunch | rukhsati
  schedule: [
    { icon: "carriage", label: "Arrival of Baraat", time: "06:00 PM" },
    { icon: "lunch", label: "Dinner", time: "09:00 PM" },
    { icon: "rukhsati", label: "Rukhsati", time: "10:00 PM" },
  ],
};
/* ================================================ */

const ReadyCtx = createContext(true);

const TZ = "Asia/Karachi";
const target = new Date(CONFIG.dateTime);
const fmtDate = (o) => target.toLocaleDateString("en-GB", { timeZone: TZ, ...o });
const ordinal = (n) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] || "th"}`;
};
const WEEKDAY = fmtDate({ weekday: "long" });
const DAY_NUM = Number(fmtDate({ day: "numeric" }));
const MONTH_NUM = fmtDate({ month: "2-digit" });
const MONTH = fmtDate({ month: "long" });
const YEAR = fmtDate({ year: "numeric" });
const FULL_DATE = `${WEEKDAY}, ${ordinal(DAY_NUM)} ${MONTH} ${YEAR}`;
const MAP_HREF =
  CONFIG.mapUrl ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${CONFIG.venue} ${CONFIG.address}`)}`;
const first = (n) => n.split(" ")[0];
const CONTACTS = CONFIG.phones.map((ph) => {
  const digits = ph.replace(/\D/g, "");
  return {
    display: ph,
    tel: `tel:+${digits}`,
    wa: `https://wa.me/${digits}?text=${encodeURIComponent(CONFIG.whatsappText)}`,
  };
});

/* "Add to calendar" file (.ics) */
const ICS_HREF = (() => {
  const f = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = new Date(CONFIG.endDateTime);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Baraat Invite//EN", "BEGIN:VEVENT",
    `DTSTART:${f(target)}`, `DTEND:${f(end)}`,
    `SUMMARY:Baraat - ${first(CONFIG.groom)}`,
    `LOCATION:${CONFIG.venue}, ${CONFIG.address}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
})();
const GROOM_FULL = CONFIG.groom;

function useCountdown() {
  const calc = () => {
    const diff = Math.max(0, target - new Date());
    return {
      Days: Math.floor(diff / 864e5),
      Hours: Math.floor(diff / 36e5) % 24,
      Minutes: Math.floor(diff / 6e4) % 60,
      Seconds: Math.floor(diff / 1e3) % 60,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* fades content in when it scrolls into view (starts once the intro opens) */
function Reveal({ children, delay = 0, className = "" }) {
  const ready = useContext(ReadyCtx);
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (shown || !ready) return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready, shown]);
  return (
    <div ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* letters (or words) that rise in one after another once their Reveal opens */
function SplitText({ text, by = "char", step = 30, base = 120 }) {
  let n = 0;
  const style = (i) => ({ "--i": i, "--s": `${step}ms`, "--d": `${base}ms` });
  const words = text.split(" ");
  return words.map((w, wi) => (
    <Fragment key={wi}>
      {by === "word" ? (
        <span className="ch" style={style(n++)} aria-hidden="true">
          {w}
        </span>
      ) : (
        <span className="word" aria-hidden="true">
          {[...w].map((c, ci) => (
            <span className="ch" key={ci} style={style(n++)}>
              {c}
            </span>
          ))}
        </span>
      )}
      {wi < words.length - 1 ? " " : null}
    </Fragment>
  ));
}

/* ---------- decorative maroon leaf branch ---------- */
const LEAF = "M0 0 C7 -9 8 -24 0 -38 C-8 -24 -7 -9 0 0Z";
const LEAF_FILLS = ["#6f1021", "#8d1b2e", "#7a1526", "#a42a3d"];

function Branch({ className, p, n = 8, size = 1 }) {
  const [p0, p1, p2] = p;
  const pt = (t) => ({
    x: (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    y: (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  });
  const tan = (t) => ({
    x: 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
    y: 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]),
  });
  const leaves = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const { x, y } = pt(t);
    const d = tan(t);
    const base = (Math.atan2(d.y, d.x) * 180) / Math.PI + 90;
    const sc = (1.1 - t * 0.55) * size;
    leaves.push({ x, y, a: base + 52, s: sc, f: LEAF_FILLS[(i * 2) % 4] });
    leaves.push({ x, y, a: base - 52, s: sc * 0.92, f: LEAF_FILLS[(i * 2 + 1) % 4] });
  }
  const end = pt(1);
  const ed = tan(1);
  leaves.push({ x: end.x, y: end.y, a: (Math.atan2(ed.y, ed.x) * 180) / Math.PI + 90, s: 0.6 * size, f: LEAF_FILLS[0] });
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      <path
        d={`M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`}
        fill="none"
        stroke="#5a0f1d"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {leaves.map((l, i) => (
        <path key={i} d={LEAF} fill={l.f} transform={`translate(${l.x} ${l.y}) rotate(${l.a}) scale(${l.s})`} />
      ))}
    </svg>
  );
}

/* ---------- bride & groom illustration ---------- */
function CoupleIllustration() {
  return (
    <svg viewBox="0 0 150 250" className="couple" aria-hidden="true">
      {/* bride: long dupatta + lehnga */}
      <path
        d="M52 34 C40 34 35 52 35 72 C20 122 6 190 -6 247 L122 247 C112 190 94 130 76 74 C76 50 68 34 52 34Z"
        fill="#9b1d30"
      />
      <path d="M45 98 C30 150 14 200 6 247 L112 247 C102 200 86 150 74 98Z" fill="#7d1325" />
      <path d="M10 232 L108 232" stroke="#d9b96d" strokeWidth="2.2" opacity=".9" />
      <path d="M14 218 L104 218" stroke="#d9b96d" strokeWidth="1" opacity=".6" />
      <path d="M44 100 Q60 112 74 100" stroke="#d9b96d" strokeWidth="1.6" fill="none" opacity=".8" />
      <ellipse cx="55" cy="50" rx="11" ry="13" fill="#23151a" />
      <path d="M44 46 C46 30 66 30 67 46 C60 40 51 40 44 46Z" fill="#b02338" />
      <path d="M38 80 C40 70 70 70 74 82 L72 104 L42 104Z" fill="#8d1a2d" />
      <path d="M36 78 C30 100 36 124 40 140" stroke="#c9314a" strokeWidth="3" fill="none" opacity=".55" />

      {/* groom: cream sherwani */}
      <path d="M99 170 L112 170 L111 238 L100 238Z" fill="#efe6d2" />
      <path d="M113 170 L127 170 L126 238 L114 238Z" fill="#e6dcc4" />
      <path d="M96 238 H112 V246 H94Z M114 238 H130 V246 H114Z" fill="#2a1c1c" />
      <path d="M95 64 Q112 58 130 64 L138 176 L90 176Z" fill="#f6eedc" />
      <path d="M112 62 L112 176" stroke="#d9b96d" strokeWidth="1.2" />
      {[84, 100, 116, 132, 148].map((y) => (
        <circle key={y} cx="108" cy={y} r="1.7" fill="#c9a45a" />
      ))}
      <path d="M95 64 Q103 74 112 62 Q122 74 130 64" stroke="#d9b96d" strokeWidth="1.4" fill="none" />
      <path d="M96 70 L88 138 L97 140 L102 84Z" fill="#efe6d2" />
      <path d="M130 70 L140 136 L131 140 L126 84Z" fill="#efe6d2" />
      <rect x="107" y="50" width="10" height="13" rx="4" fill="#e1ac86" />
      <circle cx="112" cy="42" r="12" fill="#e8b890" />
      <path d="M100 40 C100 26 124 26 124 40 C120 33 106 33 100 40Z" fill="#1e1416" />
    </svg>
  );
}

/* your own photo: tries couple.jpg / .jpeg / .png / .webp from the `public` folder,
   and falls back to the drawn illustration if none is found */
const PHOTO_LIST = (() => {
  if (!CONFIG.photo) return [];
  const name = CONFIG.photo.replace(/^\//, "");
  const stem = name.replace(/\.[^./]+$/, "");
  const exts = ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"];
  return [...new Set([name, ...exts.map((e) => `${stem}.${e}`)])].map((f) => import.meta.env.BASE_URL + f);
})();

function Couple() {
  const [i, setI] = useState(0);
  if (i >= PHOTO_LIST.length) {
    if (PHOTO_LIST.length) console.warn("Photo not found. Tried:", PHOTO_LIST);
    return <CoupleIllustration />;
  }
  return (
    <img
      key={PHOTO_LIST[i]}
      src={PHOTO_LIST[i]}
      alt={first(CONFIG.groom)}
      className={`couple-photo shape-${CONFIG.photoShape}`}
      onError={() => setI(i + 1)}
    />
  );
}

/* ---------- small line icons ---------- */
const ICONS = {
  carriage: (
    <g>
      <rect x="7" y="9" width="15" height="10" rx="2" />
      <path d="M22 13h5l2 4v2h-7" />
      <circle cx="11" cy="23" r="3.4" />
      <circle cx="24" cy="23" r="3.4" />
      <path d="M3 18h4" />
    </g>
  ),
  lunch: (
    <g>
      <path d="M4 22h24" />
      <path d="M6 22a10 10 0 0 1 20 0" />
      <path d="M16 8V6" />
      <circle cx="16" cy="5" r="1.2" />
      <path d="M8 26h16" />
    </g>
  ),
  rukhsati: (
    <g>
      <path d="M16 27C6 20 5 12 10 10.5c3-.8 5 1.2 6 3.5 1-2.3 3-4.3 6-3.5 5 1.5 4 9.5-6 16.5Z" />
    </g>
  ),
};
function Icon({ name }) {
  return (
    <svg viewBox="0 0 32 32" className="ico" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] || ICONS.carriage}
    </svg>
  );
}

/* soft falling glitter: tiny twinkling specks and a few small sparkles */
const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const GLITTER_COLORS = ["#d4566b", "#d9bd7e", "#a42a3d", "#e8a0ac", "#d9bd7e", "#c93f52"];
const GLITTER = Array.from({ length: 36 }, (_, i) => {
  const star = i % 4 === 1;
  return {
    star,
    x: rnd(i * 3 + 1) * 100,
    k: star ? 1.7 + rnd(i * 3 + 2) * 0.9 : 0.5 + rnd(i * 3 + 2) * 0.6,
    t: 13 + rnd(i * 3 + 3) * 12,
    d: rnd(i * 5 + 4) * 12,
    tw: 0.9 + rnd(i * 7 + 5) * 1.6,
    dx: 8 + rnd(i * 7 + 6) * 18,
    c: GLITTER_COLORS[i % GLITTER_COLORS.length],
  };
});
function Glitter() {
  return (
    <div className="glitter" aria-hidden="true">
      {GLITTER.map((g, i) => (
        <span
          key={i}
          className={`gl${g.star ? " star" : ""}`}
          style={{ "--x": `${g.x}%`, "--k": g.k, "--t": `${g.t}s`, "--d": `${g.d}s`, "--tw": `${g.tw}s`, "--dx": `${g.dx}px`, "--c": g.c }}
        >
          <i />
        </span>
      ))}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6L3 21z" />
      <path d="M9 8.5c0 3 3.5 6.5 6.5 6.5l1-1.4-2-1-1 .7c-.9-.4-1.8-1.3-2.2-2.2l.7-1-1-2-1 .4z" />
    </svg>
  );
}

/* full-screen intro: tap and the screen irises open */
function Intro({ state, onOpen }) {
  return (
    <div
      className={`intro ${state}`}
      role="button"
      tabIndex={0}
      aria-label="Open the Baraat invitation"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <Branch className="br br-tl" p={[[2, 2], [60, 10], [122, 72]]} n={8} />
      <Branch className="br br-tr" p={[[2, 2], [56, 14], [104, 84]]} n={7} size={0.9} />
      <Branch className="br br-bl" p={[[2, 2], [60, 10], [122, 72]]} n={8} />
      <Branch className="br br-br" p={[[2, 2], [56, 14], [104, 84]]} n={7} size={0.9} />
      <div className="intro-arch">
        <div className="intro-body">
          <p className="intro-top">Baraat Invitation</p>
          <p className="intro-sub">You are invited</p>
          <div className="intro-mono">
            <span>{CONFIG.groom[0]}</span>
            <i>&amp;</i>
            <span>{CONFIG.brideInitial}</span>
          </div>
          <div className="intro-date">
            <span />
            <b>
              {String(DAY_NUM).padStart(2, "0")} · {MONTH} · {YEAR}
            </b>
            <span />
          </div>
          <p className="intro-tap">
            Tap to open
            <i>⌄</i>
          </p>
        </div>
      </div>
    </div>
  );
}

function Invitation({ guest, onBack }) {
  const time = useCountdown();

  return (
    <div className="page">
      <Branch className="br br-tl" p={[[2, 2], [60, 10], [122, 72]]} n={8} />
      <Branch className="br br-tr" p={[[2, 2], [56, 14], [104, 84]]} n={7} size={0.9} />
    <main className="invite">
      {/* ---------- HERO (the card) ---------- */}
      <header className="hero">

        <div className="card-text">
          <Reveal>
            <div className="bismillah">
              <p className="ar" lang="ar" dir="rtl">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
              <p className="tr">In the name of Allah, the Most Gracious, the Most Merciful</p>
            </div>
          </Reveal>
          {guest && (
            <Reveal>
              <p className="guest">
                Dear <em>{guest}</em>,
              </p>
            </Reveal>
          )}
          <Reveal>
            <p className="small">{CONFIG.hosts}</p>
            <p className="small">is looking forward to welcoming you at the</p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="title" aria-label="Baraat Ceremony">
              <SplitText text="Baraat Ceremony" />
            </h1>
            <p className="small">of their beloved daughter with</p>
          </Reveal>
          <Reveal delay={200}>
            <div className="names">
              <span className="wp">{GROOM_FULL}</span>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <p className="date">{FULL_DATE}</p>
          </Reveal>

          <Reveal delay={380}>
            <div className="sched">
              {CONFIG.schedule.map((s, i) => (
                <div className="sched-item" key={s.label + i} style={{ "--i": i }}>
                  <Icon name={s.icon} />
                  <span className="sl">{s.label}</span>
                  <b>{s.time}</b>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="bottom">
            <Reveal delay={460} className="venue-wrap">
              <div className="venue">
                <span className="vline" />
                <span className="vlab">Venue</span>
                <p className="vname">{CONFIG.venue}</p>
                <p className="vaddr">{CONFIG.address}</p>
                <a className="vlink" href={MAP_HREF} target="_blank" rel="noreferrer">
                  Get directions ↗
                </a>
              </div>
            </Reveal>
            <Reveal delay={540} className="bottom-art">
              <Couple />
            </Reveal>
          </div>
        </div>
      </header>

      {/* ---------- DETAILS ---------- */}
      <section className="sec">
        <Reveal>
          <p className="kicker">Save the date</p>
          <div className="dateblock">
            <b className="dnum">{String(DAY_NUM).padStart(2, "0")}</b>
            <div className="dside">
              <span className="dmonth">{MONTH}</span>
              <i />
              <span className="dyear">{YEAR}</span>
            </div>
          </div>
          <p className="dsub">
            {WEEKDAY} · {CONFIG.timings}
          </p>
        </Reveal>

        <Reveal delay={100} className="wide">
          <div className="count" role="timer">
            {Object.entries(time).map(([k, v]) => (
              <div className="cell" key={k}>
                <b key={v} className="tick">
                  {String(v).padStart(2, "0")}
                </b>
                <small>{k}</small>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={150} className="wide">
          <div className="fam">
            <div className="fcard">
              <span className="vlab">Groom</span>
              <p>{CONFIG.groom}</p>
              <small>{CONFIG.groomParents}</small>
            </div>
            <div className="fcard">
              <span className="vlab">Bride&rsquo;s family</span>
              <p>{CONFIG.hosts}</p>
              <small>{CONFIG.brideFamily}</small>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="wide">
          <div className="contact">
            <p className="kicker">RSVP &amp; queries</p>
            <p className="csub">Bride&rsquo;s family &middot; {CONFIG.rsvpName}</p>
            <div className="clist">
              {CONTACTS.map((c) => (
                <div className="crow" key={c.display}>
                  <span className="cphone" aria-label={c.display}>{c.display}</span>
                  <span className="cbtns">
                    <a className="cbtn" href={c.tel} aria-label={`Call ${c.display}`}>
                      <PhoneIcon />
                    </a>
                    <a className="cbtn wa" href={c.wa} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${c.display}`}>
                      <WhatsAppIcon />
                    </a>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="wide">
          <div className="actions">
            <a className="go ghost" href={ICS_HREF} download="baraat-invite.ics">
              <span>Add to calendar</span>
              <i>+</i>
            </a>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <figure className="note">
            <span className="qmark">“</span>
            <p aria-label={CONFIG.note}>
              <SplitText text={CONFIG.note} by="word" step={70} base={150} />
            </p>
          </figure>
        </Reveal>
      </section>

      {/* ---------- END ---------- */}
      <footer className="end">
        <Branch className="br br-end-l" p={[[2, 2], [60, 10], [122, 72]]} n={8} />
        <Branch className="br br-end-r" p={[[2, 2], [60, 10], [122, 72]]} n={8} />
        <Reveal>
          <p className="end-names">
            <span className="wp">{CONFIG.hosts}</span>
          </p>
          <p className="small">&amp; family look forward to celebrating with you</p>
          <button className="back" onClick={onBack}>
            Back to start
          </button>
        </Reveal>
      </footer>
    </main>
    </div>
  );
}

export default function App() {
  const guest = new URLSearchParams(window.location.search).get("guest");
  const [stage, setStage] = useState("closed"); // closed | opening | open

  useEffect(() => {
    document.documentElement.classList.toggle("locked", stage !== "open");
    return () => document.documentElement.classList.remove("locked");
  }, [stage]);

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    setTimeout(() => setStage("open"), 1700);
  };
  const back = () => {
    window.scrollTo({ top: 0 });
    setStage("closed");
  };

  return (
    <ReadyCtx.Provider value={stage !== "closed"}>
      <Invitation guest={guest} onBack={back} />
      {stage !== "closed" && <Glitter />}
      {stage !== "open" && <Intro state={stage} onOpen={open} />}
    </ReadyCtx.Provider>
  );
}