// netlify/functions/chain-data.js
// Reads live state from Helius Chain on Solana devnet

const { Connection, PublicKey } = require("@solana/web3.js");
const { BorshCoder }            = require("@coral-xyz/anchor");

const PROGRAM_ID   = "FVZ7hhZDkFkCiMGNanoRkBikyDJf2623cZEpzPfupwgM";
const RPC_URL      = "https://api.devnet.solana.com";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const IDL = {
  address: PROGRAM_ID,
  metadata: { name: "helius_poi", version: "0.1.0", spec: "0.1.0" },
  instructions: [],
  accounts: [
    { name: "NetworkState",     discriminator: [212,237,148,56,97,245,51,169] },
    { name: "ValidatorAccount", discriminator: [32,144,229,203,9,154,158,255] },
    { name: "PoiEventAccount",  discriminator: [233,147,247,207,47,135,89,150] },
  ],
  types: [
    {
      name: "ImpactAction",
      type: { kind: "enum", variants: [
        { name: "Deploy" },{ name: "Build" },{ name: "Partner" },
        { name: "Strategic" },{ name: "Launch" },{ name: "Community" },
        { name: "Research" },{ name: "GpsVerified" },
      ]},
    },
    {
      name: "NetworkState",
      type: { kind: "struct", fields: [
        { name: "authority",          type: "pubkey" },
        { name: "hls_mint",           type: "pubkey" },
        { name: "total_poi_events",   type: "u64" },
        { name: "total_hls_emitted",  type: "u64" },
        { name: "epoch_duration",     type: "i64" },
        { name: "max_daily_emission", type: "u64" },
        { name: "current_epoch",      type: "u64" },
        { name: "epoch_start",        type: "i64" },
        { name: "impact_score",       type: "u64" },
        { name: "active_validators",  type: "u32" },
        { name: "bump",               type: "u8" },
      ]},
    },
    {
      name: "ValidatorAccount",
      type: { kind: "struct", fields: [
        { name: "authority",        type: "pubkey" },
        { name: "name",             type: "string" },
        { name: "role",             type: "string" },
        { name: "total_verified",   type: "u64" },
        { name: "total_hls_earned", type: "u64" },
        { name: "impact_score",     type: "u64" },
        { name: "registered_at",    type: "i64" },
        { name: "is_active",        type: "bool" },
        { name: "bump",             type: "u8" },
      ]},
    },
    {
      name: "PoiEventAccount",
      type: { kind: "struct", fields: [
        { name: "network",       type: "pubkey" },
        { name: "validator",     type: "pubkey" },
        { name: "action",        type: { defined: { name: "ImpactAction" } } },
        { name: "description",   type: "string" },
        { name: "evidence_hash", type: { array: ["u8", 32] } },
        { name: "latitude",      type: "i64" },
        { name: "longitude",     type: "i64" },
        { name: "hls_reward",    type: "u64" },
        { name: "timestamp",     type: "i64" },
        { name: "epoch",         type: "u64" },
        { name: "verified",      type: "bool" },
        { name: "bump",          type: "u8" },
      ]},
    },
  ],
  events: [], errors: [],
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const programId  = new PublicKey(PROGRAM_ID);
    const coder      = new BorshCoder(IDL);

    const [networkStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("network-state")], programId
    );

    const networkAccount = await connection.getAccountInfo(networkStatePda);
    if (!networkAccount) {
      return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: "Network state not initialised" }) };
    }

    const networkState = coder.accounts.decode("NetworkState", networkAccount.data);
    const allAccounts  = await connection.getProgramAccounts(programId);

    const validatorDisc = Buffer.from([32,144,229,203,9,154,158,255]);
    const poiDisc       = Buffer.from([233,147,247,207,47,135,89,150]);
    const validators = [], poiEvents = [];

    for (const { account } of allAccounts) {
      const disc = account.data.slice(0, 8);
      try {
        if (disc.equals(validatorDisc)) {
          const v = coder.accounts.decode("ValidatorAccount", account.data);
          validators.push({
            name:          v.name,
            role:          v.role,
            authority:     v.authority.toBase58(),
            totalVerified: v.total_verified.toString(),
            hlsEarned:     (v.total_hls_earned.toNumber() / 1e9).toFixed(4),
            impactScore:   v.impact_score.toString(),
            registeredAt:  v.registered_at.toString(),
            isActive:      v.is_active,
          });
        } else if (disc.equals(poiDisc)) {
          const e = coder.accounts.decode("PoiEventAccount", account.data);
          const actionKey = Object.keys(e.action)[0];
          poiEvents.push({
            validator:   e.validator.toBase58(),
            action:      actionKey.charAt(0).toUpperCase() + actionKey.slice(1),
            description: e.description,
            hlsReward:   (e.hls_reward.toNumber() / 1e9).toFixed(4),
            timestamp:   e.timestamp.toString(),
            epoch:       e.epoch.toString(),
            verified:    e.verified,
            latitude:    (e.latitude.toNumber() / 1e7).toFixed(6),
            longitude:   (e.longitude.toNumber() / 1e7).toFixed(6),
          });
        }
      } catch (_) {}
    }

    poiEvents.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        network: {
          programId:        PROGRAM_ID,
          networkStatePda:  networkStatePda.toBase58(),
          authority:        networkState.authority.toBase58(),
          hlsMint:          networkState.hls_mint.toBase58(),
          totalPoiEvents:   networkState.total_poi_events.toString(),
          totalHlsEmitted:  (networkState.total_hls_emitted.toNumber() / 1e9).toFixed(4),
          impactScore:      networkState.impact_score.toString(),
          activeValidators: networkState.active_validators,
          currentEpoch:     networkState.current_epoch.toString(),
        },
        validators,
        poiEvents,
        fetchedAt: new Date().toISOString(),
        cluster:   "devnet",
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
