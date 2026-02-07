mod fs;
use std::{collections::HashMap, time::Instant};

use axum::{Router, extract::Query, http::StatusCode, response::Json, routing::get};
use serde_json::{Value, json};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(root))
        .route("/json", get(json));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root(Query(params): Query<HashMap<String, String>>) -> Result<Json<Value>, StatusCode> {
    let fs_path = params.get("path").ok_or(StatusCode::BAD_REQUEST)?;

    let now = Instant::now();
    let files = fs::list_files(fs_path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let elapsed = now.elapsed();

    println!("Took: {:?}", elapsed);
    Ok(Json(json!({ "data": files })))
}

async fn json() -> Json<Value> {
    Json(json!({ "data": 42 }))
}
