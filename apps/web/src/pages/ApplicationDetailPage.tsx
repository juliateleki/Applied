import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeStatus, getApplication, listEvents } from "../shared/api/client";

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

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <p>
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
          <h1 style={{ marginBottom: 6 }}>
            {appQ.data.company_name} · {appQ.data.role_title}
          </h1>
          <p style={{ marginTop: 0, opacity: 0.8 }}>
            Current status: {appQ.data.status}
          </p>

          <section
            style={{
              marginTop: 18,
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Change status</h2>

            <div style={{ display: "grid", gap: 12 }}>
              <label>
                To status
                <input
                  value={toStatus}
                  onChange={(e) => setToStatus(e.target.value)}
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>

              <label>
                Note (optional)
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: 8,
                    minHeight: 80,
                  }}
                />
              </label>

              <button
                onClick={() =>
                  statusMut.mutate({
                    to_status: toStatus,
                    note: note.trim() ? note : null,
                  })
                }
                disabled={!toStatus.trim() || statusMut.isPending}
                style={{ padding: "10px 14px", cursor: "pointer" }}
              >
                {statusMut.isPending ? "Saving…" : "Save status change"}
              </button>

              {statusMut.error ? (
                <p style={{ color: "crimson" }}>
                  {String(statusMut.error.message ?? statusMut.error)}
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
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {e.event_type}
                    {e.from_status || e.to_status ? (
                      <span style={{ fontWeight: 400, opacity: 0.8 }}>
                        {" "}
                        {e.from_status ?? "∅"} → {e.to_status ?? "∅"}
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
