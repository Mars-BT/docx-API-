/**
 * 模板规则接口
 */
export interface TemplateRule {
    varname: string;
    type: 'excel' | 'json' | 'direct';
    rules?: {
        sheetname?: string;
        vOrW?: boolean;
        path?: string;
    };
    format: string;
}

/**
 * 设置模板规则请求接口
 */
export interface SetTemplateRulesRequest {
    fileId: string;
    rules: TemplateRule[];
}

/**
 * 模板规则响应接口
 */
export interface TemplateRulesResponse {
    fileId: string;
    templateName?: string;
    rules: TemplateRule[];
    createdTime: string;
    updatedTime: string;
}

/**
 * 数据加载规则接口
 */
export interface DataLoadRule {
    varname: string;
    type: 'excel' | 'json' | 'direct';
    path?: string;
    value?: string;
}

/**
 * 构建Word文档请求接口
 */
export interface BuildWordRequest {
    fileId: string;
    outputPath: string;
    dataRules: DataLoadRule[];
}

/**
 * 构建Word文档响应接口
 */
export interface BuildWordResponse {
    fileId: string;
    templateName?: string;
    outputPath: string;
    buildTime: string;
    success: boolean;
} 