import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeStatus, getApplication, listEvents } from "../shared/api/client";
import { STATUSES } from "../shared/constants/statuses";

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const applicationId = useMemo(() => Number(id), [id]);
  const qc = useQueryClient();

  const appQ = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => getApplication(applicationId),
    enabled: Number.isFinite(applicationId),
  });

  const eventsQ = useQuery({
    queryKey: ["events", applicationId],
    queryFn: () => listEvents(applicationId),
    enabled: Number.isFinite(applicationId),
  });

  const [toStatus, setToStatus] = useState("");
  const [note, setNote] = useState("");

  const statusMut = useMutation({
    mutationFn: (payload: { to_status: string; note?: string | null }) =>
      changeStatus(applicationId, payload),
    onSuccess: async () => {
      setToStatus("");
      setNote("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["application", applicationId] }),
        qc.invalidateQueries({ queryKey: ["applications"] }),
        qc.invalidateQueries({ queryKey: ["events", applicationId] }),
      ]);
    },
  });

  const effectiveToStatus = toStatus || appQ.data?.status || "applied";
  const canSave =
    !!appQ.data &&
    effectiveToStatus !== appQ.data.status &&
    !statusMut.isPending;

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
      <p style={{ marginTop: 0 }}>
        <Link to="/">← Back</Link>
      </p>

      {appQ.isLoading ? <p>Loading application…</p> : null}
      {appQ.error ? (
        <p style={{ color: "crimson" }}>
          {String((appQ.error as Error).message)}
        </p>
      ) : null}

      {appQ.data ? (
        <>
          <h1 style={{ marginBottom: 6, marginTop: 0 }}>
            {appQ.data.company_name} · {appQ.data.role_title}
          </h1>

          <p style={{ marginTop: 0, opacity: 0.85 }}>
            Current status: {formatStatusLabel(appQ.data.status)}
          </p>

          {appQ.data.job_url ? (
            <p style={{ marginTop: 10 }}>
              <a href={appQ.data.job_url} target="_blank" rel="noreferrer">
                View job posting
              </a>
            </p>
          ) : null}

          {appQ.data.job_description ? (
            <section
              style={{
                marginTop: 14,
                padding: 16,
                border: "1px solid #333",
                borderRadius: 10,
                background: "#1f1f1f",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Job description</h2>
              <div style={{ whiteSpace: "pre-wrap", opacity: 0.95 }}>
                {appQ.data.job_description}
              </div>
            </section>
          ) : null}

          <section
            style={{
              marginTop: 18,
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 10,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Change status</h2>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={fieldLabelStyle}>
                <span>To status</span>
                <select
                  value={effectiveToStatus}
                  onChange={(e) => setToStatus(e.target.value)}
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
                  style={{
                    ...inputStyle,
                    minHeight: 110,
                    resize: "vertical",
                  }}
                />
              </label>

              <button
                onClick={() =>
                  statusMut.mutate({
                    to_status: effectiveToStatus,
                    note: note.trim() ? note : null,
                  })
                }
                disabled={!canSave}
                style={{
                  padding: "12px 14px",
                  cursor: "pointer",
                  borderRadius: 10,
                }}
              >
                {statusMut.isPending ? "Saving…" : "Save status change"}
              </button>

              {statusMut.error ? (
                <p style={{ color: "crimson", margin: 0 }}>
                  {String((statusMut.error as any)?.message ?? statusMut.error)}
                </p>
              ) : null}
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Timeline</h2>

            {eventsQ.isLoading ? <p>Loading events…</p> : null}
            {eventsQ.error ? (
              <p style={{ color: "crimson" }}>
                {String((eventsQ.error as Error).message)}
              </p>
            ) : null}

            <div style={{ display: "grid", gap: 10 }}>
              {(eventsQ.data ?? []).map((e) => (
                <div
                  key={e.id}
                  style={{
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {formatStatusLabel(e.event_type)}
                    {e.from_status || e.to_status ? (
                      <span style={{ fontWeight: 400, opacity: 0.8 }}>
                        {" "}
                        {e.from_status
                          ? formatStatusLabel(e.from_status)
                          : "∅"}{" "}
                        → {e.to_status ? formatStatusLabel(e.to_status) : "∅"}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ opacity: 0.75, fontSize: 14 }}>
                    {new Date(e.occurred_at).toLocaleString()}
                  </div>
                  {e.note ? <div style={{ marginTop: 6 }}>{e.note}</div> : null}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
