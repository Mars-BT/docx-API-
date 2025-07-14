import * as fs from 'fs';
import * as path from 'path';
import { FileInfo } from '../types/file';

const FILE_JSON_PATH = path.join(__dirname, '../../static/file.json');

/**
 * 读取文件记录
 */
export function readFileRecords(): FileInfo[] {
    try {
        if (!fs.existsSync(FILE_JSON_PATH)) {
            return [];
        }
        const data = fs.readFileSync(FILE_JSON_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取文件记录失败:', error);
        return [];
    }
}

/**
 * 保存文件记录
 */
export function saveFileRecords(records: FileInfo[]): boolean {
    try {
        // 确保目录存在
        const dir = path.dirname(FILE_JSON_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(FILE_JSON_PATH, JSON.stringify(records, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('保存文件记录失败:', error);
        return false;
    }
}

/**
 * 添加文件记录
 */
export function addFileRecord(fileInfo: FileInfo): boolean {
    try {
        const records = readFileRecords();
        
        // 检查模板名称是否重复
        const existingRecord = records.find(record => record.templateName === fileInfo.templateName);
        if (existingRecord) {
            throw new Error(`模板名称 "${fileInfo.templateName}" 已存在`);
        }
        
        records.push(fileInfo);
        return saveFileRecords(records);
    } catch (error) {
        console.error('添加文件记录失败:', error);
        throw error;
    }
}

/**
 * 根据ID获取文件信息
 */
export function getFileById(id: string): FileInfo | null {
    const records = readFileRecords();
    return records.find(record => record.id === id) || null;
}

/**
 * 根据模板分类获取文件列表
 */
export function getFilesByCategory(category: string): FileInfo[] {
    const records = readFileRecords();
    return records.filter(record => record.templateCategory === category);
}

/**
 * 获取所有文件记录
 */
export function getAllFiles(): FileInfo[] {
    return readFileRecords();
}

/**
 * 检查模板名称是否已存在
 */
export function isTemplateNameExists(templateName: string): boolean {
    const records = readFileRecords();
    return records.some(record => record.templateName === templateName);
}

/**
 * 获取所有分类列表（包含每个分类的文件数量）
 * 按照每个分类中最旧文件的创建时间排序
 */
export function getAllCategories(): { name: string; count: number }[] {
    try {
        const records = readFileRecords();
        const categoryMap = new Map<string, { count: number; oldestTime: string }>();
        
        // 统计每个分类的文件数量和最旧的文件时间
        records.forEach(record => {
            const category = record.templateCategory;
            const uploadTime = record.uploadTime;
            
            if (categoryMap.has(category)) {
                const existing = categoryMap.get(category)!;
                categoryMap.set(category, {
                    count: existing.count + 1,
                    oldestTime: uploadTime < existing.oldestTime ? uploadTime : existing.oldestTime
                });
            } else {
                categoryMap.set(category, {
                    count: 1,
                    oldestTime: uploadTime
                });
            }
        });
        
        // 转换为数组并按最旧文件时间排序（最旧的在前面）
        return Array.from(categoryMap.entries())
            .map(([name, data]) => ({ name, count: data.count, oldestTime: data.oldestTime }))
            .sort((a, b) => new Date(a.oldestTime).getTime() - new Date(b.oldestTime).getTime())
            .map(({ name, count }) => ({ name, count })); // 最终只返回name和count
    } catch (error) {
        console.error('获取分类列表失败:', error);
        return [];
    }
}

/**
 * 删除文件记录
 */
export function deleteFileRecord(id: string): boolean {
    try {
        const records = readFileRecords();
        const updatedRecords = records.filter(record => record.id !== id);
        
        if (records.length === updatedRecords.length) {
            return false; // 没有找到要删除的记录
        }
        
        return saveFileRecords(updatedRecords);
    } catch (error) {
        console.error('删除文件记录失败:', error);
        return false;
    }
}

/**
 * 删除物理文件
 * @param filePath 文件路径（相对于static目录）
 * @returns 删除是否成功
 */
export function deletePhysicalFile(filePath: string): boolean {
    try {
        const fullPath = path.join(__dirname, '../../static', filePath);
        
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            return true;
        }
        
        return false; // 文件不存在
    } catch (error) {
        console.error('删除物理文件失败:', error);
        return false;
    }
}

/**
 * 完全删除文件（包括记录、物理文件和模板规则）
 * @param id 文件ID
 * @returns 删除结果
 */
export function deleteFileCompletely(id: string): { success: boolean; message: string; details: { recordDeleted: boolean; fileDeleted: boolean; rulesDeleted: boolean } } {
    const details = {
        recordDeleted: false,
        fileDeleted: false,
        rulesDeleted: false
    };

    try {
        // 1. 获取文件信息
        const fileInfo = getFileById(id);
        if (!fileInfo) {
            return {
                success: false,
                message: '文件不存在',
                details
            };
        }

        // 2. 删除文件记录
        details.recordDeleted = deleteFileRecord(id);

        // 3. 删除物理文件
        details.fileDeleted = deletePhysicalFile(fileInfo.filePath);

        // 4. 删除模板规则文件
        try {
            const { deleteTemplateRules } = require('./templateUtils');
            details.rulesDeleted = deleteTemplateRules(id);
        } catch (error) {
            console.warn('删除模板规则时出错:', error);
            details.rulesDeleted = false;
        }

        const allSuccess = details.recordDeleted && details.fileDeleted;
        
        return {
            success: allSuccess,
            message: allSuccess ? '文件删除成功' : '文件删除部分失败',
            details
        };

    } catch (error) {
        console.error('完全删除文件失败:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : '删除文件失败',
            details
        };
    }
} 