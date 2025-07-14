import axios from 'axios';

// 基础配置
const API_BASE_URL = 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 文件信息接口
export interface FileInfo {
  id: string;
  templateName: string;
  originalName: string;
  templateCategory: string;
  uploadTime: string;
  filePath: string;
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// 获取所有文件列表
export const getAllFiles = async (): Promise<FileInfo[]> => {
  const response = await apiClient.get<ApiResponse<FileInfo[]>>('/file/');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || '获取文件列表失败');
};

// 获取所有分类列表
export const getAllCategories = async (): Promise<{ name: string; count: number }[]> => {
  const response = await apiClient.get<ApiResponse<{ name: string; count: number }[]>>('/file/categories');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || '获取分类列表失败');
};

// 根据分类获取文件列表
export const getFilesByCategory = async (category: string): Promise<FileInfo[]> => {
  const response = await apiClient.get<ApiResponse<FileInfo[]>>(`/file/category/${encodeURIComponent(category)}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || '获取分类文件列表失败');
};

// 根据ID获取文件信息
export const getFileById = async (id: string): Promise<FileInfo> => {
  const response = await apiClient.get<ApiResponse<FileInfo>>(`/file/${id}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || '获取文件信息失败');
};

// 文件上传
export const uploadFile = async (
  file: File,
  templateName: string,
  templateCategory: string
): Promise<FileInfo> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('templateName', templateName);
  formData.append('templateCategory', templateCategory);

  const response = await apiClient.post<ApiResponse<FileInfo>>('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || '文件上传失败');
};

// 文件下载
export const downloadFile = async (id: string): Promise<void> => {
  const response = await apiClient.get(`/file/download/${id}`, {
    responseType: 'blob',
  });
  
  // 创建下载链接
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // 从响应头获取文件名
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'download.docx';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// 模板规则相关接口
export interface TemplateRule {
  varname: string;
  type: 'excel' | 'json' | 'direct';
  rules?: {
    sheetname?: string;
    vOrW?: boolean;
    path?: string;
  };
  format: 'formatToChineseNumber' | 'original' | 'formatToWanYuan' | 'formatToFixed2';
}

export interface TemplateRulesResponse {
  fileId: string;
  templateName: string;
  rules: TemplateRule[];
  createdAt: string;
  updatedAt: string;
}

// 设置模板规则
export const setTemplateRules = async (fileId: string, rules: TemplateRule[]): Promise<TemplateRulesResponse> => {
  const response = await apiClient.post<ApiResponse<TemplateRulesResponse>>('/templates/setTemplatesRules', {
    fileId,
    rules
  });

  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || '设置模板规则失败');
};

// 根据文件ID获取模板规则
export const getTemplateRulesByFileId = async (fileId: string): Promise<TemplateRulesResponse> => {
  const response = await apiClient.get<ApiResponse<TemplateRulesResponse>>(`/templates/rules/${fileId}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || '获取模板规则失败');
};

// 构建相关接口
export interface DataLoadRule {
  varname: string;
  type: 'excel' | 'json' | 'direct';
  path?: string;
  value?: string;
}

export interface BuildWordRequest {
  fileId: string;
  outputPath: string;
  dataRules: DataLoadRule[];
}

export interface BuildWordResponse {
  fileId: string;
  templateName: string;
  outputPath: string;
  buildTime: string;
  success: boolean;
}

// 构建Word文档
export const buildWordDocument = async (request: BuildWordRequest): Promise<BuildWordResponse> => {
  const response = await apiClient.post<ApiResponse<BuildWordResponse>>('/templates/build', request);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || '构建Word文档失败');
};

// 删除文件
export const deleteFile = async (fileId: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/templates/${fileId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || '删除文件失败');
  }
}; 