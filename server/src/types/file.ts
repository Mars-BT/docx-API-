/**
 * 文件信息接口
 */
export interface FileInfo {
    id: string;
    templateName: string;
    originalName: string;
    templateCategory: string;
    uploadTime: string;
    filePath: string;
}

/**
 * 上传文件请求接口
 */
export interface UploadRequest {
    templateName: string;
    templateCategory: string;
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
} 