# File Tool Specification

## ADDED Requirements

### Requirement: Path Restriction to wp-content
The system SHALL restrict all file operations to the /var/www/html/wp-content directory and /tmp/linopress directory, rejecting attempts to access other paths.

#### Scenario: Write file to wp-content/themes
- **WHEN** a skill writes a theme file to /var/www/html/wp-content/themes/custom/style.css
- **THEN** the file tool creates the file successfully

#### Scenario: Reject write to wp-admin
- **WHEN** a skill attempts to write to /var/www/html/wp-admin/hack.php
- **THEN** the file tool rejects the operation and raises a security violation error

#### Scenario: Reject write to wp-config.php
- **WHEN** a skill attempts to modify /var/www/html/wp-config.php
- **THEN** the file tool rejects the operation and raises a security violation error

### Requirement: File Read Operations
The system SHALL provide read operations for files within allowed directories, returning file contents as strings or buffers.

#### Scenario: Read existing file
- **WHEN** a skill reads /var/www/html/wp-content/themes/twentytwentyfour/style.css
- **THEN** the file tool returns the file contents as a string

#### Scenario: Read nonexistent file
- **WHEN** a skill attempts to read /var/www/html/wp-content/missing.txt
- **THEN** the file tool raises a file-not-found error

#### Scenario: Read binary file
- **WHEN** a skill reads an image file /var/www/html/wp-content/uploads/logo.png
- **THEN** the file tool returns the file contents as a buffer

### Requirement: File Write Operations
The system SHALL provide write operations to create or overwrite files within allowed directories.

#### Scenario: Create new file
- **WHEN** a skill writes content to /var/www/html/wp-content/themes/custom/functions.php
- **THEN** the file tool creates the file with the specified content

#### Scenario: Overwrite existing file
- **WHEN** a skill writes to an existing file /var/www/html/wp-content/themes/custom/style.css
- **THEN** the file tool replaces the file content with the new content

#### Scenario: Create parent directories
- **WHEN** a skill writes to /var/www/html/wp-content/themes/new-theme/assets/css/style.css
- **THEN** the file tool creates all missing parent directories (themes/new-theme/assets/css/) before writing the file

### Requirement: File Copy Operations
The system SHALL provide copy operations to duplicate files within allowed directories.

#### Scenario: Copy file within wp-content
- **WHEN** a skill copies /var/www/html/wp-content/themes/parent/style.css to /var/www/html/wp-content/themes/child/style.css
- **THEN** the file tool creates an exact copy at the destination

#### Scenario: Copy preserves file permissions
- **WHEN** a file is copied
- **THEN** the destination file inherits appropriate permissions (644 for files)

### Requirement: File Delete Operations
The system SHALL provide delete operations to remove files and directories within allowed paths.

#### Scenario: Delete existing file
- **WHEN** a skill deletes /var/www/html/wp-content/themes/old-theme/style.css
- **THEN** the file tool removes the file

#### Scenario: Delete directory recursively
- **WHEN** a skill deletes /var/www/html/wp-content/themes/old-theme/
- **THEN** the file tool removes the directory and all its contents

#### Scenario: Delete nonexistent file
- **WHEN** a skill attempts to delete a nonexistent file
- **THEN** the file tool succeeds silently (idempotent deletion)

### Requirement: Path Validation
The system SHALL validate all file paths to prevent directory traversal attacks and ensure they resolve within allowed directories.

#### Scenario: Reject path traversal attempt
- **WHEN** a skill attempts to access /var/www/html/wp-content/../../etc/passwd
- **THEN** the file tool detects the traversal and rejects the operation

#### Scenario: Normalize relative paths
- **WHEN** a skill provides a relative path like themes/../plugins/test.php
- **THEN** the file tool normalizes it to /var/www/html/wp-content/plugins/test.php and validates it's within allowed directories

### Requirement: File Metadata Operations
The system SHALL provide operations to check file existence, size, and modification time.

#### Scenario: Check file exists
- **WHEN** a skill checks if /var/www/html/wp-content/themes/custom/style.css exists
- **THEN** the file tool returns true if the file exists, false otherwise

#### Scenario: Get file size
- **WHEN** a skill retrieves the size of /var/www/html/wp-content/uploads/image.jpg
- **THEN** the file tool returns the file size in bytes

#### Scenario: Get modification time
- **WHEN** a skill retrieves the last modified timestamp of a file
- **THEN** the file tool returns the mtime as an ISO 8601 timestamp

### Requirement: Directory Listing
The system SHALL provide directory listing operations to enumerate files within allowed paths.

#### Scenario: List files in directory
- **WHEN** a skill lists /var/www/html/wp-content/themes/
- **THEN** the file tool returns an array of file and directory names

#### Scenario: List files recursively
- **WHEN** a skill lists /var/www/html/wp-content/themes/ with recursive option
- **THEN** the file tool returns all files in the directory tree

#### Scenario: Filter listing by pattern
- **WHEN** a skill lists /var/www/html/wp-content/themes/ with pattern *.css
- **THEN** the file tool returns only CSS files

### Requirement: File Permissions Management
The system SHALL set appropriate file permissions (644 for files, 755 for directories) on all created files and directories.

#### Scenario: New file has correct permissions
- **WHEN** a skill creates a new PHP file
- **THEN** the file is created with 644 permissions (owner read-write, group/others read)

#### Scenario: New directory has correct permissions
- **WHEN** a skill creates a new directory
- **THEN** the directory is created with 755 permissions (owner read-write-execute, group/others read-execute)

### Requirement: Atomic Write Operations
The system SHALL perform write operations atomically by writing to a temporary file and renaming to prevent partial writes.

#### Scenario: Atomic file write
- **WHEN** a skill writes a large file
- **THEN** the file tool writes to a temporary file first, then atomically renames it to the target path

#### Scenario: Write failure cleanup
- **WHEN** a write operation fails partway through
- **THEN** the temporary file is deleted and the original file (if any) remains unchanged

### Requirement: File Encoding Handling
The system SHALL support UTF-8 encoding for text files and binary mode for non-text files.

#### Scenario: Write UTF-8 text file
- **WHEN** a skill writes text content with Unicode characters
- **THEN** the file tool encodes the content as UTF-8

#### Scenario: Read binary file without encoding
- **WHEN** a skill reads a binary file (image, zip)
- **THEN** the file tool returns raw bytes without text encoding

### Requirement: Temporary File Management
The system SHALL provide operations to create and clean up temporary files in /tmp/linopress.

#### Scenario: Create temporary file
- **WHEN** a skill needs a temporary file for processing
- **THEN** the file tool creates a unique file in /tmp/linopress/ and returns the path

#### Scenario: Automatic temp file cleanup
- **WHEN** a build completes or fails
- **THEN** the system removes all temporary files created during the build

### Requirement: Concurrent Access Safety
The system SHALL handle concurrent file operations safely, preventing race conditions between skills.

#### Scenario: Concurrent writes to different files
- **WHEN** two skills write to different files simultaneously
- **THEN** both operations complete successfully without interference

#### Scenario: Concurrent writes to same file
- **WHEN** two skills attempt to write to the same file simultaneously
- **THEN** the file tool serializes the writes to prevent corruption
