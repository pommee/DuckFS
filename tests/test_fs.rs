use duckfs::{ListResult, list_files, metadata_to_file};

use std::fs;
use std::io;
use tempfile::TempDir;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_files_root_path() {
        let result = list_files("/", 0);
        assert!(result.is_ok());
        match result.unwrap() {
            ListResult::Directories(dirs) => assert!(!dirs.is_empty()),
            _ => panic!("Expected Directories"),
        }
    }

    #[test]
    fn test_list_files_empty_path() {
        let result = list_files("", 0);
        assert!(result.is_ok());
        match result.unwrap() {
            ListResult::Directories(dirs) => assert!(!dirs.is_empty()),
            _ => panic!("Expected Directories"),
        }
    }

    #[test]
    fn test_list_files_dot_path() {
        let result = list_files(".", 0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_list_files_file_contents() -> io::Result<()> {
        let temp_dir = TempDir::new()?;
        let file_path = temp_dir.path().join("test.txt");
        fs::write(&file_path, "Hello, World!")?;

        let result = list_files(file_path.to_str().unwrap(), 0);
        assert!(result.is_ok());
        match result.unwrap() {
            ListResult::FileContents(contents) => assert_eq!(contents, "Hello, World!"),
            _ => panic!("Expected FileContents"),
        }
        Ok(())
    }

    #[test]
    fn test_list_files_directory_no_recursion() -> io::Result<()> {
        let temp_dir = TempDir::new()?;
        fs::write(temp_dir.path().join("file1.txt"), "content1")?;
        fs::write(temp_dir.path().join("file2.txt"), "content2")?;
        fs::create_dir(temp_dir.path().join("subdir"))?;

        let result = list_files(temp_dir.path().to_str().unwrap(), 0);
        assert!(result.is_ok());
        match result.unwrap() {
            ListResult::Directories(dirs) => {
                assert_eq!(dirs.len(), 1);
                assert_eq!(dirs[0].files.len(), 2);
                assert_eq!(dirs[0].subdirectories.len(), 1);
            }
            _ => panic!("Expected Directories"),
        }
        Ok(())
    }

    #[test]
    fn test_list_files_with_recursion() -> io::Result<()> {
        let temp_dir = TempDir::new()?;
        fs::create_dir(temp_dir.path().join("subdir"))?;
        fs::write(temp_dir.path().join("subdir").join("nested.txt"), "nested")?;

        let result = list_files(temp_dir.path().to_str().unwrap(), 2);
        assert!(result.is_ok());
        match result.unwrap() {
            ListResult::Directories(dirs) => assert!(dirs.len() >= 2),
            _ => panic!("Expected Directories"),
        }
        Ok(())
    }

    #[test]
    fn test_list_files_nonexistent_path() {
        let result = list_files("/nonexistent/path/xyz", 0);
        assert!(result.is_err());
    }

    #[test]
    fn test_file_metadata() -> io::Result<()> {
        let temp_dir = TempDir::new()?;
        let file_path = temp_dir.path().join("test.txt");
        fs::write(&file_path, "content")?;
        let meta = fs::metadata(&file_path)?;

        let file = metadata_to_file("test.txt", &meta);
        assert_eq!(file.name, "test.txt");
        assert_eq!(file.size, 7);
        assert!(!file.readonly);
        assert!(file.created.is_some());
        assert!(file.modified.is_some());
        Ok(())
    }

    #[test]
    fn test_root_path_depth_limiting() {
        let result = list_files("/", 5);
        assert!(result.is_ok());
        match result.unwrap() {
            ListResult::Directories(dirs) => assert!(!dirs.is_empty()),
            _ => panic!("Expected Directories"),
        }
    }
}
