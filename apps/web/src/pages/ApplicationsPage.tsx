import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApplication, listApplications } from "../shared/api/client";
import { STATUSES } from "../shared/constants/statuses";

function daysAgo(iso: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diffMs = Date.now() - t;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function statusBadgeStyle(status: string) {
  const s = (status || "").toLowerCase();

  let bg = "rgba(156, 163, 175, 0.18)";
  let border = "rgba(156, 163, 175, 0.45)";
  let fg = "#e5e7eb";

  if (s === "offer") {
    bg = "rgba(34, 197, 94, 0.18)";
    border = "rgba(34, 197, 94, 0.55)";
    fg = "#86efac";
  } else if (s === "rejected") {
    bg = "rgba(239, 68, 68, 0.18)";
    border = "rgba(239, 68, 68, 0.55)";
    fg = "#fca5a5";
  } else if (s === "interviewing") {
    bg = "rgba(59, 130, 246, 0.18)";
    border = "rgba(59, 130, 246, 0.55)";
    fg = "#93c5fd";
  } else if (s === "withdrawn") {
    bg = "rgba(249, 115, 22, 0.18)";
    border = "rgba(249, 115, 22, 0.55)";
    fg = "#fdba74";
  } else if (s === "applied") {
    bg = "rgba(156, 163, 175, 0.14)";
    border = "rgba(156, 163, 175, 0.45)";
    fg = "#d1d5db";
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: 999,
    border: `1px solid ${border}`,
    background: bg,
    color: fg,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    lineHeight: "18px",
    whiteSpace: "nowrap",
  } as const;
}

const STALE_DAYS = 14;

type SortMode = "newest" | "oldest" | "company_az" | "company_za";
type StatusFilter = "all" | (typeof STATUSES)[number];

function isSortMode(v: string | null): v is SortMode {
  return (
    v === "newest" || v === "oldest" || v === "company_az" || v === "company_za"
  );
}

function isStatusFilter(v: string | null): v is StatusFilter {
  if (!v) return false;
  if (v === "all") return true;
  return (STATUSES as readonly string[]).includes(v);
}

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });

  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [status, setStatus] = useState("applied");
  const [note, setNote] = useState("");

  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const initialSort = useMemo<SortMode>(() => {
    const raw = searchParams.get("sort");
    return isSortMode(raw) ? raw : "newest";
  }, [searchParams]);

  const initialStatusFilter = useMemo<StatusFilter>(() => {
    const raw = searchParams.get("status");
    return isStatusFilter(raw) ? raw : "all";
  }, [searchParams]);

  const [sortMode, setSortMode] = useState<SortMode>(initialSort);
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>(initialStatusFilter);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (sortMode === "newest") next.delete("sort");
    else next.set("sort", sortMode);

    if (statusFilter === "all") next.delete("status");
    else next.set("status", statusFilter);

    const currSort = searchParams.get("sort");
    const currStatus = searchParams.get("status");

    const nextSort = next.get("sort");
    const nextStatus = next.get("status");

    if (currSort !== nextSort || currStatus !== nextStatus) {
      setSearchParams(next, { replace: true });
    }
  }, [sortMode, statusFilter, searchParams, setSearchParams]);

  const createMut = useMutation({
    mutationFn: createApplication,
    onSuccess: async () => {
      setCompanyName("");
      setRoleTitle("");
      setStatus("applied");
      setNote("");
      setJobUrl("");
      setJobDescription("");
      await qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const staleItems = useMemo(() => {
    const rows = data ?? [];
    const withDays = rows
      .map((a) => {
        const d = daysAgo(a.updated_at);
        return { a, d };
      })
      .filter((x) => x.d !== null && x.d >= STALE_DAYS) as Array<{
      a: (typeof rows)[number];
      d: number;
    }>;

    withDays.sort((x, y) => y.d - x.d);
    return withDays;
  }, [data]);

  const staleCount = staleItems.length;
  const topStale = staleItems.slice(0, 3);

  const visibleRows = useMemo(() => {
    const rows = [...(data ?? [])];

    const filtered =
      statusFilter === "all"
        ? rows
        : rows.filter((a) => a.status === statusFilter);

    const getTime = (iso: string) => {
      const t = new Date(iso).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    const cmpText = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });

    if (sortMode === "newest") {
      filtered.sort((a, b) => getTime(b.updated_at) - getTime(a.updated_at));
    } else if (sortMode === "oldest") {
      filtered.sort((a, b) => getTime(a.updated_at) - getTime(b.updated_at));
    } else if (sortMode === "company_az") {
      filtered.sort((a, b) => cmpText(a.company_name, b.company_name));
    } else if (sortMode === "company_za") {
      filtered.sort((a, b) => cmpText(b.company_name, a.company_name));
    }

    return filtered;
  }, [data, sortMode, statusFilter]);

  const cardStyle = {
    padding: 16,
    border: "1px solid #ddd",
    borderRadius: 8,
  } as const;

  const fieldLabelStyle = {
    display: "grid",
    gap: 6,
  } as const;

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #555",
    background: "#3a3a3a",
    color: "inherit",
    boxSizing: "border-box",
  } as const;

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Applied</h1>

      <section style={{ marginTop: 24, ...cardStyle }}>
        <h2 style={{ marginTop: 0 }}>Create application</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={fieldLabelStyle}>
            <span>Company</span>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Firefly Aerospace"
              style={inputStyle}
            />
          </label>

          <label style={fieldLabelStyle}>
            <span>Role</span>
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Software Developer"
              style={inputStyle}
            />
          </label>

          <label style={fieldLabelStyle}>
            <span>Job posting link (optional)</span>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </label>

          <label style={fieldLabelStyle}>
            <span>Job description (optional)</span>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: 150,
                resize: "vertical",
              }}
              placeholder="Paste the posting here so you can reference it later."
            />
          </label>

          <label style={fieldLabelStyle}>
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldLabelStyle}>
            <span>Note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Referral name, recruiter contact, follow-up date, interview notes..."
              style={{
                ...inputStyle,
                minHeight: 110,
                resize: "vertical",
              }}
            />
          </label>

          <button
            onClick={() =>
              createMut.mutate({
                company_name: companyName,
                role_title: roleTitle,
                status,
                applied_at: new Date().toISOString().slice(0, 10),
                note: note.trim() ? note : null,
                job_url: jobUrl.trim() ? jobUrl.trim() : null,
                job_description: jobDescription.trim() ? jobDescription : null,
              })
            }
            disabled={
              !companyName.trim() || !roleTitle.trim() || createMut.isPending
            }
            style={{
              padding: "12px 14px",
              cursor: "pointer",
              borderRadius: 10,
            }}
          >
            {createMut.isPending ? "Creating..." : "Create"}
          </button>

          {createMut.error ? (
            <p style={{ color: "crimson", margin: 0 }}>
              {String((createMut.error as any)?.message ?? createMut.error)}
            </p>
          ) : null}
        </div>
      </section>

      <section
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 12,
          background: "#1f1f1f",
          border: "1px solid #333",
        }}
      >
        <h2 style={{ marginTop: 0, textAlign: "center" }}>
          Stale applications
        </h2>

        {isLoading ? <p style={{ textAlign: "center" }}>Loading…</p> : null}
        {error ? (
          <p style={{ color: "crimson", textAlign: "center" }}>
            {String((error as Error).message)}
          </p>
        ) : null}

        {!isLoading && !error ? (
          staleCount === 0 ? (
            <p style={{ margin: 0, opacity: 0.85, textAlign: "center" }}>
              Nothing stale right now. You’re on top of it.
            </p>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div
                  style={{ fontSize: 32, fontWeight: 700, color: "crimson" }}
                >
                  {staleCount}
                </div>
                <div style={{ opacity: 0.9 }}>
                  {staleCount === 1 ? "application needs" : "applications need"}{" "}
                  follow-up{" "}
                  <span style={{ opacity: 0.7 }}>
                    ({STALE_DAYS}+ days inactive)
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {topStale.map(({ a, d }) => (
                  <Link
                    key={a.id}
                    to={`/applications/${a.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 10,
                      background: "#2a2a2a",
                      textDecoration: "none",
                      color: "inherit",
                      border: "1px solid #333",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {a.company_name} · {a.role_title}
                      </div>
                      <div style={{ opacity: 0.9, fontSize: 14 }}>
                        <span style={{ opacity: 0.8 }}>Status:</span>{" "}
                        <span style={statusBadgeStyle(a.status)}>
                          {formatStatusLabel(a.status)}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        color: "crimson",
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {d}d
                    </div>
                  </Link>
                ))}
              </div>

              {staleCount > topStale.length ? (
                <p
                  style={{
                    marginTop: 12,
                    marginBottom: 0,
                    opacity: 0.7,
                    textAlign: "center",
                    fontSize: 14,
                  }}
                >
                  Showing {topStale.length} of {staleCount}
                </p>
              ) : null}
            </>
          )
        ) : null}
      </section>

      <section style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>Applications</h2>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
              <span style={{ fontSize: 13, opacity: 0.85 }}>Filter status</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                style={inputStyle}
              >
                <option value="all">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
              <span style={{ fontSize: 13, opacity: 0.85 }}>Sort</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                style={inputStyle}
              >
                <option value="newest">Newest activity</option>
                <option value="oldest">Oldest activity</option>
                <option value="company_az">Company A → Z</option>
                <option value="company_za">Company Z → A</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading ? <p>Loading…</p> : null}
        {error ? (
          <p style={{ color: "crimson" }}>{String((error as Error).message)}</p>
        ) : null}

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {visibleRows.map((a) => {
            const d = daysAgo(a.updated_at);
            const stale = d !== null && d >= STALE_DAYS;

            return (
              <Link
                key={a.id}
                to={`/applications/${a.id}`}
                style={{
                  display: "block",
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {a.company_name} · {a.role_title}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ opacity: 0.85, fontSize: 14 }}>Status:</span>
                  <span style={statusBadgeStyle(a.status)}>
                    {formatStatusLabel(a.status)}
                  </span>
                </div>

                <div style={{ opacity: 0.75, fontSize: 14, marginTop: 6 }}>
                  Last activity:{" "}
                  {d === null
                    ? "unknown"
                    : d === 0
                      ? "today"
                      : `${d} day${d === 1 ? "" : "s"} ago`}
                  {stale ? (
                    <span
                      style={{
                        marginLeft: 10,
                        color: "crimson",
                        fontWeight: 700,
                      }}
                    >
                      Needs follow up
                    </span>
                  ) : null}
                </div>

                {a.job_url ? (
                  <div style={{ marginTop: 6, fontSize: 14, opacity: 0.85 }}>
                    Job link:{" "}
                    <span style={{ textDecoration: "underline" }}>
                      {a.job_url}
                    </span>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
