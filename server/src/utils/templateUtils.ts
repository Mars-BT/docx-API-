import * as fs from 'fs';
import * as path from 'path';
import { TemplateRule, TemplateRulesResponse } from '../types/template';
import { getFileById } from './fileUtils';

const UPLOADS_DIR = path.join(__dirname, '../../static/uploads');

/**
 * 保存模板规则
 * @param fileId 文件ID
 * @param rules 模板规则列表
 * @returns 保存是否成功
 */
export function saveTemplateRules(fileId: string, rules: TemplateRule[]): TemplateRulesResponse {
    try {
        // 确保uploads目录存在
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        const filePath = path.join(UPLOADS_DIR, `${fileId}.json`);
        const fileInfo = getFileById(fileId);
        
        let templateRulesData: TemplateRulesResponse;
        let existingData: TemplateRulesResponse | null = null;

        // 检查是否已存在规则文件
        if (fs.existsSync(filePath)) {
            try {
                const existingContent = fs.readFileSync(filePath, 'utf-8');
                existingData = JSON.parse(existingContent);
            } catch (error) {
                console.warn('读取已存在的规则文件失败，将创建新文件:', error);
            }
        }

        // 创建或更新规则数据
        templateRulesData = {
            fileId,
            templateName: fileInfo?.templateName,
            rules,
            createdTime: existingData?.createdTime || new Date().toISOString(),
            updatedTime: new Date().toISOString()
        };

        // 保存到文件
        fs.writeFileSync(filePath, JSON.stringify(templateRulesData, null, 2), 'utf-8');
        
        return templateRulesData;
    } catch (error) {
        console.error('保存模板规则失败:', error);
        throw new Error(`保存模板规则失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
}

/**
 * 根据文件ID获取模板规则
 * @param fileId 文件ID
 * @returns 模板规则数据或null
 */
export function getTemplateRulesByFileId(fileId: string): TemplateRulesResponse | null {
    try {
        const filePath = path.join(UPLOADS_DIR, `${fileId}.json`);
        
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('读取模板规则失败:', error);
        return null;
    }
}

/**
 * 根据模板名称获取模板规则
 * @param templateName 模板名称
 * @returns 模板规则数据或null
 */
export function getTemplateRulesByTemplateName(templateName: string): TemplateRulesResponse | null {
    try {
        // 获取文件信息
        const fileInfo = getFileByTemplateName(templateName);
        if (!fileInfo) {
            return null;
        }

        return getTemplateRulesByFileId(fileInfo.id);
    } catch (error) {
        console.error('根据模板名称获取规则失败:', error);
        return null;
    }
}

/**
 * 根据模板名称获取文件信息
 * @param templateName 模板名称
 * @returns 文件信息或null
 */
function getFileByTemplateName(templateName: string) {
    try {
        const { readFileRecords } = require('./fileUtils');
        const records = readFileRecords();
        return records.find((record: any) => record.templateName === templateName) || null;
    } catch (error) {
        console.error('根据模板名称获取文件信息失败:', error);
        return null;
    }
}

/**
 * 删除模板规则文件
 * @param fileId 文件ID
 * @returns 删除是否成功
 */
export function deleteTemplateRules(fileId: string): boolean {
    try {
        const filePath = path.join(UPLOADS_DIR, `${fileId}.json`);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('删除模板规则失败:', error);
        return false;
    }
}

/**
 * 检查文件ID是否存在
 * @param fileId 文件ID
 * @returns 是否存在
 */
export function fileExists(fileId: string): boolean {
    const fileInfo = getFileById(fileId);
    return fileInfo !== null;
}

/**
 * 获取所有模板规则列表
 * @returns 所有模板规则列表
 */
export function getAllTemplateRules(): TemplateRulesResponse[] {
    try {
        if (!fs.existsSync(UPLOADS_DIR)) {
            return [];
        }

        const files = fs.readdirSync(UPLOADS_DIR);
        const ruleFiles = files.filter(file => file.endsWith('.json') && file !== 'file.json');
        
        const allRules: TemplateRulesResponse[] = [];
        
        for (const ruleFile of ruleFiles) {
            try {
                const filePath = path.join(UPLOADS_DIR, ruleFile);
                const content = fs.readFileSync(filePath, 'utf-8');
                const ruleData = JSON.parse(content);
                allRules.push(ruleData);
            } catch (error) {
                console.warn(`读取规则文件 ${ruleFile} 失败:`, error);
            }
        }
        
        return allRules;
    } catch (error) {
        console.error('获取所有模板规则失败:', error);
        return [];
    }
} 