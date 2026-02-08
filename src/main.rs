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
use tower_http::cors::{Any, CorsLayer};

use crate::fs::ListResult;

#[derive(Embed)]
#[folder = "dashboard/dist/"]
struct Asset;

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/fs", get(get_fs))
        .fallback(get(spa_handler))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_fs(Query(params): Query<HashMap<String, String>>) -> (StatusCode, Json<Value>) {
    let fs_path = params.get("path").map(|s| s.as_str()).unwrap_or("");
    let fs_depth = params
        .get("depth")
        .and_then(|d| d.parse::<u32>().ok())
        .unwrap_or(0);

    println!("API request: path='{}', depth={}", fs_path, fs_depth);

    let now = Instant::now();

    let result = match fs::list_files(fs_path, fs_depth) {
        Ok(res) => res,
        Err(e) => {
            eprintln!("list_files error for path='{}': {:?}", fs_path, e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            );
        }
    };

    let elapsed = now.elapsed();
    println!("Request completed in {:?}", elapsed);

    let data = match result {
        ListResult::Directories(dirs) => json!({ "Directories": dirs }),
        ListResult::FileContents(contents) => json!({ "FileContents": contents }),
    };

    (StatusCode::OK, Json(json!({ "data": data })))
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
