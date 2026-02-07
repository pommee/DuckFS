use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Serialize)]
pub struct Directory {
    parent: PathBuf,
    name: String,
    files: Vec<File>,
}

#[derive(Serialize)]
pub struct File {
    name: String,
    size: u64,
    is_readonly: bool,
    created: Option<u64>,
    modified: Option<u64>,
    accessed: Option<u64>,
}

pub fn list_files(fs_path: &str) -> std::io::Result<Vec<Directory>> {
    let full_path = Path::new("/").join(fs_path);
    println!("Listing files under path {}", full_path.display());

    let mut directories = Vec::new();
    let paths = fs::read_dir(&full_path)?;
    let mut direct_files = Vec::new();

    for entry in paths {
        let entry = entry?;
        let metadata = entry.metadata()?;

        if metadata.is_file() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            direct_files.push(File {
                name: file_name,
                size: metadata.len(),
                is_readonly: metadata.permissions().readonly(),
                created: system_time_to_epoch(&metadata.created().ok()),
                modified: system_time_to_epoch(&metadata.modified().ok()),
                accessed: system_time_to_epoch(&metadata.accessed().ok()),
            });
        }
    }

    // If there are files at this level, add them as a directory entry
    if !direct_files.is_empty() {
        let name = full_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string());

        directories.push(Directory {
            parent: full_path.parent().unwrap_or(Path::new("/")).to_path_buf(),
            name,
            files: direct_files,
        });
    }

    // Process subdirectories
    let paths = fs::read_dir(&full_path)?;
    for entry in paths {
        let entry = entry?;
        let metadata = entry.metadata()?;

        if metadata.is_dir() {
            let name = entry.file_name().to_string_lossy().to_string();
            let dir_path = entry.path();

            let mut files = Vec::new();
            if let Ok(sub_paths) = fs::read_dir(&dir_path) {
                for sub_entry in sub_paths.flatten() {
                    if let Ok(sub_meta) = sub_entry.metadata()
                        && sub_meta.is_file()
                    {
                        let file_name = sub_entry.file_name().to_string_lossy().to_string();
                        files.push(File {
                            name: file_name,
                            size: sub_meta.len(),
                            is_readonly: sub_meta.permissions().readonly(),
                            created: system_time_to_epoch(&sub_meta.created().ok()),
                            modified: system_time_to_epoch(&sub_meta.modified().ok()),
                            accessed: system_time_to_epoch(&sub_meta.accessed().ok()),
                        });
                    }
                }
            }

            let directory = Directory {
                parent: full_path.clone(),
                name,
                files,
            };
            directories.push(directory);
        }
    }

    Ok(directories)
}

fn system_time_to_epoch(time: &Option<SystemTime>) -> Option<u64> {
    time.and_then(|t| {
        t.duration_since(SystemTime::UNIX_EPOCH)
            .ok()
            .map(|d| d.as_secs())
    })
}
