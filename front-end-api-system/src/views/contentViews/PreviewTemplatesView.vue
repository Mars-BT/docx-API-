<template>
    <div class="preview-templates-view">
        <div class="main-container">
            <!-- 分类导航 -->
            <div class="category-container">


                <div class="category-item" :class="{ active: currentCategory === 'all' }"
                    @click="handleCategoryClick('all')"><span>全部</span></div>

                <div class="category-item" v-for="category in categories" :key="category.name"
                    :class="{ active: currentCategory === category.name }" @click="handleCategoryClick(category.name)">
                    <span>{{ category.name }}</span>
                    <span class="category-count">{{ category.count }}</span>
                </div>

                <!-- 上传按钮 -->
                <div class="upload-button-container">
                    <el-button type="primary" :icon="UploadFilled" @click="showUploadDialog = true">
                        上传模板
                    </el-button>
                </div>
            </div>

            <!-- 模板网格容器 -->
            <div class="templates-container">
                <div class="template-item" v-for="file in files" :key="file.id">
                    <div class="template-icon">
                        <WordIcon :width="40" :height="40" color="#764ba2" />
                        <div class="file-name" :title="file.templateName">
                            {{ file.templateName }}
                        </div>
                    </div>
                    <div class="file-info">

                        <div class="file-category">{{ file.templateCategory }}</div>
                        <div class="file-time">{{ formatTime(file.uploadTime) }}</div>
                    </div>
                    <div class="buttons">
                        <el-button type="primary" @click="handleSetTemplate(file)">设置模板</el-button>

                        <el-button type="warning" @click="handlePreviewAPI(file)">API接口</el-button>
                        <el-button type="danger" @click="handleDelete(file)">删除</el-button>
                    </div>
                </div>
            </div>

        </div>

        <!-- 上传对话框 -->
        <el-dialog v-model="showUploadDialog" title="上传模板文件" width="500px" :close-on-click-modal="false">
            <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="100px">
                <el-form-item label="模板名称" prop="templateName">
                    <el-input v-model="uploadForm.templateName" placeholder="请输入模板名称" maxlength="50" show-word-limit />
                </el-form-item>

                <el-form-item label="模板分类" prop="templateCategory">
                    <el-select v-model="uploadForm.templateCategory" placeholder="请选择或输入分类" filterable allow-create
                        style="width: 100%">
                        <el-option v-for="category in categories" :key="category.name" :label="category.name"
                            :value="category.name" />
                    </el-select>
                </el-form-item>

                <el-form-item label="选择文件" prop="file">
                    <el-upload ref="uploadRef" :auto-upload="false" :show-file-list="true" :limit="1" accept=".docx"
                        :on-change="handleFileChange" :on-remove="handleFileRemove" :before-upload="beforeUpload">
                        <el-button type="primary" :icon="Document">选择DOCX文件</el-button>
                        <template #tip>
                            <div class="el-upload__tip">
                                只能上传DOCX文件，且不超过100MB
                            </div>
                        </template>
                    </el-upload>
                </el-form-item>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="handleCancelUpload">取消</el-button>
                    <el-button type="primary" @click="handleConfirmUpload" :loading="uploading">
                        {{ uploading ? '上传中...' : '确定上传' }}
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElNotification, type FormInstance, type FormRules, type UploadFile, type UploadFiles } from 'element-plus';
import { Plus, UploadFilled, Document } from '@element-plus/icons-vue';
import WordIcon from '../../components/icons/WordIcon.vue';
import { getAllFiles, getAllCategories, getFilesByCategory, uploadFile, downloadFile, deleteFile, type FileInfo } from '../../services/api.ts';
import { useStorageStore } from '../../stores/storage';
import { useRouter } from 'vue-router';

const categories = ref<{ name: string; count: number }[]>([]);
const currentCategory = ref('all');
const files = ref<FileInfo[]>([]);

// 上传相关的响应式变量
const showUploadDialog = ref(false);
const uploading = ref(false);
const uploadFormRef = ref<FormInstance>();
const uploadRef = ref();

