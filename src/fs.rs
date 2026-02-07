use serde::Serialize;
use std::fs;
use std::fs::{DirEntry, Metadata};
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

pub fn list_files(start_path: &str, max_depth: u32) -> io::Result<Vec<Directory>> {
    let root = Path::new("/").join(start_path);
    let root = fs::canonicalize(&root)?;

    println!(
        "Listing files under path {} (max depth: {})",
        root.display(),
        max_depth
    );

    let mut result = Vec::new();
    visit_dir(&root, 0, max_depth, &mut result)?;
    Ok(result)
}

fn visit_dir(
    dir: &Path,
    current_depth: u32,
    max_depth: u32,
    collector: &mut Vec<Directory>,
) -> io::Result<()> {
    let mut files = Vec::new();
    let mut subdir_names = Vec::new();
    let mut subdir_paths_to_recurse = Vec::new();

    for entry in fs::read_dir(dir)? {
        let entry: DirEntry = entry?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        let meta = entry.metadata()?;

        if meta.is_file() {
            files.push(metadata_to_file(&name, &meta));
        } else if meta.is_dir() {
            subdir_names.push(name);
            if current_depth < max_depth {
                subdir_paths_to_recurse.push(path);
            }
        }
    }

    collector.push(Directory {
        path: dir.to_path_buf(),
        files,
        subdirectories: subdir_names,
    });

    // Only recurse if max depth not reached
    for sub_path in subdir_paths_to_recurse {
        visit_dir(&sub_path, current_depth + 1, max_depth, collector)?;
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
    time.and_then(|t| t.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs()))
}
