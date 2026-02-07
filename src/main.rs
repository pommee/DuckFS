pub mod fs;
use std::{collections::HashMap, time::Instant};

use axum::{
    Json, Router,
    body::Body,
    extract::Query,
    http::{StatusCode, Uri, header},
    response::{IntoResponse, Response},
    routing::get,
};
use rust_embed::Embed;
use serde_json::{Value, json};

#[derive(Embed)]
#[folder = "dashboard/dist/"]
struct Asset;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/api/fs", get(get_fs))
        .fallback(get(spa_handler));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_fs(Query(params): Query<HashMap<String, String>>) -> Result<Json<Value>, StatusCode> {
    let fs_path = params.get("path").ok_or(StatusCode::BAD_REQUEST)?;
    let fs_depth = params
        .get("depth")
        .and_then(|d| d.parse::<u32>().ok())
        .unwrap_or(0);

    let now = Instant::now();
    let files = fs::list_files(fs_path, fs_depth).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let elapsed = now.elapsed();

    println!("Took: {:?}", elapsed);
    Ok(Json(json!({ "data": files })))
}

async fn spa_handler(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');

    if let Some(content) = Asset::get(path) {
        let mime = mime_guess::from_path(path).first_or_octet_stream();
        let res = Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, mime.as_ref())
            .body(Body::from(content.data.to_vec()))
            .unwrap();

        return res;
    }

    match Asset::get("index.html") {
        Some(content) => axum::response::Html(content.data.to_vec()).into_response(),
        None => (
            StatusCode::NOT_FOUND,
            "Not found - even index.html is missing".to_string(),
        )
            .into_response(),
    }
}
