use serde::Serialize;
use std::fs;
use std::fs::Metadata;
use std::io;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize)]
pub struct Directory {
    path: PathBuf,
    files: Vec<File>,
    subdirectories: Vec<String>,
}

#[derive(Serialize)]
pub struct File {
    name: String,
    size: u64,
    readonly: bool,
    created: Option<u64>,
    modified: Option<u64>,
    accessed: Option<u64>,
}

#[derive(Serialize)]
pub enum ListResult {
    Directories(Vec<Directory>),
    FileContents(String),
}

/// Lists files/directories or returns file contents.
///
/// - If `start_path` is empty, "/", or ".", treats it as filesystem root.
/// - Limits recursion depth at root for safety (max depth 0 or 1).
/// - `max_depth` = 0 means only list the target directory (no recursion).
pub fn list_files(start_path: &str, max_depth: u32) -> io::Result<ListResult> {
    let normalized_path = if start_path.is_empty() || start_path == "/" || start_path == "." {
        "/".to_string()
    } else {
        start_path.trim_start_matches('/').to_string()
    };

    let root = if normalized_path.is_empty() {
        PathBuf::from("/")
    } else {
        Path::new("/").join(&normalized_path)
    };

    let canonical_root = fs::canonicalize(&root).map_err(|e| {
        eprintln!("Failed to canonicalize path '{}': {}", root.display(), e);
        e
    })?;

    println!(
        "Listing path: {} (resolved: {})",
        start_path,
        canonical_root.display()
    );

    let metadata = fs::metadata(&canonical_root)?;

    if metadata.is_file() {
        println!("Path is a file: reading contents");
        let contents = fs::read_to_string(&canonical_root)?;
        return Ok(ListResult::FileContents(contents));
    }

    if !metadata.is_dir() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!(
                "Path is neither file nor directory: {}",
                canonical_root.display()
            ),
        ));
    }

    let effective_max_depth = if canonical_root == Path::new("/") {
        max_depth.min(1)
    } else {
        max_depth
    };

    println!(
        "Listing directory {} (effective depth: {})",
        canonical_root.display(),
        effective_max_depth
    );

    let mut collector = Vec::new();
    visit_dir(&canonical_root, 0, effective_max_depth, &mut collector)?;
    collector.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(ListResult::Directories(collector))
}

fn visit_dir(
    dir: &Path,
    current_depth: u32,
    max_depth: u32,
    collector: &mut Vec<Directory>,
) -> io::Result<()> {
    let mut files = Vec::new();
    let mut subdir_names = Vec::new();
    let mut subdirs_to_recurse = Vec::new();

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();

        match entry.metadata() {
            Ok(meta) => {
                if meta.is_file() {
                    files.push(metadata_to_file(&name, &meta));
                } else if meta.is_dir() {
                    subdir_names.push(name);
                    if current_depth < max_depth {
                        subdirs_to_recurse.push(path);
                    }
                }
            }
            Err(e) => {
                eprintln!("Skipping entry {}: {}", path.display(), e);
                continue;
            }
        }
    }

    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    subdir_names.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));

    collector.push(Directory {
        path: dir.to_path_buf(),
        files,
        subdirectories: subdir_names,
    });

    for sub_path in subdirs_to_recurse {
        if let Err(e) = visit_dir(&sub_path, current_depth + 1, max_depth, collector) {
            eprintln!("Failed recursing into {}: {}", sub_path.display(), e);
        }
    }

    Ok(())
}

fn metadata_to_file(name: &str, meta: &Metadata) -> File {
    File {
        name: name.to_string(),
        size: meta.len(),
        readonly: meta.permissions().readonly(),
        created: system_time_to_epoch(meta.created().ok()),
        modified: system_time_to_epoch(meta.modified().ok()),
        accessed: system_time_to_epoch(meta.accessed().ok()),
    }
}

fn system_time_to_epoch(time: Option<SystemTime>) -> Option<u64> {
    time.and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
}
