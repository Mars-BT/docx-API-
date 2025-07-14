import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { FileInfo, ApiResponse } from '../types/file';
import { 
    addFileRecord, 
    getFileById, 
    getFilesByCategory, 
    getAllFiles,
    getAllCategories,
    isTemplateNameExists 
} from '../utils/fileUtils';

const router = express.Router();

// 配置文件上传存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../static/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 使用随机ID作为文件名
        const fileId = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, `${fileId}${extension}`);
    }
});

// 文件过滤器，只允许docx文件
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        path.extname(file.originalname).toLowerCase() === '.docx') {
        cb(null, true);
    } else {
        cb(new Error('只允许上传DOCX文件'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 限制文件大小为100MB
    }
});

/**
 * POST /api/file/upload
 * 上传DOCX模板文件
 */
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        const { templateName, templateCategory } = req.body;
        const file = req.file;

        // 验证必要参数
        if (!templateName || !templateCategory) {
            return res.status(400).json({
                success: false,
                message: '模板名称和模板分类是必需的'
            } as ApiResponse);
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的DOCX文件'
            } as ApiResponse);
        }

        // 检查模板名称是否重复
        if (isTemplateNameExists(templateName)) {
            // 删除已上传的文件
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: `模板名称 "${templateName}" 已存在，请使用其他名称`
            } as ApiResponse);
        }

        // 提取文件ID（去掉扩展名）
        const fileId = path.basename(file.filename, path.extname(file.filename));

        // 创建文件信息记录
        const fileInfo: FileInfo = {
            id: fileId,
            templateName,
            originalName: file.originalname,
            templateCategory,
            uploadTime: new Date().toISOString(),
            filePath: `uploads/${file.filename}`
        };

        // 保存文件记录
        addFileRecord(fileInfo);

        res.json({
            success: true,
            message: '文件上传成功',
            data: fileInfo
        } as ApiResponse<FileInfo>);

    } catch (error) {
        console.error('文件上传失败:', error);
        
        // 如果有文件上传，删除文件
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (deleteError) {
                console.error('删除文件失败:', deleteError);
            }
        }

        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '文件上传失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/file/categories
 * 获取所有分类列表
 */
router.get('/categories', (req, res) => {
    try {
        const categories = getAllCategories();

        res.json({
            success: true,
            message: '获取分类列表成功',
            data: categories
        } as ApiResponse<{ name: string; count: number }[]>);

    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类列表失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/file/category/:category
 * 根据模板分类获取文件列表
 */
router.get('/category/:category', (req, res) => {
    try {
        const { category } = req.params;
        
        if (!category) {
            return res.status(400).json({
                success: false,
                message: '模板分类参数不能为空'
            } as ApiResponse);
        }

        const files = getFilesByCategory(category);

        res.json({
            success: true,
            message: '获取文件列表成功',
            data: files
        } as ApiResponse<FileInfo[]>);

    } catch (error) {
        console.error('获取文件列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取文件列表失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/file/:id
 * 根据ID获取文件信息
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: '文件ID参数不能为空'
            } as ApiResponse);
        }

        const fileInfo = getFileById(id);

        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                message: '未找到指定的文件'
            } as ApiResponse);
        }

        res.json({
            success: true,
            message: '获取文件信息成功',
            data: fileInfo
        } as ApiResponse<FileInfo>);

    } catch (error) {
        console.error('获取文件信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取文件信息失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/file/
 * 获取所有文件列表
 */
router.get('/', (req, res) => {
    try {
        const files = getAllFiles();

        res.json({
            success: true,
            message: '获取所有文件列表成功',
            data: files
        } as ApiResponse<FileInfo[]>);

    } catch (error) {
        console.error('获取所有文件列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取文件列表失败'
        } as ApiResponse);
    }
});

/**
 * GET /api/file/download/:id
 * 下载文件
 */
router.get('/download/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        const fileInfo = getFileById(id);
        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                message: '未找到指定的文件'
            } as ApiResponse);
        }

        const filePath = path.join(__dirname, '../../static', fileInfo.filePath);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: '文件不存在'
            } as ApiResponse);
        }

        // 设置下载头
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.originalName)}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        // 发送文件
        res.sendFile(filePath);

    } catch (error) {
        console.error('文件下载失败:', error);
        res.status(500).json({
            success: false,
            message: '文件下载失败'
        } as ApiResponse);
    }
});

export default router; 