"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/lib/hooks/use-wallet";
import type {
  CoinPackage,
  Transactions,
  TransactionType,
  WalletBalance,
} from "@/lib/types";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD = "#1a1635";
const SURF = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Transaction icon + colour ────────────────────────────────────────────────
const TX_META: Record<TransactionType, { icon: string; color: string; label: string }> = {
  deposit:          { icon: "💳", color: "#4ade80", label: "Deposit"         },
  withdrawal:       { icon: "🏦", color: P,         label: "Withdrawal"      },
  subscription:     { icon: "⭐", color: "#38bdf8", label: "Subscription"    },
  tip:              { icon: "💝", color: "#f472b6", label: "Tip"             },
  ppv:              { icon: "🎬", color: "#a78bfa", label: "PPV Purchase"    },
  coin_purchase:    { icon: "💰", color: "#fbbf24", label: "Coin Purchase"   },
  coin_spend:       { icon: "🛍️", color: P,        label: "Coin Spend"      },
  coin_earn:        { icon: "⚡", color: "#fbbf24", label: "Coins Earned"    },
  refund:           { icon: "↩️", color: "#4ade80", label: "Refund"          },
  creator_earning:  { icon: "💵", color: "#4ade80", label: "Earning"         },
  platform_fee:     { icon: "🏛️", color: "#94a3b8", label: "Platform Fee"   },
  crypto_deposit:   { icon: "₿",  color: "#fb923c", label: "Crypto Deposit"  },
};

// ─── Crypto currencies ────────────────────────────────────────────────────────
const CRYPTOS = [
  { id: "BTC",  label: "Bitcoin",   icon: "₿",  color: "#fb923c" },
  { id: "ETH",  label: "Ethereum",  icon: "Ξ",  color: "#a78bfa" },
  { id: "USDT", label: "Tether",    icon: "₮",  color: "#4ade80" },
  { id: "USDC", label: "USD Coin",  icon: "◎",  color: "#38bdf8" },
  { id: "LTC",  label: "Litecoin",  icon: "Ł",  color: "#94a3b8" },
];

// ─── Shared input ─────────────────────────────────────────────────────────────
function Input({ label, value, onChange, type = "text", placeholder = "", prefix }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
        {label}
      </label>
      <div className="flex items-center rounded-xl border overflow-hidden"
        style={{ borderColor: BORDER, background: "rgba(255,255,255,0.03)" }}>
        {prefix && (
          <span className="px-3 text-[13px] font-bold border-r" style={{ color: "rgba(240,234,255,0.4)", borderColor: BORDER }}>
            {prefix}
          </span>
        )}
        <input
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-[13px] bg-transparent outline-none"
          style={{ color: "#f0eaff" }}
        />
      </div>
    </div>
  );
}

// ─── Grad button ──────────────────────────────────────────────────────────────
function GradBtn({ children, onClick, disabled, variant = "primary", size = "md", className }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md"; className?: string;
}) {
  const styles = {
    primary: { background: GRAD, color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" },
    ghost:   { background: "rgba(124,58,237,0.08)", color: "rgba(240,234,255,0.7)", border: `1px solid ${BORDER}` },
    danger:  { background: "rgba(239,57,118,0.1)", color: P, border: "1px solid rgba(239,57,118,0.3)" },
  };
  const sizes = { sm: "px-3 py-1.5 text-[11px]", md: "px-5 py-2.5 text-[12px]" };
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("rounded-xl font-black transition-all duration-150 flex items-center justify-center gap-2",
        sizes[size], disabled && "opacity-50 cursor-not-allowed", className)}
      style={styles[variant] as any}>
      {children}
    </button>
  );
}

