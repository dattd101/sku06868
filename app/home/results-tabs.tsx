"use client";

import { useState } from "react";

type TabKey = "keno" | "mega645" | "power655" | "xsmb" | "xsmn";

interface KenoRow {
  id: number;
  draw_date: string;
  draw_time: string;
  draw_no: string;
  numbers: string;
  so_chan: number;
  so_le: number;
  so_lon: number;
  so_nho: number;
}

interface VietlottRow {
  id: number;
  thoi_gian: string;
  so_ky_quay: string;
  so_trung: string;
}

interface LotteryRow {
  id: number;
  ngay_quay: string;
  tinh: string;
  giai_db: string;
  giai_nhat: string;
  giai_nhi: string;
  giai_ba: string;
  giai_tu: string;
  giai_nam: string;
  giai_sau: string;
  giai_bay: string;
  giai_tam?: string;
  created_vn: string;
}

interface ResultsTabsProps {
  keno: KenoRow[];
  mega645: VietlottRow[];
  power655: VietlottRow[];
  xsmb: LotteryRow[];
  xsmn: LotteryRow[];
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "keno", label: "Keno" },
  { key: "mega645", label: "Vietlott 6/45" },
  { key: "power655", label: "Vietlott 6/55" },
  { key: "xsmb", label: "Xổ số miền Bắc" },
  { key: "xsmn", label: "Xổ số miền Nam" },
];

const prizeLabels: Array<[keyof LotteryRow, string]> = [
  ["giai_db", "Đặc biệt"], ["giai_nhat", "Giải nhất"], ["giai_nhi", "Giải nhì"],
  ["giai_ba", "Giải ba"], ["giai_tu", "Giải tư"], ["giai_nam", "Giải năm"],
  ["giai_sau", "Giải sáu"], ["giai_bay", "Giải bảy"], ["giai_tam", "Giải tám"],
];

function splitNumbers(value: string) {
  return value ? value.split(",").map((number) => number.trim()).filter(Boolean) : [];
}

function EmptyTab() {
  return <div className="empty tab-empty">Chưa có dữ liệu cho mục này.</div>;
}

function KenoResults({ rows }: { rows: KenoRow[] }) {
  if (!rows.length) return <EmptyTab />;
  return (
    <div className="keno-list">
      {rows.map((row) => (
        <article className="keno-row" key={row.id}>
          <div className="keno-meta">
            <strong>Kỳ #{row.draw_no}</strong>
            <small>{row.draw_date}{row.draw_time && ` · ${row.draw_time}`}</small>
          </div>
          <div className="keno-balls">
            {splitNumbers(row.numbers).map((number, index) => <span key={`${row.id}-${index}`}>{number}</span>)}
          </div>
          <div className="keno-stats">
            <span>Chẵn <b>{row.so_chan}</b></span><span>Lẻ <b>{row.so_le}</b></span>
            <span>Lớn <b>{row.so_lon}</b></span><span>Nhỏ <b>{row.so_nho}</b></span>
          </div>
        </article>
      ))}
    </div>
  );
}

function VietlottResults({ rows, power }: { rows: VietlottRow[]; power?: boolean }) {
  if (!rows.length) return <EmptyTab />;
  return (
    <div className="result-list tab-result-list">
      {rows.map((row) => (
        <article className="vietlott-row" key={row.id}>
          <div><strong>Kỳ #{row.so_ky_quay}</strong><small>{row.thoi_gian}</small></div>
          <div className="balls">
            {splitNumbers(row.so_trung).map((number, index) => (
              <span className={power && index === 6 ? "power" : ""} key={`${row.id}-${index}`}>{number}</span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function LotteryResults({ rows }: { rows: LotteryRow[] }) {
  if (!rows.length) return <EmptyTab />;
  return (
    <div className="lottery-grid">
      {rows.map((row) => (
        <article className="lottery-card" key={row.id}>
          <header>
            <div><h3>{row.tinh}</h3><span>{row.ngay_quay}</span></div>
            <small>Lưu lúc {row.created_vn}</small>
          </header>
          <div className="prizes">
            {prizeLabels.map(([field, label]) => {
              const value = row[field];
              if (typeof value !== "string" || !value) return null;
              return <div className={field === "giai_db" ? "prize jackpot" : "prize"} key={field}><span>{label}</span><strong>{value}</strong></div>;
            })}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ResultsTabs({ keno, mega645, power655, xsmb, xsmn }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("keno");
  return (
    <div className="results-tabs">
      <div className="tab-menu" role="tablist" aria-label="Loại kết quả xổ số">
        {tabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            className={activeTab === tab.key ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab(tab.key)}
            key={tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-panel" id={`panel-${activeTab}`} role="tabpanel">
        {activeTab === "keno" && <KenoResults rows={keno} />}
        {activeTab === "mega645" && <VietlottResults rows={mega645} />}
        {activeTab === "power655" && <VietlottResults rows={power655} power />}
        {activeTab === "xsmb" && <LotteryResults rows={xsmb} />}
        {activeTab === "xsmn" && <LotteryResults rows={xsmn} />}
      </div>
    </div>
  );
}
