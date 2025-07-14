<template>
    <div class="templates-test-view">
        <div class="main-container">
            <!-- 顶部模板信息 -->
            <div class="template-header">
                <div class="template-info">
                    <h1 class="title">模板测试</h1>
                    <div class="template-details" v-if="template">
                        <div class="detail-item">
                            <span class="label">模板名称：</span>
                            <span class="value">{{ template.templateName }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">模板分类：</span>
                            <span class="value">{{ template.templateCategory }}</span>
                        </div>
                    </div>
                </div>
                <div class="header-actions">
                    <el-button type="warning" @click="showApiDoc = true">
                        <el-icon><Document /></el-icon>
                        查看API说明
                    </el-button>
                </div>
            </div>

            <!-- 数据加载规则表单 -->
            <div class="form-section">
                <div class="section-header">
                    <h2>数据加载规则配置</h2>
                    <div class="section-description">
                        根据模板规则填写数据源路径，用于生成最终文档
                    </div>
                </div>

                <div class="data-rules-form" v-if="templateRules.length > 0">
                    <div class="rule-form-item" v-for="(rule, index) in dataLoadRules" :key="index">
                        <div class="rule-info">
                            <div class="rule-header">
                                <el-tag :type="getTagType(rule.type)">{{ getTypeText(rule.type) }}</el-tag>
                                <span class="rule-name">{{ rule.varname }}</span>
                            </div>
                            <div class="rule-description">
                                格式化方法：{{ getFormatText(getTemplateRule(rule.varname)?.format || 'original') }}
                            </div>
                        </div>
                        
                        <div class="rule-input">
                            <!-- Excel和JSON类型显示路径输入 -->
                            <div v-if="rule.type === 'excel' || rule.type === 'json'" class="input-group">
                                <label class="input-label">
                                    {{ rule.type === 'excel' ? 'Excel文件路径' : 'JSON文件路径' }}
                                </label>
                                <el-input 
                                    v-model="rule.path" 
                                    :placeholder="rule.type === 'excel' ? '请输入Excel文件的完整路径' : '请输入JSON文件的完整路径'"
                                    clearable
                                >
                                    <template #prepend>
                                        <el-icon><Document /></el-icon>
                                    </template>
                                </el-input>
                            </div>
                            
                            <!-- Direct类型显示值输入 -->
                            <div v-if="rule.type === 'direct'" class="input-group">
                                <label class="input-label">直接赋值</label>
                                <el-input 
                                    v-model="rule.value" 
                                    placeholder="请输入要赋值的内容"
                                    type="textarea"
                                    :rows="2"
                                    clearable
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="empty-rules" v-else>
                    <el-empty description="未找到模板规则，请先设置模板规则">
                        <el-button type="primary" @click="goToSettings">去设置规则</el-button>
                    </el-empty>
                </div>
            </div>

            <!-- 输出配置 -->
            <div class="output-section" v-if="templateRules.length > 0">
                <div class="section-header">
                    <h3>输出设置</h3>
                </div>
                <div class="output-config">
                    <el-form-item label="输出文件路径">
                        <el-input 
                            v-model="outputPath" 
                            placeholder="请输入生成文档的保存路径"
                            clearable
                        >
                            <template #prepend>
                                <el-icon><Folder /></el-icon>
                            </template>
                            <template #append>.docx</template>
                        </el-input>
                    </el-form-item>
                </div>
            </div>

            <!-- 测试按钮 -->
            <div class="footer-actions" v-if="templateRules.length > 0">
                <el-button 
                    type="success" 
                    size="large" 
                    @click="testTemplate" 
                    :loading="testing"
                    :disabled="!canTest"
                >
                    <el-icon><PlayIcon /></el-icon>
                    开始测试生成
                </el-button>
            </div>
        </div>

        <!-- API文档对话框 -->
        <el-dialog 
            v-model="showApiDoc" 
            title="API接口说明文档"
            width="800px"
            :close-on-click-modal="false"
        >
            <div class="api-doc">
                <div class="api-section">
                    <h3 class="section-title">接口概述</h3>
                    <p class="section-desc">
                        使用此API可以通过POST请求生成Word文档。您需要提供模板文件ID、数据规则和输出路径。
                    </p>
                </div>

                <div class="api-section">
                    <h3 class="section-title">请求地址</h3>
                    <div class="code-block">
                        <code>POST http://localhost:3000/api/templates/build</code>
                    </div>
                </div>

                <div class="api-section">
                    <h3 class="section-title">请求头</h3>
                    <div class="code-block">
                        <code>Content-Type: application/json</code>
                    </div>
                </div>

                <div class="api-section">
                    <h3 class="section-title">请求参数</h3>
                    <div class="param-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>参数名</th>
                                    <th>类型</th>
                                    <th>必填</th>
                                    <th>说明</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>fileId</td>
                                    <td>string</td>
                                    <td>是</td>
                                    <td>模板文件ID</td>
                                </tr>
                                <tr>
                                    <td>outputPath</td>
                                    <td>string</td>
                                    <td>是</td>
                                    <td>生成文档的保存路径</td>
                                </tr>
                                <tr>
                                    <td>dataRules</td>
                                    <td>array</td>
                                    <td>是</td>
                                    <td>数据加载规则数组</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="api-section">
                    <h3 class="section-title">数据规则说明 (dataRules)</h3>
                    <p class="section-desc">
                        dataRules数组中的每个对象包含以下字段：
                    </p>
                    <div class="param-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>字段名</th>
                                    <th>类型</th>
                                    <th>必填</th>
                                    <th>说明</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>varname</td>
                                    <td>string</td>
                                    <td>是</td>
                                    <td>变量名（由模板规则决定）</td>
                                </tr>
                                <tr>
                                    <td>type</td>
                                    <td>string</td>
                                    <td>是</td>
                                    <td>数据类型：excel、json、direct</td>
                                </tr>
                                <tr>
                                    <td>path</td>
                                    <td>string</td>
                                    <td>条件</td>
                                    <td>当type为excel或json时必填，文件路径</td>
                                </tr>
                                <tr>
                                    <td>value</td>
                                    <td>string</td>
                                    <td>条件</td>
                                    <td>当type为direct时必填，直接赋值内容</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="api-section">
                    <h3 class="section-title">当前模板示例</h3>
                    <div class="code-block">
                        <pre>{{ generateApiExample() }}</pre>
                    </div>
                </div>

                <div class="api-section">
                    <h3 class="section-title">响应结果</h3>
                    <div class="code-block">
                        <pre>{
  "success": true,
  "message": "Word文档生成成功",
  "data": {
    "fileId": "模板文件ID",
    "templateName": "模板名称",
    "outputPath": "生成文档路径",
    "buildTime": "2024-01-01T12:00:00.000Z",
    "success": true
  }
}</pre>
                    </div>
                </div>
            </div>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showApiDoc = false">关闭</el-button>
                    <el-button type="primary" @click="copyApiExample">复制示例代码</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { useStorageStore } from '../../stores/storage';
import { 
    getFileById, 
    getTemplateRulesByFileId, 
    buildWordDocument, 
    type FileInfo, 
    type TemplateRule, 
    type DataLoadRule, 
    type BuildWordRequest 
} from '../../services/api';
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Folder, VideoPause as PlayIcon } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const storage = useStorageStore();
const router = useRouter();

