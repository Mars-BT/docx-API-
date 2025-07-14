import express from 'express';
import cors from 'cors';
import * as path from 'path';
import fileRoutes from './routes/file';
import templatesRoutes from './routes/templates';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件托管
app.use('/static', express.static(path.join(__dirname, '../static')));

// 路由配置
app.use('/api/file', fileRoutes);
app.use('/api/templates', templatesRoutes);

// 前端静态文件托管（编译后的Vue项目）
app.use(express.static(path.join(__dirname, '../dist')));
console.log(path.join(__dirname, '../dist'));

// API文档路径
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'DOCX模板引擎API文档',
        version: '1.0.0',
        endpoints: {
            fileUpload: 'POST /api/file/upload',
            getFilesByCategory: 'GET /api/file/category/:category',
            getFileById: 'GET /api/file/:id',
            getAllFiles: 'GET /api/file/',
            downloadFile: 'GET /api/file/download/:id',
            deleteFile: 'DELETE /api/templates/:fileId',
            setTemplateRules: 'POST /api/templates/setTemplatesRules',
            getTemplateRulesByFileId: 'GET /api/templates/rules/:fileId',
            getTemplateRulesByTemplateName: 'GET /api/templates/rules/template/:templateName',
            getAllTemplateRules: 'GET /api/templates/rules',
            searchTemplateRules: 'GET /api/templates/rules/search',
            buildWord: 'POST /api/templates/build'
        }
    });
});

// 前端路由支持（SPA单页应用）
app.get('*', (req, res) => {
    // 如果请求的是API路径，返回404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API接口不存在'
        });
    }
    
    // 其他所有路径都返回index.html，让前端路由处理
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 错误处理中间件
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('服务器错误:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: '文件大小超过限制（最大100MB）'
        });
    }
    
    if (error.message === '只允许上传DOCX文件') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 DOCX模板引擎服务器启动成功！`);
    console.log(`📊 端口: ${PORT}`);
    console.log(`🌐 前端应用: http://localhost:${PORT}`);
    console.log(`📋 API文档: http://localhost:${PORT}/api`);
    console.log(`📁 静态文件: http://localhost:${PORT}/static`);
    console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
    console.log(`📝 支持的功能:`);
    console.log(`   - 模板文件上传和管理`);
    console.log(`   - 模板规则配置`);
    console.log(`   - Word文档生成`);
    console.log(`   - 完整的前端界面`);
});

export default app; 