import express from 'express';
import * as path from 'path';
import { ApiResponse } from '../types/file';
import { TemplateRule, TemplateRulesResponse, BuildWordRequest, BuildWordResponse, DataLoadRule } from '../types/template';
import { 
    saveTemplateRules, 
    getTemplateRulesByFileId, 
    getTemplateRulesByTemplateName,
    fileExists,
    getAllTemplateRules 
} from '../utils/templateUtils';
import { getFileById, deleteFileCompletely } from '../utils/fileUtils';

const router = express.Router();

/**
 * POST /api/templates/setTemplatesRules
 * 设置模板规则
 */
router.post('/setTemplatesRules', (req, res) => {
    try {
        const { fileId, rules } = req.body;

        // 验证必要参数
        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: '文件ID是必需的'
            } as ApiResponse);
        }

        if (!rules || !Array.isArray(rules)) {
            return res.status(400).json({
                success: false,
                message: '规则列表是必需的，且必须是数组格式'
            } as ApiResponse);
        }

        // 检查文件是否存在
        if (!fileExists(fileId)) {
            return res.status(404).json({
                success: false,
                message: '指定的文件ID不存在'
            } as ApiResponse);
        }

        // 验证规则格式
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            if (!rule.varname || !rule.type || !rule.format) {
                return res.status(400).json({
                    success: false,
                    message: `规则 ${i + 1} 格式错误：varname、type和format是必需的字段`
                } as ApiResponse);
            }

            if (!['excel', 'json', 'direct'].includes(rule.type)) {
                return res.status(400).json({
                    success: false,
                    message: `规则 ${i + 1} 类型错误：type必须是 excel、json 或 direct`
                } as ApiResponse);
            }
        }

        // 保存模板规则
        const savedRules = saveTemplateRules(fileId, rules);

        res.json({
            success: true,
            message: '模板规则设置成功',
            data: savedRules
        } as ApiResponse<TemplateRulesResponse>);

    } catch (error) {
        console.error('设置模板规则失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '设置模板规则失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/templates/rules/:fileId
 * 根据文件ID获取模板规则
 */
router.get('/rules/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: '文件ID参数不能为空'
            } as ApiResponse);
        }

        const templateRules = getTemplateRulesByFileId(fileId);

        if (!templateRules) {
            return res.status(404).json({
                success: false,
                message: '未找到该文件的模板规则'
            } as ApiResponse);
        }

        res.json({
            success: true,
            message: '获取模板规则成功',
            data: templateRules
        } as ApiResponse<TemplateRulesResponse>);

    } catch (error) {
        console.error('获取模板规则失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模板规则失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/templates/rules/template/:templateName
 * 根据模板名称获取模板规则
 */
router.get('/rules/template/:templateName', (req, res) => {
    try {
        const { templateName } = req.params;

        if (!templateName) {
            return res.status(400).json({
                success: false,
                message: '模板名称参数不能为空'
            } as ApiResponse);
        }

        const templateRules = getTemplateRulesByTemplateName(decodeURIComponent(templateName));

        if (!templateRules) {
            return res.status(404).json({
                success: false,
                message: '未找到该模板的规则'
            } as ApiResponse);
        }

        res.json({
            success: true,
            message: '获取模板规则成功',
            data: templateRules
        } as ApiResponse<TemplateRulesResponse>);

    } catch (error) {
        console.error('根据模板名称获取规则失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模板规则失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/templates/rules
 * 获取所有模板规则列表
 */
router.get('/rules', (req, res) => {
    try {
        const allRules = getAllTemplateRules();

        res.json({
            success: true,
            message: '获取所有模板规则成功',
            data: allRules
        } as ApiResponse<TemplateRulesResponse[]>);

    } catch (error) {
        console.error('获取所有模板规则失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模板规则失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/templates/rules/search
 * 根据查询参数获取模板规则（支持文件ID或模板名称）
 */
router.get('/rules/search', (req, res) => {
    try {
        const { fileId, templateName } = req.query;

        if (!fileId && !templateName) {
            return res.status(400).json({
                success: false,
                message: '请提供文件ID或模板名称作为查询参数'
            } as ApiResponse);
        }

        let templateRules: TemplateRulesResponse | null = null;

        if (fileId) {
            templateRules = getTemplateRulesByFileId(fileId as string);
        } else if (templateName) {
            templateRules = getTemplateRulesByTemplateName(templateName as string);
        }

        if (!templateRules) {
            return res.status(404).json({
                success: false,
                message: '未找到相应的模板规则'
            } as ApiResponse);
        }

        res.json({
            success: true,
            message: '获取模板规则成功',
            data: templateRules
        } as ApiResponse<TemplateRulesResponse>);

    } catch (error) {
        console.error('搜索模板规则失败:', error);
        res.status(500).json({
            success: false,
            message: '搜索模板规则失败'
        } as ApiResponse);
    }
});

/**
 * POST /api/templates/build
 * 构建Word文档
 */
router.post('/build', (req, res) => {
    try {
        const { fileId, outputPath, dataRules }: BuildWordRequest = req.body;

        // 验证必要参数
        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: '文件ID是必需的'
            } as ApiResponse);
        }

        if (!outputPath) {
            return res.status(400).json({
                success: false,
                message: '输出路径是必需的'
            } as ApiResponse);
        }

        if (!dataRules || !Array.isArray(dataRules)) {
            return res.status(400).json({
                success: false,
                message: '数据规则是必需的，且必须是数组格式'
            } as ApiResponse);
        }

        // 检查文件是否存在
        const fileInfo = getFileById(fileId);
        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                message: '指定的文件ID不存在'
            } as ApiResponse);
        }

        // 获取模板规则
        const templateRules = getTemplateRulesByFileId(fileId);
        if (!templateRules) {
            return res.status(404).json({
                success: false,
                message: '未找到该文件的模板规则，请先设置模板规则'
            } as ApiResponse);
        }

        // 构建模板文件的完整路径
        const templateFilePath = path.join(__dirname, '../../static', fileInfo.filePath);
        
        // 验证数据规则格式
        for (let i = 0; i < dataRules.length; i++) {
            const rule = dataRules[i];
            if (!rule.varname || !rule.type) {
                return res.status(400).json({
                    success: false,
                    message: `数据规则 ${i + 1} 格式错误：varname和type是必需的字段`
                } as ApiResponse);
            }

            if (!['excel', 'json', 'direct'].includes(rule.type)) {
                return res.status(400).json({
                    success: false,
                    message: `数据规则 ${i + 1} 类型错误：type必须是 excel、json 或 direct`
                } as ApiResponse);
            }

            // 根据类型验证必要字段
            if (rule.type === 'direct' && !rule.value) {
                return res.status(400).json({
                    success: false,
                    message: `数据规则 ${i + 1} 错误：direct类型需要value字段`
                } as ApiResponse);
            }

            if ((rule.type === 'excel' || rule.type === 'json') && !rule.path) {
                return res.status(400).json({
                    success: false,
                    message: `数据规则 ${i + 1} 错误：${rule.type}类型需要path字段`
                } as ApiResponse);
            }
        }

        // 创建DocxTemplateEngine实例
        // 注意：这里需要动态导入，因为DocxTemplateEngine在项目根目录
        const createEngine = () => {
            // 这是一个临时解决方案，实际使用时需要调整导入路径
            // 或者将DocxTemplateEngine复制到server项目中
            const { DocxTemplateEngine } = require('../../../src/DocxTemplateEngine');
            return new DocxTemplateEngine(templateFilePath, outputPath);
        };

        const engine = createEngine();

        // 设置模板规则
        engine.setTemplatesRules(templateRules.rules);

        // 加载数据
        engine.loadDataByRule(dataRules);

        // 生成Word文档
        engine.buildWord();

        // 构建响应
        const buildResponse: BuildWordResponse = {
            fileId,
            templateName: fileInfo.templateName,
            outputPath,
            buildTime: new Date().toISOString(),
            success: true
        };

        res.json({
            success: true,
            message: 'Word文档生成成功',
            data: buildResponse
        } as ApiResponse<BuildWordResponse>);

    } catch (error) {
        console.error('构建Word文档失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '构建Word文档失败'
        } as ApiResponse);
    }
})

/**
 * DELETE /api/templates/:fileId
 * 删除模板文件（包括文件记录、物理文件和模板规则）
 */
router.delete('/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: '文件ID参数不能为空'
            } as ApiResponse);
        }

        // 执行完全删除
        const deleteResult = deleteFileCompletely(fileId);

        if (deleteResult.success) {
            res.json({
                success: true,
                message: deleteResult.message,
                data: {
                    fileId,
                    deletedAt: new Date().toISOString(),
                    details: deleteResult.details
                }
            } as ApiResponse);
        } else {
            res.status(400).json({
                success: false,
                message: deleteResult.message,
                data: deleteResult.details
            } as ApiResponse);
        }

    } catch (error) {
        console.error('删除模板文件失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '删除模板文件失败'
        } as ApiResponse);
    }
});

export default router; 