import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApplication, listApplications } from "../shared/api/client";
import { STATUSES } from "../shared/constants/statuses";

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

  const createMut = useMutation({
    mutationFn: createApplication,
    onSuccess: async () => {
      setCompanyName("");
      setRoleTitle("");
      setStatus("applied");
      setNote("");
      await qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Applied</h1>

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create application</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <label>
            Company
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8 }}
            />
          </label>

          <label>
            Role
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8 }}
            />
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8 }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
              createMut.mutate({
                company_name: companyName,
                role_title: roleTitle,
                status,
                note: note.trim() ? note : null,
              })
            }
            disabled={
              !companyName.trim() || !roleTitle.trim() || createMut.isPending
            }
            style={{ padding: "10px 14px", cursor: "pointer" }}
          >
            {createMut.isPending ? "Creating..." : "Create"}
          </button>

          {createMut.error ? (
            <p style={{ color: "crimson" }}>
              {String((createMut.error as any)?.message ?? createMut.error)}
            </p>
          ) : null}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Applications</h2>

        {isLoading ? <p>Loading…</p> : null}
        {error ? (
          <p style={{ color: "crimson" }}>{String((error as Error).message)}</p>
        ) : null}

        <div style={{ display: "grid", gap: 10 }}>
          {(data ?? []).map((a) => (
            <Link
              key={a.id}
              to={`/applications/${a.id}`}
              style={{
                display: "block",
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 8,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {a.company_name} · {a.role_title}
              </div>
              <div style={{ opacity: 0.8 }}>Status: {a.status}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