// 上传表单数据
const uploadForm = ref({
    templateName: '',
    templateCategory: '',
    file: null as File | null
});

// 表单验证规则
const uploadRules: FormRules = {
    templateName: [
        { required: true, message: '请输入模板名称', trigger: 'blur' },
        { min: 1, max: 50, message: '模板名称长度在1到50个字符', trigger: 'blur' }
    ],
    templateCategory: [
        { required: true, message: '请选择或输入模板分类', trigger: 'change' }
    ],
    file: [
        { required: true, message: '请选择要上传的文件', trigger: 'change' }
    ]
};

const storage = useStorageStore();
const router = useRouter();

const handleCategoryClick = (category: string) => {
    currentCategory.value = category;
    if (category === 'all') {
        fGetAllFiles();
    } else {
        fGetFilesByCategory(category);
    }
}

const loadCategories = async () => {
    const res = await getAllCategories();
    categories.value = res;
    console.log(categories.value)
}

// 获取所有模板文件
const fGetAllFiles = async () => {
    const res = await getAllFiles();
    console.log('所有文件:', res)
    files.value = res;
}

// 根据分类获取模板文件
const fGetFilesByCategory = async (category: string) => {
    const res = await getFilesByCategory(category);
    console.log('分类文件:', res)
    files.value = res;
}

// 格式化时间显示
const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleDateString('zh-CN');
}

// ------------------------------ 按钮事件 ------------------------------
const handleSetTemplate = (file: FileInfo) => {
    storage.setTemplateId(file.id)
    console.log('storage.templateId:', storage.templateId)

    // 更新导航状态
    storage.setNavigationButton('templates-settings')

    // 跳转到模板设置页面
    router.push({ name: 'templates-settings' })
    ElMessage.success(`已选择模板：${file.templateName}`)
}

const handlePreviewAPI = (file: FileInfo) => {
    storage.setTemplateId(file.id)
    console.log('API接口:', file)

    // 更新导航状态
    storage.setNavigationButton('templates-test')

    // 跳转到模板测试页面
    router.push({ name: 'templates-test' })
    ElMessage.success(`已选择测试模板：${file.templateName}`)
}

