use axum::{
    routing::post,
    Json, Router,
};
use reqwest::Method;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::net::TcpListener;
use tokio::time::Instant;
use tower_http::cors::{Any, CorsLayer};

#[derive(Debug, Deserialize)]
struct RequestPayload {
    method: String,
    url: String,
    headers: HashMap<String, String>,
    query: HashMap<String, String>,
    body: Option<String>,
}

#[derive(Debug, Serialize)]
struct ApiResponse {
    status: u16,
    time: u128,
    size: usize,
    body: serde_json::Value,
    headers: HashMap<String, String>,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/send", post(send_request))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_headers(Any)
                .allow_methods(Any),
        );

    println!("🚀 Rust Postman Backend running on http://localhost:5050");

    // NEW: Axum 0.7 server syntax
    let listener = TcpListener::bind("0.0.0.0:5050").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn send_request(Json(payload): Json<RequestPayload>) -> Json<ApiResponse> {
    let method = payload.method.parse::<Method>().unwrap_or(Method::GET);

    let client = reqwest::Client::new();
    let mut req = client
        .request(method, &payload.url)
        .headers(
            payload
                .headers
                .into_iter()
                .map(|(k, v)| (k.parse().unwrap(), v.parse().unwrap()))
                .collect(),
        );

    if let Some(body) = payload.body {
        req = req.body(body);
    }

    let start = Instant::now();
    let response = req.send().await;

    match response {
        Ok(res) => {
            let status = res.status().as_u16();
            let headers_map = res
                .headers()
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
                .collect::<HashMap<_, _>>();

            let text = res.text().await.unwrap_or_default();
            let size = text.len();

            let parsed =
                serde_json::from_str(&text).unwrap_or(serde_json::json!(text));

            Json(ApiResponse {
                status,
                time: start.elapsed().as_millis(),
                size,
                body: parsed,
                headers: headers_map,
            })
        }
        Err(err) => Json(ApiResponse {
            status: 500,
            time: 0,
            size: 0,
            body: serde_json::json!(err.to_string()),
            headers: HashMap::new(),
        }),
    }
}
