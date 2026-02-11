import multer from 'multer';
import path from 'path';

const MULTER_ALLOWED_FILE_EXTENSIONS = [
  'png',
  'PNG',
  'jpg',
  'JPG',
  'jpeg',
  'JPEG',
  'gif',
  'GIF',
];

const MULTER_ALLOWED_FILE_EXTENSIONS_ALL = [
  'png', 'PNG', 'jpg', 'JPG', 'jpeg', 'JPEG', 'webp', 'WEBP', 'gif', 'GIF', 'pdf', 'PDF', 'psd', 'PSD', 'ai', 'AI', 'eps', 'EPS', 'svg', 'SVG', 'tif', 'TIF', 'tiff', 'TIFF', 'txt', 'TXT', 'xls', 'XLS', 'zip', 'ZIP',
  'zipx', 'ZIPX', 'rar', 'RAR', '7z', '7Z', 'gz', 'GZ', 'tar', 'TAR', 'exe', 'EXE', 'msi', 'MSI', 'dmg', 'DMG', 'iso', 'ISO', 'apk', 'APK', 'doc', 'DOC', 'docx', 'DOCX', 'dot', 'DOT', 'dotx', 'DOTX', 'docm', 'DOCM',
  'dotm', 'DOTM', 'odt', 'ODT', 'rtf', 'RTF', 'tex', 'TEX', 'wks', 'WKS', 'wps', 'WPS', 'wpd', 'WPD', 'pages', 'PAGES', 'numbers', 'NUMBERS', 'key', 'KEY', 'pps', 'PPS', 'ppt', 'PPT', 'pptx', 'PPTX',
  'pptm', 'PPTM', 'pot', 'POT', 'potx', 'POTX', 'potm', 'POTM', 'odp', 'ODP', 'csv', 'CSV', 'xlsx', 'XLSX', 'mp3', 'MP3', 'mp4', 'MP4', 'mov', 'MOV', 'wmv', 'WMV', 'avi', 'AVI', 'webm', 'WEBM', 'mkv', 'MKV', 'ogg', 'OGG',
  'wav', 'WAV', 'flac', 'FLAC', 'c', 'C', 'cpp', 'CPP', 'cs', 'CS', 'java', 'JAVA', 'php', 'PHP', 'py', 'PY', 'rb', 'RB', 'swift', 'SWIFT', 'h', 'H', 'js', 'JS', 'json', 'JSON', 'xml', 'XML', 'yaml', 'YAML', 'yml', 'YML',
  'md', 'MD', 'markdown', 'MARKDOWN', 'htm', 'HTM', 'html', 'HTML', 'css', 'CSS', 'sass', 'SASS', 'scss', 'SCSS', 'less', 'LESS', 'sql', 'SQL', 'sh', 'SH', 'bat', 'BAT', 'cmd', 'CMD', 'ps1', 'PS1', 'vbs', 'VBS', 'vb', 'VB', 'go', 'GO', 'numpy', 'NUMPY', 'pyc', 'PYC', 'pyd', 'PYD', 'pyo', 'PYO', 'pyw', 'PYW', 'pyz', 'PYZ', 'ipynb', 'IPYNB', 'r', 'R', 'rdata', 'RDATA', '.pck', 'PCK', 'asp', 'ASP', 'aspx', 'ASPX', '.dockerfile', 'DOCKERFILE', '.dockerignore', 'DOCKERIGNORE', '.gitignore', 'GITIGNORE', '.gitattributes', 'GITATTRIBUTES', '.gitmodules', 'GITMODULES', '.gitkeep', 'GITKEEP', '.gitconfig', 'GITCONFIG', '.git', 'GIT', 'sublime-project', 'SUBLIME-PROJECT', 'sublime-workspace', 'SUBLIME-WORKSPACE'
];

export const upload = multer({
  limits: { fileSize: 5 * 1000 * 1000 },
  fileFilter: function (_req, file, callback) {
    const ext = path.extname(file.originalname);
    if (!MULTER_ALLOWED_FILE_EXTENSIONS.includes(ext.replace('.', ''))) {
      return callback(new Error('Only images are allowed'));
    }
    callback(null, true);
  },
});

export const uploadAllKnowExtensionFiles = multer({
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: function (_req, file, callback) {
    const ext = path.extname(file.originalname);
    if (!MULTER_ALLOWED_FILE_EXTENSIONS_ALL.includes(ext.replace('.', ''))) {
      return callback(new Error('Only few file types are allowed'));
    }
    callback(null, true);
  },
});

export const uploadAnyFile = multer({
  limits: { fileSize: 5 * 1000 * 1000 },
  fileFilter: function (req, file, callback) {
    const ext = path.extname(file.originalname);
    if (!ext.replace('.', '')) {
      return callback(new Error('File extension invalid'));
    }
    callback(null, true);
  },
});

// Alias for profile image upload
export const profileImageUpload = upload;