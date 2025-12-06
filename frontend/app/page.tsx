"use client";

import React, { useState } from "react";

export default function PostmanUI() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [queryParams, setQueryParams] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("params");

  const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
  const addQuery = () => setQueryParams([...queryParams, { key: "", value: "" }]);

  const sendToBackend = async () => {
    if (!url.trim()) return alert("Enter URL");
    setLoading(true);
    setResponse(null);

    try {
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
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#1e1e1e",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 250,
          borderRight: "1px solid #333",
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: "bold" }}>⚡ My Postman</h2>

        <div style={{ marginTop: 30, opacity: 0.7 }}>
          <p>📜 History (Coming soon)</p>
          <p>💾 Saved Requests (Coming soon)</p>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ flex: 1, padding: 20 }}>
        {/* Top Bar */}
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{
              padding: 12,
              background: "#333",
              color: "white",
              border: "1px solid #444",
              borderRadius: 6,
            }}
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
            style={{
              flex: 1,
              padding: 12,
              background: "#222",
              color: "white",
              borderRadius: 6,
              border: "1px solid #444",
            }}
          />

          <button
            onClick={sendToBackend}
            style={{
              padding: "12px 20px",
              background: "#06c46b",
              color: "black",
              fontWeight: "bold",
              borderRadius: 6,
            }}
          >
            Send ▶
          </button>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 20, display: "flex", gap: 20 }}>
          {["params", "headers", "body"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "10px 15px",
                background: activeTab === t ? "#06c46b" : "#333",
                color: activeTab === t ? "black" : "white",
                fontWeight: "bold",
                borderRadius: 6,
                border: "none",
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* TAB CONTENT AREA */}
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "#111",
            borderRadius: 6,
            border: "1px solid #333",
          }}
        >
          {/* Params Tab */}
          {activeTab === "params" && (
            <>
              <h3>Query Params</h3>
              {queryParams.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input
                    placeholder="key"
                    value={p.key}
                    onChange={(e) => {
                      const arr = [...queryParams];
                      arr[i].key = e.target.value;
                      setQueryParams(arr);
                    }}
                    style={{
                      padding: 10,
                      background: "#222",
                      color: "white",
                      borderRadius: 6,
                      border: "1px solid #444",
                      flex: 1,
                    }}
                  />
                  <input
                    placeholder="value"
                    value={p.value}
                    onChange={(e) => {
                      const arr = [...queryParams];
                      arr[i].value = e.target.value;
                      setQueryParams(arr);
                    }}
                    style={{
                      padding: 10,
                      background: "#222",
                      color: "white",
                      borderRadius: 6,
                      border: "1px solid #444",
                      flex: 1,
                    }}
                  />
                </div>
              ))}
              <button onClick={addQuery}>+ Add Query Param</button>
            </>
          )}

          {/* Headers Tab */}
          {activeTab === "headers" && (
            <>
              <h3>Headers</h3>
              {headers.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input
                    placeholder="Header Key"
                    value={h.key}
                    onChange={(e) => {
                      const arr = [...headers];
                      arr[i].key = e.target.value;
                      setHeaders(arr);
                    }}
                    style={{
                      padding: 10,
                      background: "#222",
                      color: "white",
                      borderRadius: 6,
                      border: "1px solid #444",
                      flex: 1,
                    }}
                  />
                  <input
                    placeholder="Header Value"
                    value={h.value}
                    onChange={(e) => {
                      const arr = [...headers];
                      arr[i].value = e.target.value;
                      setHeaders(arr);
                    }}
                    style={{
                      padding: 10,
                      background: "#222",
                      color: "white",
                      borderRadius: 6,
                      border: "1px solid #444",
                      flex: 1,
                    }}
                  />
                </div>
              ))}
              <button onClick={addHeader}>+ Add Header</button>
            </>
          )}

          {/* Body Tab */}
          {activeTab === "body" && (
            <>
              <h3>Body</h3>
              <textarea
                placeholder='{"name":"Manoj"}'
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                style={{
                  width: "100%",
                  padding: 12,
                  background: "#222",
                  color: "white",
                  fontFamily: "monospace",
                  borderRadius: 6,
                  border: "1px solid #444",
                }}
              />
            </>
          )}
        </div>

        {/* RESPONSE */}
        <h2 style={{ marginTop: 30 }}>Response</h2>

        <div
          style={{
            background: "#111",
            borderRadius: 6,
            padding: 20,
            border: "1px solid #333",
            maxHeight: 350,
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {loading ? (
            <p>⏳ Loading...</p>
          ) : response ? (
            <pre style={{ color: "#06c46b" }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          ) : (
            "No response yet"
          )}
        </div>
      </div>
    </div>
  );
}
