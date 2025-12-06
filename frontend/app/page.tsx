"use client";
import React, { useState } from "react";

export default function PostmanUI() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [queryParams, setQueryParams] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("params");

  // NEW — DB Inputs
  const [mongoUri, setMongoUri] = useState("");
  const [dbName, setDbName] = useState("");
  const [collection, setCollection] = useState("");

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

        // NEW: extra data for saving in user DB
        user_mongo_uri: mongoUri.trim() ? mongoUri : null,
        user_db: dbName.trim() ? dbName : null,
        user_collection: collection.trim() ? collection : null,
      };

      const res = await fetch("https://postmna-in-rust.onrender.com/send", {
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

  const tabBtn = (tab: string) => ({
    padding: "10px 20px",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
    background: activeTab === tab ? "#00ffaa" : "rgba(255,255,255,0.1)",
    color: activeTab === tab ? "#000" : "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    transition: "0.2s",
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "linear-gradient(135deg, #0a0f1f, #121826, #0a0f1f)",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Main Panel */}
      <div style={{ flex: 1, padding: 30 }}>
        {/* Request Controls */}
        <div
          style={{
            display: "flex",
            gap: 15,
            background: "rgba(255,255,255,0.08)",
            padding: 20,
            borderRadius: 14,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{
              padding: "12px 15px",
              background: "rgba(0,0,0,0.4)",
              color: "white",
              borderRadius: 10,
              fontWeight: "bold",
              border: "1px solid rgba(255,255,255,0.15)",
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
            placeholder="https://api.example.com/user"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              background: "rgba(0,0,0,0.3)",
              color: "white",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          />

          <button
            onClick={sendToBackend}
            style={{
              padding: "12px 25px",
              background: "#ffb300ff",
              color: "#000",
              fontWeight: "bold",
              borderRadius: 10,
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            Send
          </button>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 25, display: "flex", gap: 15 }}>
          <button style={tabBtn("params")} onClick={() => setActiveTab("params")}>
            Params
          </button>
          <button style={tabBtn("headers")} onClick={() => setActiveTab("headers")}>
            Headers
          </button>
          <button style={tabBtn("body")} onClick={() => setActiveTab("body")}>
            Body
          </button>
          <button style={tabBtn("db")} onClick={() => setActiveTab("db")}>
            DB Save
          </button>
        </div>

        {/* Content Box */}
        <div
          style={{
            marginTop: 20,
            padding: 25,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Params */}
          {activeTab === "params" && (
            <>
              {queryParams.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 15, marginBottom: 10 }}>
                  <input
                    placeholder="Key"
                    value={p.key}
                    onChange={(e) => {
                      const arr = [...queryParams];
                      arr[i].key = e.target.value;
                      setQueryParams(arr);
                    }}
                    style={{
                      padding: 12,
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 10,
                      flex: 1,
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                    }}
                  />
                  <input
                    placeholder="Value"
                    value={p.value}
                    onChange={(e) => {
                      const arr = [...queryParams];
                      arr[i].value = e.target.value;
                      setQueryParams(arr);
                    }}
                    style={{
                      padding: 12,
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 10,
                      flex: 1,
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                    }}
                  />
                </div>
              ))}
              <button
                onClick={addQuery}
                style={{
                  padding: "8px 15px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  color: "#00ffaa",
                }}
              >
                + Add Query Param
              </button>
            </>
          )}

          {/* Headers */}
          {activeTab === "headers" && (
            <>
              {headers.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 15, marginBottom: 10 }}>
                  <input
                    placeholder="Header key"
                    value={h.key}
                    onChange={(e) => {
                      const arr = [...headers];
                      arr[i].key = e.target.value;
                      setHeaders(arr);
                    }}
                    style={{
                      padding: 12,
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 10,
                      flex: 1,
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                    }}
                  />
                  <input
                    placeholder="Header value"
                    value={h.value}
                    onChange={(e) => {
                      const arr = [...headers];
                      arr[i].value = e.target.value;
                      setHeaders(arr);
                    }}
                    style={{
                      padding: 12,
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 10,
                      flex: 1,
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                    }}
                  />
                </div>
              ))}
              <button
                onClick={addHeader}
                style={{
                  padding: "8px 15px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#00ffaa",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                + Add Header
              </button>
            </>
          )}

          {/* Body */}
          {activeTab === "body" && (
            <textarea
              placeholder='{ "name": "Manoj" }'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              style={{
                width: "100%",
                padding: 15,
                background: "rgba(0,0,0,0.3)",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
              }}
            />
          )}

          {/* DB TAB */}
          {activeTab === "db" && (
            <>
              <h3 style={{ marginBottom: 10, color: "#00ffaa" }}>
                Save this request to your database
              </h3>

              <input
                value={mongoUri}
                onChange={(e) => setMongoUri(e.target.value)}
                placeholder="MongoDB URI (mongodb+srv://...)"
                style={{
                  width: "100%",
                  padding: 12,
                  marginBottom: 15,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                }}
              />

              <input
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="Database Name"
                style={{
                  width: "100%",
                  padding: 12,
                  marginBottom: 15,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                }}
              />

              <input
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="Collection Name"
                style={{
                  width: "100%",
                  padding: 12,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                }}
              />
            </>
          )}
        </div>

        {/* Response */}
        <h2 style={{ marginTop: 30, marginBottom: 10 }}>Response</h2>

        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            borderRadius: 14,
            padding: 20,
            maxHeight: 350,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          {loading ? (
            "⏳ Loading..."
          ) : response ? (
            JSON.stringify(response, null, 2)
          ) : (
            "No response yet"
          )}
        </div>
      </div>
    </div>
  );
}