const template = ref<FileInfo>();
const templateRules = ref<TemplateRule[]>([]);
const dataLoadRules = ref<DataLoadRule[]>([]);
const outputPath = ref('');
const testing = ref(false);
const showApiDoc = ref(false);

onMounted(() => {
    if (!storage.templateId) {
        ElMessage.warning('请先选择模板');
        router.push({ name: 'preview-templates' });
        return;
    }
    
    getTemplate();
    loadTemplateRules();
});

const getTemplate = async () => {
    try {
        const res = await getFileById(storage.templateId);
        template.value = res;
    } catch (error) {
        ElMessage.error('获取模板信息失败');
        console.error(error);
    }
};

const loadTemplateRules = async () => {
    try {
        const res = await getTemplateRulesByFileId(storage.templateId);
        templateRules.value = res.rules || [];
        
        // 初始化数据加载规则
        dataLoadRules.value = templateRules.value.map(rule => ({
            varname: rule.varname,
            type: rule.type,
            path: '',
            value: ''
        }));
        
        // 设置默认输出路径
        if (template.value) {
            outputPath.value = `./generated_${template.value.templateName.replace(/\s+/g, '_')}_${Date.now()}`;
        }
        
    } catch (error) {
        ElMessage.error('获取模板规则失败');
        console.error(error);
    }
};

const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
        excel: 'Excel',
        json: 'JSON',
        direct: '直接赋值'
    };
    return typeMap[type] || type;
};

const getTagType = (type: string) => {
    const tagTypeMap: Record<string, string> = {
        excel: 'success',
        json: 'warning', 
        direct: 'info'
    };
    return tagTypeMap[type] || '';
};

const getFormatText = (format: string) => {
    const formatMap: Record<string, string> = {
        original: '原始值',
        formatToChineseNumber: '转千位符',
        formatToWanYuan: '转成万元',
        formatToFixed2: '保留2位小数'
    };
    return formatMap[format] || format;
};

const getTemplateRule = (varname: string) => {
    return templateRules.value.find(rule => rule.varname === varname);
};

const canTest = computed(() => {
    if (!outputPath.value) return false;
    
    return dataLoadRules.value.every(rule => {
        if (rule.type === 'excel' || rule.type === 'json') {
            return rule.path && rule.path.trim() !== '';
        } else if (rule.type === 'direct') {
            return rule.value && rule.value.trim() !== '';
        }
        return false;
    });
});

const goToSettings = () => {
    storage.setNavigationButton('templates-settings');
    router.push({ name: 'templates-settings' });
};

