use axum::{
    routing::{get, post},
    extract::State,
    Json, Router,
};
use reqwest::Method;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::net::TcpListener;
use tokio::time::Instant;
use tower_http::cors::{Any, CorsLayer};

use mongodb::{
    bson::{doc, DateTime},
    Client, Collection,
};
use futures_util::TryStreamExt;

use sha2::{Sha256, Digest};

//
// ──────────────────────────────────────────────────────────────────────────────
//   MODELS
// ──────────────────────────────────────────────────────────────────────────────
//
#[derive(Debug, Deserialize)]
struct RequestPayload {
    method: String,
    url: String,
    headers: HashMap<String, String>,
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

#[derive(Debug, Serialize, Deserialize)]
struct HistoryRecord {
    method: String,
    url: String,
    status: u16,
    response_time: u128,
    size: usize,
    response_body: serde_json::Value,
    date: DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    email: String,
    password: String, // hashed password
    created_at: DateTime,
}

#[derive(Debug, Deserialize)]
struct SignupPayload {
    email: String,
    password: String,
}

//
// ──────────────────────────────────────────────────────────────────────────────
//   APP STATE
// ──────────────────────────────────────────────────────────────────────────────
//
#[derive(Clone)]
struct AppState {
    history: Collection<HistoryRecord>,
    users: Collection<User>,
}

//
// ──────────────────────────────────────────────────────────────────────────────
//   MAIN FUNCTION
// ──────────────────────────────────────────────────────────────────────────────
//
#[tokio::main]
async fn main() {
    // MongoDB Connect
    let client = Client::with_uri_str("mongodb://localhost:27017")
        .await
        .expect("❌ Failed to connect MongoDB");

    let db = client.database("postman_clone");

    let history = db.collection::<HistoryRecord>("history");
    let users = db.collection::<User>("users");

    let state = AppState { history, users };

    // Routes
    let app = Router::new()
        .route("/send", post(send_request))
        .route("/signup", post(signup))
        .route("/history", get(get_history))
        .with_state(state)
        .layer(CorsLayer::new().allow_origin(Any).allow_headers(Any).allow_methods(Any));

    println!("🚀 Rust Postman Backend running on http://localhost:5050");

    let listener = TcpListener::bind("0.0.0.0:5050").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

//
// ──────────────────────────────────────────────────────────────────────────────
//   SIGNUP HANDLER
// ──────────────────────────────────────────────────────────────────────────────
//
async fn signup(
    State(state): State<AppState>,
    Json(payload): Json<SignupPayload>,
) -> Json<serde_json::Value> {
    
    // Hash the password
    let mut hasher = Sha256::new();
    hasher.update(payload.password.as_bytes());
    let hashed_password = format!("{:x}", hasher.finalize());

    let user = User {
        email: payload.email.clone(),
        password: hashed_password,
        created_at: DateTime::now(),
    };

    let insert_result = state.users.insert_one(user).await;

    match insert_result {
        Ok(_) => Json(serde_json::json!({
            "status": "success",
            "message": "User created"
        })),
        Err(e) => Json(serde_json::json!({
            "status": "error",
            "message": e.to_string()
        })),
    }
}

//
// ──────────────────────────────────────────────────────────────────────────────
//   SEND REQUEST
// ──────────────────────────────────────────────────────────────────────────────
//
async fn send_request(
    State(state): State<AppState>,
    Json(payload): Json<RequestPayload>,
) -> Json<ApiResponse> {
    let method = payload.method.parse::<Method>().unwrap_or(Method::GET);
    let client = reqwest::Client::new();

    let mut req = client
        .request(method.clone(), &payload.url)
        .headers(
            payload
                .headers
                .iter()
                .map(|(k, v)| (k.parse().unwrap(), v.parse().unwrap()))
                .collect(),
        );

    if let Some(body) = payload.body.clone() {
        req = req.body(body);
    }

    let start = Instant::now();
    let resp = req.send().await;

    match resp {
        Ok(res) => {
            let status = res.status().as_u16();

            let headers_map = res
                .headers()
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
                .collect::<HashMap<_, _>>();

            let text = res.text().await.unwrap_or_default();
            let body_json = serde_json::from_str(&text).unwrap_or(serde_json::json!(text));

            let time = start.elapsed().as_millis();
            let size = text.len();

            // Save history
            let record = HistoryRecord {
                method: payload.method.clone(),
                url: payload.url.clone(),
                status,
                response_time: time,
                size,
                response_body: body_json.clone(),
                date: DateTime::now(),
            };

            let _ = state.history.insert_one(record).await;

            Json(ApiResponse {
                status,
                time,
                size,
                body: body_json,
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

//
// ──────────────────────────────────────────────────────────────────────────────
//   GET HISTORY
// ──────────────────────────────────────────────────────────────────────────────
//
async fn get_history(State(state): State<AppState>) -> Json<Vec<HistoryRecord>> {
    let mut cursor = state.history.find(doc! {}).await.unwrap();

    let mut results = Vec::new();
    while let Some(doc) = cursor.try_next().await.unwrap() {
        results.push(doc);
    }

    Json(results)
}