// ─── Balance card ─────────────────────────────────────────────────────────────
function BalanceHero({ balance, onDeposit, onWithdraw }: {
  balance: WalletBalance;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  return (
    <div className="relative rounded-4xl overflow-hidden border p-6"
      style={{ background: `linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(239,57,118,0.1) 100%)`, borderColor: BORDER }}>
      {/* Bg glow */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />

      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] mb-2" style={{ color: "rgba(240,234,255,0.4)" }}>
          Available Balance
        </p>
        <p className="text-[40px] font-black text-[#f0eaff] leading-none tracking-tight mb-1">
          {fmt(balance.usdBalance)}
        </p>
        {balance.pendingBalance > 0 && (
          <p className="text-[12px] mb-4" style={{ color: "rgba(240,234,255,0.5)" }}>
            + {fmt(balance.pendingBalance)} pending
          </p>
        )}

        {/* Coin balance inline */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 border"
            style={{ background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.25)" }}>
            <span className="text-[14px]">💰</span>
            <span className="text-[13px] font-black text-[#f0eaff]">{balance.coinsBalance.toLocaleString()}</span>
            <span className="text-[10px] font-bold" style={{ color: "rgba(251,191,36,0.7)" }}>coins</span>
          </div>
        </div>

        <div className="flex gap-3">
          <GradBtn onClick={onDeposit} className="flex-1">
            ＋ Add Funds
          </GradBtn>
          <GradBtn variant="ghost" onClick={onWithdraw} className="flex-1">
            ↑ Withdraw
          </GradBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Stats row ────────────────────────────────────────────────────────────────
function StatsRow({ balance }: { balance: WalletBalance }) {
  const stats = [
    { label: "Total Deposited", value: fmt(balance.lifetimeDeposited), icon: "📥", color: "#4ade80" },
    { label: "Total Spent",     value: fmt(balance.lifetimeSpent),     icon: "🛍️", color: P        },
    { label: "Total Earned",    value: fmt(balance.lifetimeEarned),    icon: "💵", color: "#38bdf8" },
    { label: "Total Withdrawn", value: fmt(balance.lifetimeWithdrawn), icon: "🏦", color: "#a78bfa" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-[14px] border p-3.5"
          style={{ background: "rgba(124,58,237,0.05)", borderColor: BORDER }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[13px]">{s.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.35)" }}>
              {s.label}
            </span>
          </div>
          <p className="text-[16px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Coin package card ────────────────────────────────────────────────────────
function CoinPackageCard({ pkg, onBuy, isActing, usdBalance }: {
  pkg: CoinPackage; onBuy: (pkg: CoinPackage, method: "usd_balance" | "crypto") => void;
  isActing: boolean; usdBalance: number;
}) {
  const canAffordUsd = usdBalance >= pkg.priceCents;

  return (
    <div
      className="relative flex flex-col rounded-3xl border overflow-hidden transition-all duration-150 hover:scale-[1.01]"
      style={{
        background: pkg.isBestValue ? `linear-gradient(160deg, rgba(251,191,36,0.1), ${CARD})` : CARD,
        borderColor: pkg.isMostPopular ? V + "60" : pkg.isBestValue ? "rgba(251,191,36,0.4)" : BORDER,
        boxShadow: pkg.isMostPopular ? `0 0 20px rgba(124,58,237,0.2)` : "none",
      }}
    >
      {/* Top badge */}
      {(pkg.isMostPopular || pkg.isBestValue) && (
        <div className="absolute top-0 left-0 right-0 flex justify-center translate-y-0">
          <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-b-lg"
            style={{
              background: pkg.isMostPopular ? GRAD : "rgba(251,191,36,0.8)",
              color: "#fff",
            }}>
            {pkg.isMostPopular ? "⭐ Most Popular" : "💎 Best Value"}
          </span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 mt-3">
        {/* Coin amount */}
        <div className="flex items-center gap-2">
          <span className="text-[22px]">💰</span>
          <div>
            <p className="text-[18px] font-black text-[#f0eaff] leading-none">
              {pkg.coins.toLocaleString()}
            </p>
            {pkg.bonusCoins > 0 && (
              <p className="text-[10px] font-bold" style={{ color: "#fbbf24" }}>
                + {pkg.bonusCoins.toLocaleString()} bonus
              </p>
            )}
          </div>
        </div>

        {pkg.bonusCoins > 0 && (
          <div className="rounded-lg px-2 py-1 text-center text-[10px] font-black"
            style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>
            {pkg.totalCoins.toLocaleString()} total coins
          </div>
        )}

        {/* Price */}
        <p className="text-[20px] font-black text-[#f0eaff]">{fmt(pkg.priceCents)}</p>

        {/* Buy with USD balance */}
        <button
          onClick={() => onBuy(pkg, "usd_balance")}
          disabled={isActing || !canAffordUsd}
          className="w-full py-2 rounded-xl text-[11px] font-black text-white transition-all"
          style={{
            background: canAffordUsd ? GRAD : "rgba(124,58,237,0.12)",
            color: canAffordUsd ? "#fff" : "rgba(240,234,255,0.35)",
            opacity: isActing ? 0.6 : 1,
          }}
        >
          {canAffordUsd ? "Buy with Balance" : `Need ${fmt(pkg.priceCents - usdBalance)} more`}
        </button>

        {/* Buy with crypto */}
        {pkg.cryptoEnabled && (
          <button
            onClick={() => onBuy(pkg, "crypto")}
            disabled={isActing}
            className="w-full py-2 rounded-xl text-[11px] font-black border transition-all"
            style={{
              background: "rgba(251,152,36,0.08)",
              borderColor: "rgba(251,152,36,0.3)",
              color: "#fb923c",
            }}
          >
            ₿ Pay with Crypto
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx }: { tx: Transactions }) {
  const meta = TX_META[tx.type] ?? { icon: "💳", color: "#94a3b8", label: tx.type };
  const isCredit = ["deposit", "refund", "creator_earning", "coin_earn", "crypto_deposit"].includes(tx.type);
  const isCoins = tx.currency === "coins";

  const date = new Date(tx.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const statusColors: Record<string, string> = {
    completed: "#4ade80", pending: "#fbbf24", failed: P, refunded: "#94a3b8",
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
      <div className="size-9 rounded-xl flex items-center justify-center text-[16px] shrink-0"
        style={{ background: meta.color + "15" }}>
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-[#f0eaff] truncate">{tx.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(240,234,255,0.35)" }}>
            {date}
          </span>
          <span className="text-[9px] font-black uppercase rounded-full px-1.5 py-px"
            style={{ background: statusColors[tx.status] + "20", color: statusColors[tx.status] }}>
            {tx.status}
          </span>
        </div>
      </div>

      <p className="text-[13px] font-black shrink-0"
        style={{ color: isCredit ? "#4ade80" : P }}>
        {isCredit ? "+" : "-"}
        {isCoins
          ? `${tx.coinsAmount.toLocaleString()} 💰`
          : fmt(tx.amountCents)
        }
      </p>
    </div>
  );
}

// ─── Crypto payment modal ─────────────────────────────────────────────────────
function CryptoModal({ address, amount, currency, expiresAt, onClose }: {
  address: string; amount: string; currency: string;
  expiresAt?: string; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const crypto = CRYPTOS.find(c => c.id === currency) ?? CRYPTOS[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,26,0.9)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-[24px] border overflow-hidden"
        style={{ background: CARD, borderColor: crypto.color + "40", boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }}>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${crypto.color}, ${P})` }} />

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-black text-[#f0eaff]">Pay with {crypto.label}</h3>
            <button onClick={onClose} className="text-[18px] opacity-40 hover:opacity-80">✕</button>
          </div>

          {/* Amount */}
          <div className="rounded-[14px] border p-4 text-center"
            style={{ background: crypto.color + "10", borderColor: crypto.color + "30" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(240,234,255,0.4)" }}>Send Exactly</p>
            <p className="text-[28px] font-black" style={{ color: crypto.color }}>
              {amount} <span className="text-[16px]">{currency}</span>
            </p>
          </div>

          {/* Address */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(240,234,255,0.35)" }}>
              To This Address
            </p>
            <div className="flex items-center gap-2 rounded-xl border p-3"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: BORDER }}>
              <p className="flex-1 text-[11px] font-mono text-[#f0eaff] break-all leading-relaxed">{address}</p>
              <button onClick={() => copy(address)}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black border transition-all"
                style={{
                  background: copied ? "rgba(34,197,94,0.15)" : "rgba(124,58,237,0.1)",
                  borderColor: copied ? "rgba(34,197,94,0.3)" : BORDER,
                  color: copied ? "#4ade80" : V,
                }}>
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-xl border px-3 py-2.5 flex items-start gap-2"
            style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }}>
            <span className="text-[14px] shrink-0 mt-0.5">⚠️</span>
            <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.55)" }}>
              Send the exact amount shown. Your balance will be credited automatically after network confirmation.
              {expiresAt && ` Invoice expires at ${new Date(expiresAt).toLocaleTimeString()}.`}
            </p>
          </div>

          <GradBtn onClick={onClose} variant="ghost">I've sent the payment</GradBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Deposit modal ────────────────────────────────────────────────────────────
function DepositModal({ onDeposit, isActing, onClose }: {
  onDeposit: (amountCents: number, method: "card" | "crypto", crypto?: string) => void;
  isActing: boolean; onClose: () => void;
}) {
  const [amount, setAmount]   = useState("10.00");
  const [method, setMethod]   = useState<"card" | "crypto">("card");
  const [crypto, setCrypto]   = useState("USDT");

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const valid = amountCents >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,26,0.9)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-[24px] border overflow-hidden"
        style={{ background: CARD, borderColor: BORDER, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div className="h-1" style={{ background: GRAD }} />

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-black text-[#f0eaff]">Add Funds</h3>
            <button onClick={onClose} className="text-[18px] opacity-40 hover:opacity-80">✕</button>
          </div>

          <Input label="Amount (USD)" value={amount}
            onChange={setAmount} type="number" placeholder="10.00" prefix="$" />

          {/* Method selector */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.4)" }}>
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["card", "crypto"] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className="py-2.5 rounded-xl border text-[12px] font-black transition-all"
                  style={method === m
                    ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: "#f0eaff" }
                    : { background: "rgba(255,255,255,0.02)", borderColor: BORDER, color: "rgba(240,234,255,0.5)" }}>
                  {m === "card" ? "💳 Card" : "₿ Crypto"}
                </button>
              ))}
            </div>
          </div>

          {/* Crypto selector */}
          {method === "crypto" && (
            <div className="grid grid-cols-5 gap-1.5">
              {CRYPTOS.map((c) => (
                <button key={c.id} onClick={() => setCrypto(c.id)}
                  className="flex flex-col items-center gap-1 rounded-xl border py-2 px-1 transition-all"
                  style={crypto === c.id
                    ? { background: c.color + "15", borderColor: c.color + "50", boxShadow: `0 0 8px ${c.color}30` }
                    : { background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                  <span className="text-[14px] font-black" style={{ color: c.color }}>{c.icon}</span>
                  <span className="text-[8px] font-bold" style={{ color: "rgba(240,234,255,0.5)" }}>{c.id}</span>
                </button>
              ))}
            </div>
          )}

          {method === "card" && (
            <div className="rounded-xl border px-3 py-2.5 flex items-center gap-2"
              style={{ background: "rgba(124,58,237,0.06)", borderColor: BORDER }}>
              <span className="text-[14px]">🔒</span>
              <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.5)" }}>
                Secure payment via Maxelpay. You'll be redirected to complete payment.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <GradBtn variant="ghost" onClick={onClose} className="flex-1">Cancel</GradBtn>
            <GradBtn onClick={() => onDeposit(amountCents, method, method === "crypto" ? crypto : undefined)}
              disabled={!valid || isActing} className="flex-2">
              {isActing ? "Processing…" : method === "card" ? "Continue to Payment" : "Generate Invoice"}
            </GradBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw modal ───────────────────────────────────────────────────────────
function WithdrawModal({ balance, onWithdraw, isActing, onClose }: {
  balance: number; onWithdraw: (amountCents: number, method: "bank" | "crypto", details: any) => void;
  isActing: boolean; onClose: () => void;
}) {
  const [amount, setAmount]       = useState("20.00");
  const [method, setMethod]       = useState<"bank" | "crypto">("bank");
  const [accountName, setName]    = useState("");
  const [accountNumber, setAcct]  = useState("");
  const [routing, setRouting]     = useState("");
  const [cryptoAddr, setCryptoAddr] = useState("");
  const [cryptoCurr, setCryptoCurr] = useState("USDT");

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const valid = amountCents >= 2000 && amountCents <= balance;

  const submit = () => {
    const details = method === "bank"
      ? { bankDetails: { accountName, accountNumber, routingNumber: routing } }
      : { cryptoAddress: cryptoAddr, cryptoCurrency: cryptoCurr };
    onWithdraw(amountCents, method, details);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,26,0.9)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-[24px] border overflow-hidden"
        style={{ background: CARD, borderColor: BORDER, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div className="h-1" style={{ background: GRAD }} />

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-black text-[#f0eaff]">Withdraw Funds</h3>
            <button onClick={onClose} className="text-[18px] opacity-40 hover:opacity-80">✕</button>
          </div>

          <div className="rounded-xl border px-4 py-3"
            style={{ background: "rgba(124,58,237,0.06)", borderColor: BORDER }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(240,234,255,0.35)" }}>
              Available
            </p>
            <p className="text-[18px] font-black text-[#f0eaff]">{fmt(balance)}</p>
          </div>

          <Input label="Amount (min $20)" value={amount} onChange={setAmount} type="number" prefix="$" />

          {/* Method */}
          <div className="grid grid-cols-2 gap-2">
            {(["bank", "crypto"] as const).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className="py-2.5 rounded-xl border text-[12px] font-black transition-all"
                style={method === m
                  ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: "#f0eaff" }
                  : { background: "rgba(255,255,255,0.02)", borderColor: BORDER, color: "rgba(240,234,255,0.5)" }}>
                {m === "bank" ? "🏦 Bank Transfer" : "₿ Crypto"}
              </button>
            ))}
          </div>

          {method === "bank" && (
            <div className="flex flex-col gap-2">
              <Input label="Account Name" value={accountName} onChange={setName} />
              <Input label="Account Number" value={accountNumber} onChange={setAcct} />
              <Input label="Routing Number" value={routing} onChange={setRouting} />
            </div>
          )}

          {method === "crypto" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-5 gap-1.5">
                {CRYPTOS.map((c) => (
                  <button key={c.id} onClick={() => setCryptoCurr(c.id)}
                    className="flex flex-col items-center gap-1 rounded-xl border py-2 px-1 transition-all"
                    style={cryptoCurr === c.id
                      ? { background: c.color + "15", borderColor: c.color + "50" }
                      : { background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                    <span className="text-[14px] font-black" style={{ color: c.color }}>{c.icon}</span>
                    <span className="text-[8px] font-bold" style={{ color: "rgba(240,234,255,0.5)" }}>{c.id}</span>
                  </button>
                ))}
              </div>
              <Input label="Your Wallet Address" value={cryptoAddr} onChange={setCryptoAddr}
                placeholder={`Your ${cryptoCurr} address`} />
            </div>
          )}

          <p className="text-[9px] text-center" style={{ color: "rgba(240,234,255,0.3)" }}>
            {method === "bank" ? "3–5 business days" : "10–30 minutes"} · Minimum $20
          </p>

          <div className="flex gap-3">
            <GradBtn variant="ghost" onClick={onClose} className="flex-1">Cancel</GradBtn>
            <GradBtn onClick={submit} disabled={!valid || isActing} className="flex-2">
              {isActing ? "Processing…" : "Submit Withdrawal"}
            </GradBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Buy coins section ────────────────────────────────────────────────────────
function BuyCoinsSection({ packages, balance, onBuy, isActing }: {
  packages: CoinPackage[]; balance: number;
  onBuy: (pkg: CoinPackage, method: "usd_balance" | "crypto") => void;
  isActing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[15px]">💰</span>
        <h3 className="text-[14px] font-black text-[#f0eaff]">Buy Coins</h3>
        <div className="flex-1 h-px" style={{ background: BORDER }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {packages.map((pkg) => (
          <CoinPackageCard key={pkg.id} pkg={pkg} onBuy={onBuy} isActing={isActing} usdBalance={balance} />
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
type WalletTab = "overview" | "buy-coins" | "history";

export default function WalletDashboard() {
  const { balance, transactions, packages, isLoading, isActing, error,
          deposit, withdraw, buyCoins, loadMoreTransactions, hasMoreTransactions, clearError } = useWallet();

  const [activeTab, setActiveTab]     = useState<WalletTab>("overview");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [cryptoModal, setCryptoModal] = useState<{ address: string; amount: string; currency: string; expiresAt?: string } | null>(null);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  const handleDeposit = useCallback(async (amountCents: number, method: "card" | "crypto", crypto?: string) => {
    const result = await deposit({ amountCents, method, cryptoCurrency: crypto as any });
    if (!result) return;
    setShowDeposit(false);
    if (result.cryptoAddress) {
      setCryptoModal({
        address: result.cryptoAddress,
        amount: result.cryptoAmount ?? "",
        currency: result.cryptoCurrency ?? "",
        expiresAt: result.expiresAt,
      });
    } else if (result.checkoutUrl) {
      setSuccessMsg("Redirecting to payment…");
      setTimeout(() => { window.location.href = result.checkoutUrl!; }, 1000);
    }
  }, [deposit]);

  const handleWithdraw = useCallback(async (amountCents: number, method: "bank" | "crypto", details: any) => {
    const result = await withdraw({ amountCents, method, ...details });
    if (!result) return;
    setShowWithdraw(false);
    setSuccessMsg(result.message);
    setTimeout(() => setSuccessMsg(null), 5000);
  }, [withdraw]);

  const handleBuyCoins = useCallback(async (pkg: CoinPackage, method: "usd_balance" | "crypto") => {
    if (method === "crypto") {
      // Ask which crypto first — default USDT
      const result = await buyCoins({ packageId: pkg.id, method: "crypto", cryptoCurrency: "USDT" });
      if (result?.cryptoAddress) {
        setCryptoModal({ address: result.cryptoAddress, amount: result.cryptoAmount ?? "", currency: result.cryptoCurrency ?? "", expiresAt: result.expiresAt });
      }
    } else {
      const result = await buyCoins({ packageId: pkg.id, method: "usd_balance" });
      if (result?.success) {
        setSuccessMsg(`${result.coinsAdded.toLocaleString()} coins added to your account! 🎉`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    }
  }, [buyCoins]);

  const TABS: { id: WalletTab; label: string; icon: string }[] = [
    { id: "overview",   label: "Overview",    icon: "💳" },
    { id: "buy-coins",  label: "Buy Coins",   icon: "💰" },
    { id: "history",    label: "History",     icon: "📜" },
  ];

  if (isLoading) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-40 rounded-4xl" style={{ background: CARD }} />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-[14px]" style={{ background: CARD }} />)}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 pb-8"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: "#f0eaff" }}>

      {/* Success toast */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3"
          style={{ background: CARD, borderColor: "rgba(34,197,94,0.4)", boxShadow: "0 8px 40px rgba(34,197,94,0.15)", animation: "slideUp 0.4s ease forwards" }}>
          <span className="text-[18px]">✅</span>
          <p className="text-[12px] font-bold text-[#f0eaff]">{successMsg}</p>
          <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
          <span>⚠️</span>
          <p className="flex-1 text-[12px] font-bold" style={{ color: P }}>{error}</p>
          <button onClick={clearError} className="text-[14px] opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-black border-b-2 transition-all"
            style={activeTab === tab.id
              ? { color: "#f0eaff", borderColor: V }
              : { color: "rgba(240,234,255,0.4)", borderColor: "transparent" }}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && balance && (
        <div className="flex flex-col gap-5">
          <BalanceHero
            balance={balance}
            onDeposit={() => setShowDeposit(true)}
            onWithdraw={() => setShowWithdraw(true)}
          />
          <StatsRow balance={balance} />

          {/* Recent transactions preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-black text-[#f0eaff]">Recent Activity</h3>
              <button onClick={() => setActiveTab("history")}
                className="text-[11px] font-bold" style={{ color: V }}>
                View all →
              </button>
            </div>
            <div className="rounded-3xl border px-4"
              style={{ background: CARD, borderColor: BORDER }}>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <span className="text-4xl">📭</span>
                  <p className="text-[12px]" style={{ color: "rgba(240,234,255,0.4)" }}>No transactions yet</p>
                </div>
              ) : (
                transactions.slice(0, 5).map((tx) => <TxRow key={tx.id} tx={tx} />)
              )}
            </div>
          </div>

          {/* Quick buy coins */}
          {packages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-black text-[#f0eaff]">Quick Buy Coins</h3>
                <button onClick={() => setActiveTab("buy-coins")}
                  className="text-[11px] font-bold" style={{ color: V }}>
                  See all packages →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {packages.slice(0, 3).map((pkg) => (
                  <CoinPackageCard key={pkg.id} pkg={pkg}
                    onBuy={handleBuyCoins}
                    isActing={isActing}
                    usdBalance={balance.usdBalance}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Buy Coins ── */}
      {activeTab === "buy-coins" && balance && (
        <div className="flex flex-col gap-5">
          {/* Balance reminder */}
          <div className="flex items-center justify-between rounded-[14px] border px-4 py-3"
            style={{ background: "rgba(124,58,237,0.06)", borderColor: BORDER }}>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.35)" }}>
                Your Balance
              </p>
              <p className="text-[16px] font-black text-[#f0eaff]">{fmt(balance.usdBalance)}</p>
            </div>
            <GradBtn size="sm" onClick={() => setShowDeposit(true)}>+ Add Funds</GradBtn>
          </div>

          <BuyCoinsSection
            packages={packages}
            balance={balance.usdBalance}
            onBuy={handleBuyCoins}
            isActing={isActing}
          />

          {/* Earn coins note */}
          <div className="rounded-[14px] border p-4 flex items-start gap-3"
            style={{ background: "rgba(124,58,237,0.04)", borderColor: BORDER }}>
            <span className="text-[20px]">💡</span>
            <div>
              <p className="text-[12px] font-black text-[#f0eaff]">Earn free coins</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.45)" }}>
                Complete daily quests · Maintain your login streak · Refer friends · Participate in campaigns
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Transaction History ── */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border px-4"
            style={{ background: CARD, borderColor: BORDER }}>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16">
                <span className="text-5xl">📭</span>
                <p className="text-[13px] font-bold" style={{ color: "rgba(240,234,255,0.4)" }}>No transactions yet</p>
              </div>
            ) : (
              <>
                {transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
                {hasMoreTransactions && (
                  <div className="py-4 flex justify-center">
                    <GradBtn size="sm" variant="ghost" onClick={loadMoreTransactions} disabled={isActing}>
                      {isActing ? "Loading…" : "Load more"}
                    </GradBtn>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showDeposit && (
        <DepositModal
          onDeposit={handleDeposit}
          isActing={isActing}
          onClose={() => setShowDeposit(false)}
        />
      )}

      {showWithdraw && balance && (
        <WithdrawModal
          balance={balance.usdBalance}
          onWithdraw={handleWithdraw}
          isActing={isActing}
          onClose={() => setShowWithdraw(false)}
        />
      )}

      {cryptoModal && (
        <CryptoModal
          address={cryptoModal.address}
          amount={cryptoModal.amount}
          currency={cryptoModal.currency}
          expiresAt={cryptoModal.expiresAt}
          onClose={() => setCryptoModal(null)}
        />
      )}
    </div>
  );
}