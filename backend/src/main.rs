
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use url::Url;

// MongoDB + BSON
use mongodb::{
    Client as MongoClient,
    options::ClientOptions,
    bson::{self, doc, Bson}
};

#[derive(Debug, Deserialize)]
struct SendRequestPayload {
    method: String,
    url: String,
    headers: Option<std::collections::HashMap<String, String>>,
    body: Option<String>,

    // Optional fields provided by the user so we save into *their* DB
    // Example: "mongodb+srv://user:pass@cluster0.mongodb.net"
    user_mongo_uri: Option<String>,
    user_db: Option<String>,
    user_collection: Option<String>,
}

#[derive(Debug, Serialize)]
struct SendResponse {
    status: u16,
    size: u64,
    body: String,
}

#[derive(Clone)]
struct AppState {}

#[tokio::main]

async fn main() {
    let state = Arc::new(AppState {});

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/send", post(send_handler))
        .with_state(state)
        .layer(cors);

    // 🔥 IMPORTANT — Render gives the port via env var
    let port = std::env::var("PORT").unwrap_or_else(|_| "10000".to_string());
    let addr = format!("0.0.0.0:{}", port).parse().unwrap();

    println!("Server running on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}


async fn send_handler(
    State(_state): State<Arc<AppState>>,
    axum::Json(payload): axum::Json<SendRequestPayload>,
) -> Result<Json<SendResponse>, (StatusCode, String)> {
    // 1) Validate and prevent obvious SSRF to localhost
    let parsed = Url::parse(&payload.url).map_err(|_| (StatusCode::BAD_REQUEST, "Invalid target URL".to_string()))?;
    if let Some(host) = parsed.host_str() {
        let h = host.to_lowercase();
        if h == "localhost" || h == "127.0.0.1" || h == "0.0.0.0" || h == "::1" || h.ends_with(".local") {
            return Err((StatusCode::FORBIDDEN, "Requests to local/private hosts are not allowed".into()));
        }
    }

    // 2) Build reqwest client with protections
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(3))
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Client build error: {}", e)))?;

    // 3) Build request
    let method = payload.method.to_uppercase();
    let mut req = match method.as_str() {
        "GET" => client.get(parsed.as_str()),
        "POST" => client.post(parsed.as_str()),
        "PUT" => client.put(parsed.as_str()),
        "DELETE" => client.delete(parsed.as_str()),
        "PATCH" => client.patch(parsed.as_str()),
        _ => return Err((StatusCode::BAD_REQUEST, "Invalid method".into())),
    };

    if let Some(hdrs) = &payload.headers {
        for (k, v) in hdrs {
            // header validation omitted for brevity; reqwest will validate
            req = req.header(k, v);
        }
    }

    if let Some(b) = &payload.body {
        req = req.body(b.clone());
    }

    // 4) Send request to upstream
    let upstream = req.send().await.map_err(|e| (StatusCode::BAD_GATEWAY, format!("Upstream error: {}", e)))?;
    let status = upstream.status().as_u16();
    let size = upstream.content_length().unwrap_or(0);

    // read text but cap it (avoid huge memory)
    let text = match upstream.text().await {
        Ok(t) => {
            if t.len() > 200_000 { t[..200_000].to_string() } else { t }
        }
        Err(_) => "".to_string(),
    };

    // 5) If user provided MongoDB info, insert record into their DB
    if let (Some(uri), Some(db_name), Some(coll_name)) = (&payload.user_mongo_uri, &payload.user_db, &payload.user_collection) {
        // Try to connect and insert — don't fail the whole request if DB insert fails.
        let _ = insert_into_user_mongo(uri, db_name, coll_name, &payload, status, size as i64, &text).await;
    }

    // 6) Return upstream response to frontend
    Ok(Json(SendResponse { status, size, body: text }))
}

async fn insert_into_user_mongo(
    uri: &str,
    db_name: &str,
    coll_name: &str,
    payload: &SendRequestPayload,
    status: u16,
    size: i64,
    resp_body: &str,
) -> Result<(), anyhow::Error> {
    // parse client options (this validates the URI)
    let mut client_options = ClientOptions::parse(uri).await?;
    client_options.app_name = Some("postman-proxy-user".to_string());
    let client = MongoClient::with_options(client_options)?;

    let db = client.database(db_name);
    let coll = db.collection::<mongodb::bson::Document>(coll_name);

    // Build a document to insert
    let headers_bson = match &payload.headers {
        Some(h) => bson::to_bson(h).unwrap_or(Bson::Null),
        None => Bson::Null,
    };

    let doc = doc! {
        "method": &payload.method,
        "url": &payload.url,
        "headers": headers_bson,
        "body": payload.body.clone(),
        "status": status as i32,
        "size": size,
        "response_body": resp_body,
        "created_at": mongodb::bson::DateTime::now()
    };

    // insert (fire-and-forget; return errors to caller)
    coll.insert_one(doc, None).await?;
    Ok(())
}
