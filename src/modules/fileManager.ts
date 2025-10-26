/**
 * File Manager for TriliumNext MCP
 * Handles file upload workflow and integration with Trilium ETAPI
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import { validateFile, generateFileTitle, ValidationResult, SupportedMimeType, parseFileDataSource, ParsedFileData } from '../utils/fileUtils.js';

export interface CreateFileNoteParams {
  parentNoteId: string;
  filePath: string; // Can be file path, base64, or data URI
  title?: string;
  mimeType?: string;
  attributes?: any[];
  maxSize?: number;
  noteType?: 'file' | 'image'; // Specify 'file' or 'image' type
}

export interface FileUploadOptions {
  title?: string;
  mimeType?: string;
  attributes?: any[];
  maxSize?: number;
}

export interface FileInfo {
  noteId: string;
  title: string;
  type: 'file';
  mimeType: string;
  contentSize: number;
  attachmentId?: string;
  fileUrl?: string;
  dateModified: string;
  blobId: string;
}

export interface CreateNoteResult {
  note: {
    noteId: string;
    title: string;
    type: string;
    mime?: string;
    blobId: string;
  };
}

export class FileManager {
  private axiosClient: AxiosInstance;
  private readonly maxFileSize: number;

  constructor(axiosClient: AxiosInstance, maxFileSize: number = 50 * 1024 * 1024) {
    this.axiosClient = axiosClient;
    this.maxFileSize = maxFileSize;
  }

  /**
   * Create a file or image note following Trilium's two-step process:
   * 1. Create note metadata with type="file" or type="image"
   * 2. Upload binary content to the created note
   */
  async createFileNote(params: CreateFileNoteParams): Promise<CreateNoteResult> {
    // Parse and validate file data source
    let fileData: ParsedFileData;

    try {
      fileData = parseFileDataSource(params.filePath);
    } catch (error) {
      throw new Error(`File data parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate MIME type if specified
    if (params.mimeType && !this.isCompatibleMimeType(params.mimeType, fileData.mimeType)) {
      throw new Error(`MIME type mismatch: specified ${params.mimeType}, detected ${fileData.mimeType}`);
    }

    const mimeType = params.mimeType || fileData.mimeType;
    const title = params.title || this.generateTitleFromFileData(fileData);

    // Auto-detect note type if not specified
    let noteType = params.noteType;
    if (!noteType) {
      const { detectNoteTypeFromMime } = await import('../utils/fileUtils.js');
      const detectedType = detectNoteTypeFromMime(mimeType);
      if (!detectedType) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
      noteType = detectedType;
    }

    // Validate file size
    if (fileData.size > (params.maxSize || this.maxFileSize)) {
      throw new Error(`File too large: ${(fileData.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${((params.maxSize || this.maxFileSize) / 1024 / 1024).toFixed(2)}MB`);
    }

    try {
      // Step 1: Create file or image note with metadata
      const noteData: any = {
        parentNoteId: params.parentNoteId,
        title: title,
        type: noteType,
        mime: mimeType,
        content: '' // Empty content initially, will be uploaded separately
      };

      // Only include attributes if they exist and have content
      if (params.attributes && params.attributes.length > 0) {
        noteData.attributes = params.attributes;
      }

      const noteResponse = await this.axiosClient.post('/create-note', noteData);
      const noteResult: CreateNoteResult = noteResponse.data;

      // Step 2: Upload binary content
      await this.uploadFileContentFromData(noteResult.note.noteId, fileData, mimeType);

      return noteResult;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to create file note (${status}): ${message}`);
      }
      throw new Error(`Failed to create file note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload binary file content to an existing note from parsed file data
   * Supports file paths, base64 strings, and data URIs
   */
  async uploadFileContentFromData(noteId: string, fileData: ParsedFileData, mimeType: string): Promise<void> {
    try {
      let fileStream: NodeJS.ReadableStream;

      if (fileData.type === 'path') {
        // Create file stream from file path
        if (!fs.existsSync(fileData.data as string)) {
          throw new Error(`File not found: ${fileData.data}`);
        }
        fileStream = fs.createReadStream(fileData.data as string);
      } else {
        // Create readable stream from buffer (base64 or data URI)
        const buffer = fileData.data instanceof Buffer ? fileData.data : Buffer.from(fileData.data as string, 'base64');
        fileStream = this.createReadableStreamFromBuffer(buffer);
      }

      // Upload with exact headers from PDF upload guide
      await this.axiosClient.put(`/notes/${noteId}/content`, fileStream, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Transfer-Encoding': 'binary'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to upload file content (${status}): ${message}`);
      }
      throw new Error(`Failed to upload file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload binary file content to an existing note
   * Follows the exact pattern from PDF upload guide
   */
  async uploadFileContent(noteId: string, filePath: string, mimeType: string): Promise<void> {
    try {
      // Validate file exists before upload
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create file stream for upload
      const fileStream = fs.createReadStream(filePath);

      // Upload with exact headers from PDF upload guide
      await this.axiosClient.put(`/notes/${noteId}/content`, fileStream, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Transfer-Encoding': 'binary'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to upload file content (${status}): ${message}`);
      }
      throw new Error(`Failed to upload file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get enhanced file information for a file note
   */
  async getFileInfo(noteId: string): Promise<FileInfo> {
    try {
      // Get basic note information
      const noteResponse = await this.axiosClient.get(`/notes/${noteId}`);
      const note = noteResponse.data;

      if (note.type !== 'file') {
        throw new Error(`Note ${noteId} is not a file note (type: ${note.type})`);
      }

      // Try to get attachment information
      let attachmentInfo = null;
      try {
        // Get content to extract attachment information
        const contentResponse = await this.axiosClient.get(`/notes/${noteId}/content`, {
          headers: { 'Accept': 'text/html' }
        });

        // Parse HTML content to extract attachment information
        const htmlContent = contentResponse.data;
        const attachmentMatch = htmlContent.match(/src="api\/attachments\/([^"]+)\/[^"]+\/([^"]+)"/);

        if (attachmentMatch) {
          const attachmentId = attachmentMatch[1];

          // Get detailed attachment information
          const attachmentResponse = await this.axiosClient.get(`/attachments/${attachmentId}`);
          attachmentInfo = attachmentResponse.data;
        }
      } catch {
        // Attachment information might not be available immediately after upload
        // This is not a critical error
      }

      return {
        noteId: note.noteId,
        title: note.title,
        type: 'file',
        mimeType: note.mime || 'application/octet-stream',
        contentSize: attachmentInfo?.contentLength || 0,
        attachmentId: attachmentInfo?.attachmentId,
        fileUrl: attachmentInfo ? `api/attachments/${attachmentInfo.attachmentId}/document/${encodeURIComponent(note.title)}` : undefined,
        dateModified: note.dateModified || new Date().toISOString(),
        blobId: note.blobId
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to get file info (${status}): ${message}`);
      }
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process complete file upload workflow
   * Convenience method that combines validation, creation, and upload
   */
  async processFileUpload(parentNoteId: string, filePath: string, options?: FileUploadOptions): Promise<FileInfo> {
    try {
      // Create the file note
      const createResult = await this.createFileNote({
        parentNoteId,
        filePath,
        title: options?.title,
        mimeType: options?.mimeType,
        attributes: options?.attributes,
        maxSize: options?.maxSize || this.maxFileSize
      });

      // Get enhanced file information
      const fileInfo = await this.getFileInfo(createResult.note.noteId);

      return fileInfo;

    } catch (error) {
      throw new Error(`File upload workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate file for upload
   */
  private validateFileForUpload(filePath: string, maxSize: number): ValidationResult {
    // First validate the file exists and is accessible
    const validation = validateFile(filePath, maxSize);
    if (!validation.valid) {
      return validation;
    }

    return validation;
  }

  /**
   * Check if a note is a file note
   */
  async isFileNote(noteId: string): Promise<boolean> {
    try {
      const noteResponse = await this.axiosClient.get(`/notes/${noteId}`);
      const note = noteResponse.data;
      return note.type === 'file';
    } catch {
      return false;
    }
  }

  /**
   * Download file content from a file note
   * Note: This would require additional implementation based on Trilium's file download API
   */
  async downloadFile(noteId: string, savePath?: string): Promise<Buffer> {
    try {
      // Get file info first
      const fileInfo = await this.getFileInfo(noteId);

      if (!fileInfo.fileUrl) {
        throw new Error('File URL not available for download');
      }

      // Download the file content
      const downloadResponse = await this.axiosClient.get(`/${fileInfo.fileUrl}`, {
        responseType: 'arraybuffer'
      });

      const fileBuffer = Buffer.from(downloadResponse.data);

      // Save to file if path provided
      if (savePath) {
        fs.writeFileSync(savePath, fileBuffer);
      }

      return fileBuffer;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to download file (${status}): ${message}`);
      }
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a readable stream from a Buffer
   */
  private createReadableStreamFromBuffer(buffer: Buffer): NodeJS.ReadableStream {
    const { Readable } = require('stream');
    return Readable.from(buffer);
  }

  /**
   * Generate title from file data
   */
  private generateTitleFromFileData(fileData: ParsedFileData): string {
    if (fileData.fileName) {
      return generateFileTitle(fileData.fileName);
    }

    // For base64/data URI without filename, generate a generic title
    const extension = this.getExtensionFromMimeType(fileData.mimeType);
    return `Untitled File${extension ? '.' + extension : ''}`;
  }

  /**
   * Check MIME type compatibility
   */
  private isCompatibleMimeType(specified: string, detected: string): boolean {
    // Allow exact matches
    if (specified === detected) {
      return true;
    }

    // Allow some common MIME type aliases
    const compatibleTypes: { [key: string]: string[] } = {
      'image/jpeg': ['image/jpg'],
      'audio/mpeg': ['audio/mp3'],
      'application/msword': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    return compatibleTypes[specified]?.includes(detected) ||
           compatibleTypes[detected]?.includes(specified) ||
           false;
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string | null {
    const extensions: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/mp4': 'm4a',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };

    return extensions[mimeType] || null;
  }
}