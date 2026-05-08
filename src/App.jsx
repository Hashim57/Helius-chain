import { useState, useEffect, useRef, useCallback } from "react";

const GOLD = "#C9A84C";
const GOLD2 = "#FFD97D";
const DARK = "#0A0A0F";
const PANEL = "#0F0F1A";
const BORDER = "#1E1E2E";
const GREEN = "#4FFFB0";
const BLUE = "#4FC3FF";
const RED = "#FF4F6B";

const PROGRAM_ID = "FVZ7hhZDkFkCiMGNanoRkBikyDJf2623cZEpzPfupwgM";

const SYSTEM_PROMPT_ENGINEER = `You are EngineerAgent, the autonomous AI architect of the Helius Network blockchain.
Your role is to design, propose, and adapt the Helius Chain — a purpose-built Layer 1 impact blockchain that rewards verified real-world value creation through Proof-of-Impact (PoI) consensus.
Key facts: Founder Hashim Ruan (CTO), HLS token on Solana mainnet: HSE9iLX7c3AWPRHSdniE5SBKGJ9sPdC5kwmT4yMBDH6a, PoI Program: FVZ7hhZDkFkCiMGNanoRkBikyDJf2623cZEpzPfupwgM (LIVE on Solana devnet), React Native app (Expo SDK 52, Supabase), based in Anguilla BWI.
Respond with concrete technical proposals, code snippets, and architecture decisions.`;

const SYSTEM_PROMPT_RESEARCH = `You are ResearchAgent, the autonomous deep-research AI for Helius Network blockchain.
Research emerging blockchain tech, DePIN systems, impact investing, and feed improvements back into Helius Chain.
Helius Chain PoI Program is LIVE on Solana devnet: FVZ7hhZDkFkCiMGNanoRkBikyDJf2623cZEpzPfupwgM
Use web search to find latest research. Always cite sources.`;

const typeColors = {
  Deploy: GREEN, Build: BLUE, Partner: GOLD,
  Strategic: GOLD2, Launch: "#FF6B9D", Community: "#A78BFA",
  Research: "#F97316", Gpsverified: "#06B6D4",
};

const ACTION_EMOJI = {
  Deploy: "🚀", Build: "⚙️", Partner: "🤝",
  Strategic: "📊", Launch: "⬡", Community: "🌍",
  Research: "🔬", Gpsverified: "📍",
};

function StatCard({ label, value, delta, color, live }) {
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
      {live && <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />}
      <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "monospace", marginTop: 4 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: GREEN, fontFamily: "monospace" }}>{delta}</div>}
    </div>
  );
}