const handleDelete = async (file: FileInfo) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除模板"${file.templateName}"吗？此操作将删除模板文件、配置规则和相关数据，且无法恢复。`,
            '确认删除',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'warning',
                confirmButtonClass: 'el-button--danger'
            }
        );

        await deleteFile(file.id);

        ElMessage.success(`模板"${file.templateName}"已成功删除`);

        // 刷新文件列表
        if (currentCategory.value === 'all') {
            fGetAllFiles();
        } else {
            fGetFilesByCategory(currentCategory.value);
        }

        // 刷新分类列表
        loadCategories();

    } catch (error: any) {
        if (error !== 'cancel') { // 用户取消操作时不显示错误
            console.error('删除文件失败:', error);
            ElMessage.error(error.message || '删除文件失败');
        }
    }
}

// ------------------------------ 上传相关函数 ------------------------------
// 文件选择变化处理
const handleFileChange = (file: UploadFile, fileList: UploadFiles) => {
    if (file.raw) {
        uploadForm.value.file = file.raw;
        // 手动触发表单验证
        uploadFormRef.value?.validateField('file');
    }
};

// 文件移除处理
const handleFileRemove = (file: UploadFile, fileList: UploadFiles) => {
    uploadForm.value.file = null;
    uploadFormRef.value?.validateField('file');
};

// 上传前验证
const beforeUpload = (file: File) => {
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.toLowerCase().endsWith('.docx');
    const isLt100M = file.size / 1024 / 1024 < 100;

    if (!isDocx) {
        ElMessage.error('只能上传DOCX格式的文件!');
        return false;
    }
    if (!isLt100M) {
        ElMessage.error('上传文件大小不能超过100MB!');
        return false;
    }
    return true;
};

// 取消上传
const handleCancelUpload = () => {
    showUploadDialog.value = false;
    resetUploadForm();
};

// 确认上传
const handleConfirmUpload = async () => {
    if (!uploadFormRef.value) return;

    try {
        // 表单验证
        await uploadFormRef.value.validate();

        if (!uploadForm.value.file) {
            ElMessage.error('请选择要上传的文件');
            return;
        }

        uploading.value = true;

        // 调用上传API
        const result = await uploadFile(
            uploadForm.value.file,
            uploadForm.value.templateName,
            uploadForm.value.templateCategory
        );

        ElMessage.success('文件上传成功！');

        // 关闭对话框并重置表单
        showUploadDialog.value = false;
        resetUploadForm();

        // 刷新文件列表和分类
        await Promise.all([
            currentCategory.value === 'all' ? fGetAllFiles() : fGetFilesByCategory(currentCategory.value),
            loadCategories()
        ]);

    } catch (error: any) {
        console.error('文件上传失败:', error);
        ElMessage.error(error.message || '文件上传失败');
    } finally {
        uploading.value = false;
    }
};

// 重置上传表单
const resetUploadForm = () => {
    uploadForm.value = {
        templateName: '',
        templateCategory: '',
        file: null
    };
    uploadRef.value?.clearFiles();
    uploadFormRef.value?.resetFields();
};

// 生命周期
onMounted(() => {
    fGetAllFiles()
    loadCategories();
});
</script>

<style scoped lang="scss">
.preview-templates-view {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 20px;
    box-sizing: border-box;
}

.main-container {
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    min-height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
}

.category-container {
    display: flex;
    padding: 12px;
    gap: 12px;
    border-bottom: 1px solid #f0f0f0;
    overflow-x: auto;
    align-items: center;

    .upload-button-container {
        margin-right: 12px;

        .el-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 20px;
            padding: 10px 20px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(118, 75, 162, 0.4);
            }
        }
    }

    .category-item {
        display: flex;
        align-items: center;

        gap: 8px;
        padding: 12px 20px;
        border-radius: 25px;
        background: #f8f9fa;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        min-width: fit-content;

        span {
            font-size: 14px;
            color: #666;
            font-weight: 500;
        }

        .category-count {
            background: #e9ecef;
            color: #666;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            min-width: 20px;
            text-align: center;
        }

        &:hover {
            background: rgba(118, 75, 162, 0.1);
            transform: translateY(-2px);
        }

        &.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);

            span {
                color: white;
            }

            .category-count {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }
        }
    }
}

.templates-container {
    flex: 1;
    padding: 30px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(6, 1fr);
    gap: 20px;
    min-height: 500px;

    .template-item {
        width: 100%;
        height: 100%;
        background: white;
        border-radius: 12px;
        border: 2px solid #f0f0f0;
        display: flex;
        flex-direction: column;


        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        padding: 16px;


        &:hover {

            box-shadow: 0 8px 25px rgba(118, 75, 162, 0.15);
            border-color: rgba(118, 75, 162, 0.3);
        }

        &:active {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(118, 75, 162, 0.2);
        }

        // 添加微妙的渐变背景
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        &:hover::before {
            opacity: 1;
        }

        // 模板图标样式
        .template-icon {
            margin-bottom: 12px;
            transition: transform 0.2s ease;
            display: flex;
            align-items: center;

            gap: 12px;


        }

        &:hover .template-icon {
            transform: scale(1.02);
        }

        // 文件信息样式
        .file-info {
            display: flex;
            align-items: center;
            text-align: center;
            justify-content: space-between;

            .file-name {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 100%;
            }

            .file-category {
                font-size: 12px;
                color: #764ba2;
                background: rgba(118, 75, 162, 0.1);
                padding: 2px 8px;
                border-radius: 10px;
            }

            .file-time {
                font-size: 11px;
                color: #999;
            }
        }

        .buttons {
            display: flex;
            justify-content: space-around;
            margin-top: 12px;

        }
    }
}
</style>
