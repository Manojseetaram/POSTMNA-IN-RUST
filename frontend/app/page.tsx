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

  const handleRequest = async () => {
    if (!url) return alert("Enter URL");

    setLoading(true);
    setResponse(null);

    try {
      // Build Query Parameters
      let finalUrl = url;
      const paramsObj: any = {};

      queryParams.forEach((p) => {
        if (p.key.trim() !== "") paramsObj[p.key] = p.value;
      });

      const qs = new URLSearchParams(paramsObj).toString();
      if (qs) finalUrl = `${url}?${qs}`;

      // Build Headers
      const headersObj: any = {};
      headers.forEach((h) => {
        if (h.key.trim() !== "") headersObj[h.key] = h.value;
      });

      // Build Request Options
      const options: any = {
        method,
        headers: headersObj,
      };

      if (method !== "GET" && body.trim() !== "") {
        options.body = body;
      }

      const res = await fetch(finalUrl, options);
      const data = await res.json().catch(() => "Non-JSON response");

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err) {
      setResponse({ error: String(err) });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28 }}>My Own Postman 🔥</h1>

      {/* METHOD + URL */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{ padding: 10 }}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
          <option>PATCH</option>
        </select>

        <input
          type="text"
          placeholder="Enter request URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 1, padding: 10 }}
        />

        <button
          onClick={handleRequest}
          style={{ padding: "10px 20px", background: "black", color: "white" }}
        >
          Send
        </button>
      </div>

      {/* QUERY PARAMS */}
      <h3>Query Params</h3>
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
      <h3 style={{ marginTop: 20 }}>Headers</h3>
      {headers.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
          <input
            placeholder="Content-Type"
            value={h.key}
            onChange={(e) => {
              const arr = [...headers];
              arr[i].key = e.target.value;
              setHeaders(arr);
            }}
            style={{ padding: 8 }}
          />
          <input
            placeholder="application/json"
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
      {(method === "POST" ||
        method === "PUT" ||
        method === "PATCH") && (
        <>
          <h3 style={{ marginTop: 20 }}>Body (JSON)</h3>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 10, fontFamily: "monospace" }}
            placeholder='{"name": "Manoj"}'
          />
        </>
      )}

      {/* RESPONSE */}
      <h2 style={{ marginTop: 30 }}>Response</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <pre
          style={{
            background: "#f5f5f5",
            padding: 15,
            borderRadius: 5,
            whiteSpace: "pre-wrap",
            overflowX: "auto",
          }}
        >
          {response ? JSON.stringify(response, null, 2) : "No response yet"}
        </pre>
      )}
    </div>
  );
}