const testTemplate = async () => {
    if (!canTest.value) {
        ElMessage.warning('请填写完整的配置信息');
        return;
    }
    
    testing.value = true;
    
    try {
        const buildRequest: BuildWordRequest = {
            fileId: storage.templateId,
            outputPath: outputPath.value + '.docx',
            dataRules: dataLoadRules.value.map(rule => ({
                varname: rule.varname,
                type: rule.type,
                ...(rule.type === 'direct' ? { value: rule.value } : { path: rule.path })
            }))
        };
        
        const result = await buildWordDocument(buildRequest);
        
        ElMessage.success(`文档生成成功！输出路径：${result.outputPath}`);
        console.log('构建结果:', result);
        
    } catch (error) {
        ElMessage.error('生成失败：' + (error as Error).message);
        console.error(error);
    } finally {
        testing.value = false;
    }
};

// 生成API示例代码
const generateApiExample = () => {
    if (!template.value || templateRules.value.length === 0) {
        return '// 请先加载模板规则';
    }

    const exampleData = {
        fileId: storage.templateId,
        outputPath: "./generated_document.docx",
        dataRules: templateRules.value.map(rule => {
            if (rule.type === 'excel') {
                return {
                    varname: rule.varname,
                    type: rule.type,
                    path: "C:/path/to/your/excel/file.xlsx"
                };
            } else if (rule.type === 'json') {
                return {
                    varname: rule.varname,
                    type: rule.type,
                    path: "C:/path/to/your/json/file.json"
                };
            } else if (rule.type === 'direct') {
                return {
                    varname: rule.varname,
                    type: rule.type,
                    value: "这是直接赋值的内容"
                };
            }
            return {
                varname: rule.varname,
                type: rule.type
            };
        })
    };

    return JSON.stringify(exampleData, null, 2);
};

// 复制API示例代码
const copyApiExample = async () => {
    try {
        const exampleCode = generateApiExample();
        await navigator.clipboard.writeText(exampleCode);
        ElMessage.success('示例代码已复制到剪贴板');
    } catch (error) {
        ElMessage.error('复制失败，请手动复制');
        console.error(error);
    }
};
</script>

<style scoped lang="scss">
.templates-test-view {
    width: 100%;
    min-height: 100vh;
    background-color: #f0f0f0;
    padding: 20px;
    box-sizing: border-box;

    .main-container {
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        min-height: calc(100vh - 40px);
        display: flex;
        flex-direction: column;
    }

    .template-header {
        padding: 24px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .template-info {
            flex: 1;
        }

        .title {
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 600;
        }

        .template-details {
            display: flex;
            gap: 32px;
            flex-wrap: wrap;

            .detail-item {
                display: flex;
                gap: 8px;

                .label {
                    opacity: 0.8;
                }

                .value {
                    font-weight: 500;
                }
            }
        }

        .header-actions {
            margin-left: 20px;
        }
    }

    .form-section, .output-section {
        flex: 1;
        padding: 24px;

        .section-header {
            margin-bottom: 24px;

            h2, h3 {
                margin: 0 0 8px 0;
                color: #1f2937;
                font-size: 20px;
                font-weight: 600;
            }

            .section-description {
                color: #6b7280;
                font-size: 14px;
            }
        }
    }

    .data-rules-form {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .rule-form-item {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background: #f9fafb;
            display: flex;
            gap: 20px;
            align-items: flex-start;

            .rule-info {
                min-width: 250px;

                .rule-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;

                    .rule-name {
                        font-weight: 600;
                        color: #1f2937;
                    }
                }

                .rule-description {
                    font-size: 14px;
                    color: #6b7280;
                }
            }

            .rule-input {
                flex: 1;

                .input-group {
                    .input-label {
                        display: block;
                        margin-bottom: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        color: #374151;
                    }
                }
            }
        }
    }

    .output-config {
        max-width: 600px;
    }

    .empty-rules {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
    }

    .footer-actions {
        padding: 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: center;
        background: #f9fafb;
    }
}

:deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
}

// API文档对话框样式
.api-doc {
    .api-section {
        margin-bottom: 24px;

        .section-title {
            color: #1f2937;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px 0;
        }

        .section-desc {
            color: #6b7280;
            margin: 0 0 12px 0;
            line-height: 1.5;
        }

        .code-block {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            margin: 8px 0;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            overflow-x: auto;

            code {
                color: #059669;
                font-weight: 500;
            }

            pre {
                margin: 0;
                white-space: pre-wrap;
                color: #374151;
            }
        }

        .param-table {
            margin: 12px 0;

            table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                overflow: hidden;

                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }

                th {
                    background: #f9fafb;
                    font-weight: 600;
                    color: #374151;
                }

                td {
                    color: #6b7280;
                }

                tr:last-child td {
                    border-bottom: none;
                }
            }
        }
    }
}

:deep(.el-dialog__header) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 20px 24px;

    .el-dialog__title {
        color: white;
        font-weight: 600;
    }

    .el-dialog__headerbtn {
        .el-dialog__close {
            color: white;
        }
    }
}
</style>