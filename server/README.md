# DOCX模板引擎服务器

基于Node.js + TypeScript + Express的DOCX模板文件管理服务器。

## 项目结构

```
server/
├── src/
│   ├── types/
│   │   └── file.ts          # 类型定义
│   ├── utils/
│   │   └── fileUtils.ts     # 文件工具函数
│   ├── routes/
│   │   └── file.ts          # 文件路由
│   └── app.ts               # 主服务器文件
├── static/
│   ├── uploads/             # 上传文件存储目录
│   └── file.json            # 文件信息记录
├── package.json
├── tsconfig.json
└── README.md
```

## 安装和运行

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 开发模式运行
```bash
npm run dev
```

### 3. 编译和生产运行
```bash
npm run build
npm start
```

## API接口

### 基础信息
- **服务器地址**: `http://localhost:3000`
- **API前缀**: `/api/file`

### 接口列表

#### 1. 文件上传
- **URL**: `POST /api/file/upload`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `file`: DOCX文件
  - `templateName`: 模板名称（必需，不可重复）
  - `templateCategory`: 模板分类（必需）

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/file/upload \
  -F "file=@template.docx" \
  -F "templateName=销售报表模板" \
  -F "templateCategory=财务报表"
```

**响应示例**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "id": "abc123-def456-ghi789",
    "templateName": "销售报表模板",
    "originalName": "template.docx",
    "templateCategory": "财务报表",
    "uploadTime": "2024-01-01T12:00:00.000Z",
    "filePath": "uploads/abc123-def456-ghi789.docx"
  }
}
```

#### 2. 获取所有分类列表
- **URL**: `GET /api/file/categories`

**请求示例**:
```bash
curl http://localhost:3000/api/file/categories
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取分类列表成功",
  "data": [
    {
      "name": "财务报表",
      "count": 5
    },
    {
      "name": "运输部",
      "count": 3
    }
  ]
}
```

#### 3. 根据分类获取文件列表
- **URL**: `GET /api/file/category/:category`

**请求示例**:
```bash
curl http://localhost:3000/api/file/category/财务报表
```

#### 4. 根据ID获取文件信息
- **URL**: `GET /api/file/:id`

**请求示例**:
```bash
curl http://localhost:3000/api/file/abc123-def456-ghi789
```

#### 5. 获取所有文件列表
- **URL**: `GET /api/file/`

**请求示例**:
```bash
curl http://localhost:3000/api/file/
```

#### 6. 文件下载
- **URL**: `GET /api/file/download/:id`

**请求示例**:
```bash
curl -O -J http://localhost:3000/api/file/download/abc123-def456-ghi789
```

#### 7. 健康检查
- **URL**: `GET /health`

### 模板规则管理 API

#### 8. 设置模板规则
- **URL**: `POST /api/templates/setTemplatesRules`
- **Content-Type**: `application/json`
- **参数**:
  - `fileId`: 文件ID（必需）
  - `rules`: 规则列表（必需）

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/templates/setTemplatesRules \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "abc123-def456-ghi789",
    "rules": [
      {
        "varname": "计划比",
        "type": "excel",
        "rules": {
          "sheetname": "与计划比",
          "vOrW": true
        },
        "format": "formatToChineseNumber"
      }
    ]
  }'
```

#### 9. 根据文件ID获取模板规则
- **URL**: `GET /api/templates/rules/:fileId`

**请求示例**:
```bash
curl http://localhost:3000/api/templates/rules/abc123-def456-ghi789
```

#### 10. 根据模板名称获取模板规则
- **URL**: `GET /api/templates/rules/template/:templateName`

**请求示例**:
```bash
curl http://localhost:3000/api/templates/rules/template/销售报表模板
```

#### 11. 获取所有模板规则
- **URL**: `GET /api/templates/rules`

**请求示例**:
```bash
curl http://localhost:3000/api/templates/rules
```

#### 12. 搜索模板规则
- **URL**: `GET /api/templates/rules/search?fileId=xxx&templateName=xxx`

**请求示例**:
```bash
curl "http://localhost:3000/api/templates/rules/search?fileId=abc123-def456-ghi789"
curl "http://localhost:3000/api/templates/rules/search?templateName=销售报表模板"
```

#### 13. 构建Word文档
- **URL**: `POST /api/templates/build`
- **Content-Type**: `application/json`
- **参数**:
  - `fileId`: 文件ID（必需）
  - `outputPath`: 生成文件路径（必需）
  - `dataRules`: 数据加载规则列表（必需）

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/templates/build \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "abc123-def456-ghi789",
    "outputPath": "./generated/report.docx",
    "dataRules": [
      {
        "varname": "计划比",
        "type": "excel",
        "path": "/path/to/excel/file.xlsx"
      },
      {
        "varname": "数据A",
        "type": "json",
        "path": "/path/to/data.json"
      },
      {
        "varname": "直接数据",
        "type": "direct",
        "value": "这是直接赋值的数据"
      }
    ]
  }'
```

**响应示例**:
```json
{
  "success": true,
  "message": "Word文档生成成功",
  "data": {
    "fileId": "abc123-def456-ghi789",
    "templateName": "销售报表模板",
    "outputPath": "./generated/report.docx",
    "buildTime": "2024-01-01T12:00:00.000Z",
    "success": true
  }
}
```

## 数据存储

### 文件信息存储
文件信息存储在 `static/file.json` 中，格式如下：

```json
[
  {
    "id": "abc123-def456-ghi789",
    "templateName": "销售报表模板",
    "originalName": "template.docx",
    "templateCategory": "财务报表",
    "uploadTime": "2024-01-01T12:00:00.000Z",
    "filePath": "uploads/abc123-def456-ghi789.docx"
  }
]
```

### 模板规则存储
模板规则存储在 `static/uploads/{fileId}.json` 中，格式如下：

```json
{
  "fileId": "abc123-def456-ghi789",
  "templateName": "销售报表模板",
  "rules": [
    {
      "varname": "计划比",
      "type": "excel",
      "rules": {
        "sheetname": "与计划比",
        "vOrW": true
      },
      "format": "formatToChineseNumber"
    },
    {
      "varname": "数据A",
      "type": "json",
      "rules": {
        "path": "数据[0].数据A"
      },
      "format": "original"
    },
    {
      "varname": "直接数据",
      "type": "direct",
      "format": "original"
    }
  ],
  "createdTime": "2024-01-01T12:00:00.000Z",
  "updatedTime": "2024-01-01T12:30:00.000Z"
}
```

## 错误处理

### 常见错误码
- `400`: 请求参数错误
- `404`: 文件不存在
- `500`: 服务器内部错误

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述"
}
```

## 开发说明

### 环境要求
- Node.js >= 16.0.0
- TypeScript >= 5.0.0

### 开发工具
- 推荐使用 VSCode + TypeScript 插件
- 支持热重载开发模式

### 扩展功能
- 可以通过修改 `src/routes/file.ts` 添加新的API接口
- 可以通过修改 `src/utils/fileUtils.ts` 扩展文件管理功能
- 支持添加其他类型的文件上传（修改文件过滤器） 