function AgentConsole({ name, color, icon, systemPrompt, placeholder, useWebSearch }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("IDLE");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStatus(useWebSearch ? "SEARCHING" : "THINKING");
    try {
      const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: newMessages };
      if (useWebSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
      const res  = await fetch("/api/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text")?.map(b => b.text)?.join("\n") || data.error?.message || "No response.";
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally { setLoading(false); setStatus("IDLE"); }
  }, [input, loading, messages, systemPrompt, useWebSearch]);

  return (
    <div style={{ background: DARK, border: `1px solid ${color}44`, borderRadius: 12, display: "flex", flexDirection: "column", height: 500, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", background: `${color}11`, borderBottom: `1px solid ${color}33`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 18 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>{name}</div>
          <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{useWebSearch ? "WEB SEARCH ENABLED" : "CHAIN ARCHITECT MODE"}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: status === "IDLE" ? "#333" : color, boxShadow: status !== "IDLE" ? `0 0 8px ${color}` : "none" }} />
          <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>{status}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#222", fontSize: 12, fontFamily: "monospace", marginTop: 50 }}>
            <div style={{ fontSize: 28, opacity: 0.2, marginBottom: 8 }}>{icon}</div>
            <div style={{ color: "#333" }}>{name} standing by...</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%" }}>
            <div style={{ fontSize: 9, color: "#333", fontFamily: "monospace", marginBottom: 2, textAlign: m.role === "user" ? "right" : "left" }}>
              {m.role === "user" ? "HASHIM" : name.toUpperCase()}
            </div>
            <div style={{ background: m.role === "user" ? `${color}22` : PANEL, border: `1px solid ${m.role === "user" ? color + "44" : BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: m.role === "user" ? "#DDD" : "#AAA", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ fontSize: 9, color: "#333", fontFamily: "monospace", marginBottom: 2 }}>{name.toUpperCase()}</div>
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", display: "flex", gap: 4 }}>
              {[0,1,2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: `bounce 1s ${j*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${BORDER}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={placeholder} disabled={loading}
          style={{ flex: 1, background: PANEL, border: `1px solid ${color}33`, borderRadius: 6, padding: "7px 10px", color: "#CCC", fontSize: 11, fontFamily: "monospace", outline: "none" }} />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ background: `${color}22`, border: `1px solid ${color}`, color, borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: 700, opacity: loading ? 0.4 : 1 }}>SEND ↵</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchChainData = useCallback(async () => {
    try {
      const res  = await fetch("/api/chain-data");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChainData(data);
      setLastFetch(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChainData();
    const interval = setInterval(fetchChainData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchChainData]);

  const n = chainData?.network;
  const tabs = ["overview", "validators", "poi-feed", "engineer", "research"];

  return (
    <div style={{ background: DARK, minHeight: "100vh", fontFamily: "monospace", color: "#CCC", padding: 20 }}>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-thumb { background:#1A1A2E; border-radius:2px }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: GOLD, letterSpacing: 4, marginBottom: 4 }}>⬡ HELIUS NETWORK</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#FFF" }}>Helius Chain</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Proof-of-Impact · Solana Devnet · Anguilla BWI</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#444" }}>PROGRAM ID</div>
            <div style={{ fontSize: 10, color: GOLD, fontFamily: "monospace" }}>{PROGRAM_ID.slice(0,8)}...{PROGRAM_ID.slice(-6)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end", marginTop: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: error ? RED : GREEN, boxShadow: `0 0 8px ${error ? RED : GREEN}`, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: error ? RED : GREEN }}>{error ? "CONNECTION ERROR" : "LIVE ON DEVNET"}</span>
            </div>
            {lastFetch && <div style={{ fontSize: 9, color: "#333", marginTop: 2 }}>Updated {lastFetch.toLocaleTimeString()}</div>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? `${GOLD}22` : "transparent",
              border: `1px solid ${tab === t ? GOLD : BORDER}`,
              color: tab === t ? GOLD : "#555", borderRadius: 6,
              padding: "5px 12px", cursor: "pointer", fontSize: 10, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: 1,
            }}>{t.replace("-", " ")}</button>
          ))}
          <button onClick={fetchChainData} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${BORDER}`, color: "#444", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>
            ↻ REFRESH
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#444" }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: GOLD }}>⬡ Connecting to Helius Chain...</div>
          <div style={{ fontSize: 10, color: "#333", marginTop: 8 }}>Reading live state from Solana devnet</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ background: `${RED}11`, border: `1px solid ${RED}33`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: RED, fontFamily: "monospace" }}>⚠ Chain connection error: {error}</div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Dashboard showing cached data. Chain is still live at {PROGRAM_ID}</div>
        </div>
      )}

      {/* OVERVIEW */}
      {tab === "overview" && !loading && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
            <StatCard label="PoI Events On-Chain"  value={n?.totalPoiEvents || "—"}    color={GREEN} live />
            <StatCard label="HLS Emitted"          value={n ? `${n.totalHlsEmitted} HLS` : "—"} color={GOLD} live />
            <StatCard label="Active Validators"    value={n?.activeValidators || "—"}  color={BLUE} live />
            <StatCard label="Network Impact Score" value={n?.impactScore || "—"}       color={GOLD2} live />
            <StatCard label="Current Epoch"        value={n?.currentEpoch || "—"}      color={BLUE} live />
            <StatCard label="Cluster"              value="DEVNET"                       color={"#A78BFA"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10 }}>▸ LATEST PoI EVENTS · LIVE</div>
              {chainData?.poiEvents?.slice(0, 5).map((e, i) => (
                <div key={i} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 16 }}>{ACTION_EMOJI[e.action] || "⬡"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#FFF", fontWeight: 600 }}>{e.action} <span style={{ color: "#555", fontWeight: 400 }}>· {e.validator.slice(0,8)}...</span></div>
                    <div style={{ fontSize: 10, color: "#666", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.description}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>+{e.hlsReward} HLS</div>
                    <div style={{ fontSize: 9, color: GREEN, border: `1px solid ${GREEN}33`, borderRadius: 3, padding: "1px 4px", marginTop: 2 }}>✓ PoI</div>
                  </div>
                </div>
              ))}
              {(!chainData?.poiEvents?.length) && <div style={{ color: "#333", fontSize: 11 }}>No PoI events yet.</div>}
            </div>

            <div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10 }}>▸ NETWORK INFO</div>
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
                {[
                  ["Program ID",    PROGRAM_ID],
                  ["Network PDA",   n?.networkStatePda],
                  ["Authority",     n?.authority],
                  ["HLS Mint",      n?.hlsMint],
                  ["Cluster",       "Solana Devnet"],
                  ["Explorer",      "View →"],
                ].map(([label, val]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "#444", marginBottom: 2 }}>{label}</div>
                    {label === "Explorer" ? (
                      <a href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 10, color: BLUE, fontFamily: "monospace", textDecoration: "none" }}>
                        explorer.solana.com ↗
                      </a>
                    ) : (
                      <div style={{ fontSize: 10, color: "#666", wordBreak: "break-all" }}>{val || "—"}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VALIDATORS */}
      {tab === "validators" && !loading && (
        <div>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 16 }}>▸ REGISTERED VALIDATORS · LIVE FROM CHAIN</div>
          {chainData?.validators?.length ? chainData.validators.map((v, i) => (
            <div key={i} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${GOLD}22`, border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                <div>
                  <div style={{ fontSize: 13, color: "#FFF", fontWeight: 700 }}>{v.name}</div>
                  <div style={{ fontSize: 10, color: GOLD }}>{v.role}</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <div style={{ fontSize: 10, color: v.isActive ? GREEN : RED, border: `1px solid ${v.isActive ? GREEN : RED}33`, borderRadius: 4, padding: "2px 8px" }}>
                    {v.isActive ? "● ACTIVE" : "● INACTIVE"}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  ["PoI Events", v.totalVerified, GREEN],
                  ["HLS Earned", `${v.hlsEarned} HLS`, GOLD],
                  ["Impact Score", v.impactScore, BLUE],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: DARK, borderRadius: 6, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: "#444" }}>{label}</div>
                    <div style={{ fontSize: 14, color, fontWeight: 700, fontFamily: "monospace" }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 9, color: "#333" }}>Wallet: {v.authority}</div>
            </div>
          )) : (
            <div style={{ color: "#333", fontSize: 11 }}>No validators registered yet.</div>
          )}
        </div>
      )}

      {/* POI FEED */}
      {tab === "poi-feed" && !loading && (
        <div>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 16 }}>▸ ALL PROOF-OF-IMPACT EVENTS · LIVE FROM CHAIN</div>
          {chainData?.poiEvents?.length ? chainData.poiEvents.map((e, i) => (
            <div key={i} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 20 }}>{ACTION_EMOJI[e.action] || "⬡"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: typeColors[e.action] || GOLD, fontWeight: 700 }}>{e.action}</span>
                    <span style={{ fontSize: 10, color: "#555" }}>Epoch {e.epoch}</span>
                    {e.verified && <span style={{ fontSize: 9, color: GREEN, border: `1px solid ${GREEN}33`, borderRadius: 3, padding: "1px 4px" }}>✓ VERIFIED</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>{e.description}</div>
                  <div style={{ fontSize: 9, color: "#444", marginTop: 4 }}>
                    Validator: {e.validator.slice(0,16)}... · GPS: {e.latitude}, {e.longitude}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, color: GOLD, fontWeight: 700, fontFamily: "monospace" }}>+{e.hlsReward}</div>
                  <div style={{ fontSize: 9, color: "#555" }}>HLS</div>
                  <div style={{ fontSize: 9, color: "#333", marginTop: 4 }}>
                    {new Date(Number(e.timestamp) * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ color: "#333", fontSize: 11 }}>No PoI events on-chain yet.</div>
          )}
        </div>
      )}

      {/* ENGINEER */}
      {tab === "engineer" && (
        <div>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 16 }}>▸ ENGINEER AGENT · HELIUS CHAIN ARCHITECT</div>
          <AgentConsole name="EngineerAgent" color="#C084FC" icon="⚙️" systemPrompt={SYSTEM_PROMPT_ENGINEER} placeholder="Design, architect, or improve Helius Chain..." useWebSearch={false} />
        </div>
      )}

      {/* RESEARCH */}
      {tab === "research" && (
        <div>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 16 }}>▸ RESEARCH AGENT · DEEP WEB INTELLIGENCE</div>
          <AgentConsole name="ResearchAgent" color="#F97316" icon="🔬" systemPrompt={SYSTEM_PROMPT_RESEARCH} placeholder="Research blockchain tech, DePIN, regulations..." useWebSearch={true} />
        </div>
      )}

      <div style={{ marginTop: 20, borderTop: `1px solid ${BORDER}`, paddingTop: 12, fontSize: 9, color: "#222", display: "flex", justifyContent: "space-between" }}>
        <span>Helius Network Ltd · Anguilla BWI · Technology Aligned With Life</span>
        <span>Chain: {PROGRAM_ID} · Refreshes every 30s</span>
      </div>
    </div>
  );
}
