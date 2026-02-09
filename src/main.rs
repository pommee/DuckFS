pub mod fs;
use std::{collections::HashMap, path::Path, time::Instant};

use axum::{
    Json, Router,
    body::Body,
    extract::Query,
    http::{StatusCode, Uri, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use rust_embed::Embed;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
};

use crate::fs::ListResult;

#[derive(Embed)]
#[folder = "dashboard/dist/"]
struct Asset;

#[derive(Deserialize)]
struct SaveFileRequest {
    path: String,
    content: String,
}

#[derive(Serialize)]
struct SaveFileResponse {
    success: bool,
    message: String,
    path: String,
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/fs", get(get_fs))
        .route("/api/save", post(save_file_handler))
        .fallback(get(spa_handler))
        .layer(CompressionLayer::new())
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_fs(Query(params): Query<HashMap<String, String>>) -> (StatusCode, Json<Value>) {
    let now = Instant::now();
    let fs_path = params.get("path").map(|s| s.as_str()).unwrap_or("");
    let fs_depth = params
        .get("depth")
        .and_then(|d| d.parse::<u32>().ok())
        .unwrap_or(0);

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

async fn save_file_handler(
    Json(request): Json<SaveFileRequest>,
) -> Result<Json<SaveFileResponse>, (StatusCode, String)> {
    println!("Save file request received for: {}", request.path);

    if request.path.contains("..") {
        return Err((
            StatusCode::BAD_REQUEST,
            "Invalid path: '..' is not allowed".to_string(),
        ));
    }
    let full_path = Path::new(&request.path);
    if let Some(parent) = full_path.parent()
        && !parent.exists()
    {
        return Err((
            StatusCode::BAD_REQUEST,
            format!("Parent directory does not exist: {:?}", parent),
        ));
    }

    match tokio::fs::write(&full_path, &request.content).await {
        Ok(_) => {
            println!("File saved successfully: {}", request.path);
            Ok(Json(SaveFileResponse {
                success: true,
                message: "File saved successfully".to_string(),
                path: request.path,
            }))
        }
        Err(e) => {
            eprintln!("Failed to save file {}: {:?}", request.path, e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to save file: {}", e),
            ))
        }
    }
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
