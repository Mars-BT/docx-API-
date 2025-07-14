<template>
    <div class="templates-settings-view">
        <div class="main-container">
            <!-- 顶部模板信息 -->
            <div class="template-header">
                <div class="template-info">
                    <h1 class="title">模板变量规则配置</h1>
                    <div class="template-details" v-if="template">
                        <div class="detail-item">
                            <span class="label">模板名称：</span>
                            <span class="value">{{ template.templateName }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">模板分类：</span>
                            <span class="value">{{ template.templateCategory }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">上传时间：</span>
                            <span class="value">{{ formatTime(template.uploadTime) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 规则列表 -->
            <div class="rules-section">
                <div class="section-header">
                    <h2>已配置规则</h2>
                    <el-button type="primary" @click="showAddDialog = true">
                        <el-icon><Plus /></el-icon>
                        添加新规则
                    </el-button>
                </div>

                <div class="rules-list" v-if="rules.length > 0">
                    <div class="rule-item" v-for="(rule, index) in rules" :key="index">
                        <div class="rule-header">
                            <div class="rule-name">
                                <el-tag>{{ getTypeText(rule.type) }}</el-tag>
                                <span class="rule-type">{{ rule.varname }}</span>
                            </div>
                            <div class="rule-actions">
                                <el-button @click="editRule(index)">编辑</el-button>
                                <el-button @click="deleteRule(index)" style="color: #f56c6c;">删除</el-button>
                            </div>
                        </div>
                        <div class="rule-details">
                            <div class="detail-row">
                                <span class="label">格式化方法：</span>
                                <span class="value">{{ getFormatText(rule.format) }}</span>
                            </div>
                            <div class="detail-row" v-if="rule.type === 'excel' && rule.rules">
                                <span class="label">工作表名：</span>
                                <span class="value">{{ rule.rules.sheetname }}</span>
                            </div>
                            <div class="detail-row" v-if="rule.type === 'excel' && rule.rules">
                                <span class="label">输出类型：</span>
                                <span class="value">{{ rule.rules.vOrW ? '格式化后的值' : '原始值' }}</span>
                            </div>
                            <div class="detail-row" v-if="rule.type === 'json' && rule.rules">
                                <span class="label">JSON路径：</span>
                                <span class="value">{{ rule.rules.path }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="empty-rules" v-else>
                    <el-empty description="暂无配置规则">
                        <el-button type="primary" @click="showAddDialog = true">添加第一个规则</el-button>
                    </el-empty>
                </div>
            </div>

            <!-- 保存按钮 -->
            <div class="footer-actions" v-if="rules.length > 0">
                <el-button type="success" size="large" @click="saveRules" :loading="saving">
                    <el-icon><Check /></el-icon>
                    保存所有规则
                </el-button>
            </div>
        </div>

        <!-- 添加/编辑规则对话框 -->
        <el-dialog 
            v-model="showAddDialog" 
            :title="editingIndex === -1 ? '添加新规则' : '编辑规则'"
            width="600px"
            @close="resetForm"
        >
            <el-form :model="currentRule" :rules="formRules" ref="ruleFormRef" label-width="120px">
                <el-form-item label="变量名" prop="varname">
                    <el-input 
                        v-model="currentRule.varname" 
                        placeholder="请输入变量名（不可重复）"
                        :disabled="editingIndex !== -1"
                    />
                </el-form-item>

                <el-form-item label="数据类型" prop="type">
                    <el-select v-model="currentRule.type" placeholder="请选择数据类型" @change="onTypeChange">
                        <el-option label="Excel数据" value="excel"></el-option>
                        <el-option label="JSON数据" value="json"></el-option>
                        <el-option label="直接赋值" value="direct"></el-option>
                    </el-select>
                </el-form-item>

                <!-- Excel类型特有字段 -->
                <template v-if="currentRule.type === 'excel'">
                    <el-form-item label="工作表名" prop="sheetname">
                        <el-input v-model="currentRule.sheetname" placeholder="请输入Excel工作表名称" />
                    </el-form-item>
                    <el-form-item label="输出类型" prop="vOrW">
                        <el-radio-group v-model="currentRule.vOrW">
                            <el-radio :value="true">格式化后的值</el-radio>
                            <el-radio :value="false">原始值</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </template>

                <!-- JSON类型特有字段 -->
                <template v-if="currentRule.type === 'json'">
                    <el-form-item label="JSON路径" prop="path">
                        <el-input 
                            v-model="currentRule.path" 
                            placeholder="例如：数据[0].数据A"
                            type="textarea"
                            :rows="2"
                        />
                    </el-form-item>
                </template>

                <el-form-item label="格式化方法" prop="format">
                    <el-select v-model="currentRule.format" placeholder="请选择格式化方法">
                        <el-option label="原始值" value="original"></el-option>
                        <el-option label="转千位符" value="formatToChineseNumber"></el-option>
                        <el-option label="转成万元" value="formatToWanYuan"></el-option>
                        <el-option label="保留2位小数" value="formatToFixed2"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showAddDialog = false">取消</el-button>
                    <el-button type="primary" @click="saveRule">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { useStorageStore } from '../../stores/storage';
import { getFileById, setTemplateRules, getTemplateRulesByFileId, type FileInfo, type TemplateRule } from '../../services/api';
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Check } from '@element-plus/icons-vue';

const storage = useStorageStore();

const template = ref<FileInfo>();
const rules = ref<TemplateRule[]>([]);
const showAddDialog = ref(false);
const editingIndex = ref(-1);
const saving = ref(false);

// 当前编辑的规则
const currentRule = reactive({
    varname: '',
    type: 'excel' as 'excel' | 'json' | 'direct',
    sheetname: '',
    vOrW: true,
    path: '',
    format: 'original' as 'formatToChineseNumber' | 'original' | 'formatToWanYuan' | 'formatToFixed2'
});

// 表单验证规则
const formRules = {
    varname: [
        { required: true, message: '请输入变量名', trigger: 'blur' },
        { validator: checkVarnameUnique, trigger: 'blur' }
    ],
    type: [
        { required: true, message: '请选择数据类型', trigger: 'change' }
    ],
    sheetname: [
        { required: true, message: '请输入工作表名', trigger: 'blur' }
    ],
    path: [
        { required: true, message: '请输入JSON路径', trigger: 'blur' }
    ],
    format: [
        { required: true, message: '请选择格式化方法', trigger: 'change' }
    ]
};

const ruleFormRef = ref();

// 检查变量名唯一性
function checkVarnameUnique(rule: any, value: string, callback: Function) {
    if (!value) {
        callback();
        return;
    }
    
    const existingIndex = rules.value.findIndex((r, index) => 
        r.varname === value && index !== editingIndex.value
    );
    
    if (existingIndex !== -1) {
        callback(new Error('变量名已存在，请使用其他名称'));
    } else {
        callback();
    }
}

onMounted(() => {
    getTemplate();
    loadExistingRules();
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

const loadExistingRules = async () => {
    try {
        const res = await getTemplateRulesByFileId(storage.templateId);
        rules.value = res.rules || [];
    } catch (error) {
        // 如果没有找到规则，说明是第一次配置，不需要报错
        console.log('暂无已配置的规则');
        rules.value = [];
    }
};

const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleDateString('zh-CN');
};

const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
        excel: 'Excel数据',
        json: 'JSON数据',
        direct: '直接赋值'
    };
    return typeMap[type] || type;
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

const onTypeChange = () => {
    // 当类型改变时，重置相关字段
    currentRule.sheetname = '';
    currentRule.vOrW = true;
    currentRule.path = '';
};

const resetForm = () => {
    currentRule.varname = '';
    currentRule.type = 'excel';
    currentRule.sheetname = '';
    currentRule.vOrW = true;
    currentRule.path = '';
    currentRule.format = 'original';
    editingIndex.value = -1;
    
    if (ruleFormRef.value) {
        ruleFormRef.value.clearValidate();
    }
};

const editRule = (index: number) => {
    const rule = rules.value[index];
    editingIndex.value = index;
    
    currentRule.varname = rule.varname;
    currentRule.type = rule.type;
    currentRule.format = rule.format;
    
    if (rule.type === 'excel' && rule.rules) {
        currentRule.sheetname = rule.rules.sheetname || '';
        currentRule.vOrW = rule.rules.vOrW !== undefined ? rule.rules.vOrW : true;
    }
    
    if (rule.type === 'json' && rule.rules) {
        currentRule.path = rule.rules.path || '';
    }
    
    showAddDialog.value = true;
};

const deleteRule = async (index: number) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除变量"${rules.value[index].varname}"的规则吗？`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );
        
        rules.value.splice(index, 1);
        ElMessage.success('删除成功');
    } catch {
        // 用户取消删除
    }
};

const saveRule = async () => {
    if (!ruleFormRef.value) return;
    
    try {
        await ruleFormRef.value.validate();
        
        const newRule: TemplateRule = {
            varname: currentRule.varname,
            type: currentRule.type,
            format: currentRule.format
        };
        
        // 根据类型添加特有字段
        if (currentRule.type === 'excel') {
            newRule.rules = {
                sheetname: currentRule.sheetname,
                vOrW: currentRule.vOrW
            };
        } else if (currentRule.type === 'json') {
            newRule.rules = {
                path: currentRule.path
            };
        }
        
        if (editingIndex.value === -1) {
            // 添加新规则
            rules.value.push(newRule);
        } else {
            // 编辑现有规则
            rules.value[editingIndex.value] = newRule;
        }
        
        showAddDialog.value = false;
        resetForm();
        ElMessage.success(editingIndex.value === -1 ? '添加成功' : '修改成功');
    } catch (error) {
        console.error('表单验证失败:', error);
    }
};

const saveRules = async () => {
    if (rules.value.length === 0) {
        ElMessage.warning('请至少添加一个规则');
        return;
    }
    
    saving.value = true;
    try {
        await setTemplateRules(storage.templateId, rules.value);
        ElMessage.success('保存成功！');
    } catch (error) {
        ElMessage.error('保存失败：' + (error as Error).message);
        console.error(error);
    } finally {
        saving.value = false;
    }
};
</script>

<style scoped lang="scss">
.templates-settings-view {
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

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
    }

    .rules-section {
        flex: 1;
        padding: 24px;

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;

            h2 {
                margin: 0;
                color: #1f2937;
                font-size: 20px;
                font-weight: 600;
            }
        }

        .rules-list {
            display: flex;
            flex-direction: column;
            gap: 16px;

            .rule-item {
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                background: #f9fafb;
                transition: all 0.2s ease;

                &:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    border-color: #d1d5db;
                }

                .rule-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;

                    .rule-name {
                        display: flex;
                        align-items: center;
                        gap: 12px;

                        .rule-type {
                            color: red;
                            font-size: 14px;
                            font-weight: 500;
                        }
                    }

                    .rule-actions {
                        display: flex;
                        gap: 8px;
                    }
                }

                .rule-details {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;

                    .detail-row {
                        display: flex;
                        gap: 8px;
                        font-size: 14px;

                        .label {
                            color: #6b7280;
                            min-width: 100px;
                        }

                        .value {
                            color: #1f2937;
                            font-weight: 500;
                        }
                    }
                }
            }
        }

        .empty-rules {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 300px;
        }
    }

    .footer-actions {
        padding: 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: center;
        background: #f9fafb;
    }
}

:deep(.el-dialog__body) {
    padding: 20px 24px;
}

:deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
}
</style>