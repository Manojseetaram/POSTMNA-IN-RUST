use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::post,
    Router,
};
use bson::{doc, to_bson};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{collections::HashMap, sync::Arc};
use tower_http::cors::{Any, CorsLayer};
use mongodb::{bson::Document, options::ClientOptions, Client, Collection};
use hyper::Server;
use hyper::http::HeaderValue;


#[derive(Debug, Serialize, Deserialize, Clone)]
struct RequestPayload {
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
}

#[derive(Clone)]
struct AppState {
    history: Collection<Document>,
}

#[tokio::main]
async fn main() {
    // MongoDB setup
    let client_options = ClientOptions::parse("mongodb://localhost:27017")
        .await
        .expect("Failed to parse MongoDB URI");
    let client = Client::with_options(client_options).expect("Failed to init client");

    let db = client.database("postman");
    let history = db.collection::<Document>("history");
    let state = Arc::new(AppState { history });
let cors = CorsLayer::new()
    .allow_origin(HeaderValue::from_static("https://postmna-in-rust.vercel.app"))
    .allow_methods(Any)
    .allow_headers(Any);

    let app = Router::new()
        .route("/send", post(send_handler))
        .with_state(state)
        .layer(cors);

    println!("Backend running at http://localhost:5050");

    // Hyper 0.14 server
    let addr = "0.0.0.0:5050".parse().unwrap();

    Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn send_handler(
    State(state): State<Arc<AppState>>,
    axum::Json(payload): axum::Json<RequestPayload>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let client = reqwest::Client::new();

    let mut req = match payload.method.to_uppercase().as_str() {
        "GET" => client.get(&payload.url),
        "POST" => client.post(&payload.url),
        "PUT" => client.put(&payload.url),
        "DELETE" => client.delete(&payload.url),
        "PATCH" => client.patch(&payload.url),
        _ => return Err((StatusCode::BAD_REQUEST, "Invalid HTTP method".into())),
    };

    if let Some(headers) = &payload.headers {
        for (k, v) in headers {
            req = req.header(k, v);
        }
    }

    if let Some(body) = &payload.body {
        req = req.body(body.clone());
    }

    let res = req.send().await.map_err(|e| (StatusCode::BAD_GATEWAY, e.to_string()))?;
    let status = res.status().as_u16();
    let size = res.content_length().unwrap_or(0);
    let text = res.text().await.unwrap_or_default();

    let headers_bson = match &payload.headers {
        Some(h) => to_bson(h).unwrap_or(bson::Bson::Null),
        None => bson::Bson::Null,
    };

    let record = doc! {
        "method": payload.method.clone(),
        "url": payload.url.clone(),
        "headers": headers_bson,
        "body": payload.body.clone(),
        "status": status as i32,
        "size": size as i64,
        "response_body": text.clone(),
    };

    state.history.insert_one(record, None).await.unwrap();

    Ok(Json(serde_json::json!({
        "status": status,
        "size": size,
        "body": text,
    })))
}
