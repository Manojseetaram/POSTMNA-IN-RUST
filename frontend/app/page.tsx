"use client";

import React, { useState } from "react";

export default function Home() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [queryParams, setQueryParams] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
  const addQuery = () => setQueryParams([...queryParams, { key: "", value: "" }]);

  const sendToBackend = async () => {
    if (!url.trim()) return alert("Enter URL");

    setLoading(true);
    setResponse(null);

    try {
      // prepare headers & queries
      const queryString = queryParams
        .filter((q) => q.key.trim())
        .map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
        .join("&");

      const finalUrl = queryString ? `${url}?${queryString}` : url;

      const payload = {
        method,
        url: finalUrl,
        headers: Object.fromEntries(
          headers.filter((h) => h.key.trim()).map((h) => [h.key, h.value])
        ),
        query: Object.fromEntries(
          queryParams.filter((q) => q.key.trim()).map((q) => [q.key, q.value])
        ),
        body: body.trim() ? body : null,
      };

      const res = await fetch("http://localhost:5050/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: String(err) });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 900, margin: "auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: "bold" }}>🚀 Rust + Next.js Postman Clone</h1>

      {/* METHOD + URL */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{ padding: 12, width: 120 }}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
          <option>PATCH</option>
        </select>

        <input
          type="text"
          placeholder="Enter URL (https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 1, padding: 12 }}
        />

        <button
          onClick={sendToBackend}
          style={{ padding: "12px 20px", background: "black", color: "white" }}
        >
          Send ▶
        </button>
      </div>

      {/* QUERY PARAMS */}
      <h3 style={{ marginTop: 30 }}>Query Params</h3>
      {queryParams.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
          <input
            placeholder="key"
            value={p.key}
            onChange={(e) => {
              const arr = [...queryParams];
              arr[i].key = e.target.value;
              setQueryParams(arr);
            }}
            style={{ padding: 8 }}
          />
          <input
            placeholder="value"
            value={p.value}
            onChange={(e) => {
              const arr = [...queryParams];
              arr[i].value = e.target.value;
              setQueryParams(arr);
            }}
            style={{ padding: 8 }}
          />
        </div>
      ))}
      <button onClick={addQuery}>+ Add Query Param</button>

      {/* HEADERS */}
      <h3 style={{ marginTop: 30 }}>Headers</h3>
      {headers.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
          <input
            placeholder="Header Key"
            value={h.key}
            onChange={(e) => {
              const arr = [...headers];
              arr[i].key = e.target.value;
              setHeaders(arr);
            }}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Header Value"
            value={h.value}
            onChange={(e) => {
              const arr = [...headers];
              arr[i].value = e.target.value;
              setHeaders(arr);
            }}
            style={{ padding: 8 }}
          />
        </div>
      ))}
      <button onClick={addHeader}>+ Add Header</button>

      {/* BODY */}
      {method !== "GET" && (
        <>
          <h3 style={{ marginTop: 30 }}>Body</h3>
          <textarea
            placeholder='{"name": "Manoj"}'
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              padding: 10,
              fontFamily: "monospace",
              borderRadius: 6,
            }}
          />
        </>
      )}

      {/* RESPONSE */}
      <h2 style={{ marginTop: 40 }}>Response</h2>
      {loading ? (
        <p>⏳ Loading...</p>
      ) : (
        <pre
          style={{
            background: "#f2f2f2",
            padding: 20,
            borderRadius: 6,
            overflowX: "auto",
            maxHeight: 400,
          }}
        >
          {response ? JSON.stringify(response, null, 2) : "No response yet"}
        </pre>
      )}
    </div>
  );
}
