<template>
    <div class="workspace-navigation-component">
        <div class="left-container">
            <span class="workspace-title">模板系统</span>
        </div>
        <div class="center-container">
            <div class="navigation-button-container">

                <div class="navigation-button" @click="navigationButtonClick('preview-templates')"
                    :class="storageStore.currentNavigationButton === 'preview-templates' ? 'navigation-button-active' : ''">
                    <WordIcon width="24" height="24"
                        :color="storageStore.currentNavigationButton === 'preview-templates' ? '#764ba2' : '#000000'" />
                    <span :class="storageStore.currentNavigationButton === 'preview-templates' ? 'span-active' : ''">模板</span>
                </div>

                <div class="navigation-button" @click="navigationButtonClick('templates-settings')"
                    :class="storageStore.currentNavigationButton === 'templates-settings' ? 'navigation-button-active' : ''">
                    <EditIcon width="24" height="24"
                        :color="storageStore.currentNavigationButton === 'templates-settings' ? '#764ba2' : '#000000'" />
                    <span :class="storageStore.currentNavigationButton === 'templates-settings' ? 'span-active' : ''">编辑</span>
                </div>

                <div class="navigation-button" @click="navigationButtonClick('templates-test')"
                    :class="storageStore.currentNavigationButton === 'templates-test' ? 'navigation-button-active' : ''">
                    <PluginIcon width="24" height="24"
                        :color="storageStore.currentNavigationButton === 'templates-test' ? '#764ba2' : '#000000'" />
                    <span :class="storageStore.currentNavigationButton === 'templates-test' ? 'span-active' : ''">测试</span>
                </div>

            </div>
        </div>
        <div class="right-container"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import WordIcon from '../icons/WordIcon.vue';
import EditIcon from '../icons/EditIcon.vue';
import PluginIcon from '../icons/PluginIcon.vue';
import { useStorageStore } from '../../stores/storage.ts';

const storageStore = useStorageStore();
const router = useRouter();
const route = useRoute();

// 在组件挂载时同步当前路由状态
onMounted(() => {
    storageStore.syncWithRoute(route.path);
});

// icon地址
// https://www.iconfont.cn/collections/detail?spm=a313x.collections_index.i1.d9df05512.1c953a81cQVeT3&cid=51731&page=1

const navigationButtonClick = (button: string) => {
    storageStore.setNavigationButton(button);
    router.push(`/${button}`);
}


</script>

<style lang="scss" scoped>
.workspace-navigation-component {
    position: relative;
    min-height: 55px;
    height: 55px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
}

.left-container {
    padding: 0 20px;
}

.center-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;

    .navigation-button-container {
        display: flex;
        gap: 10px;

        .navigation-button {
            display: flex;
            gap: 5px;
            align-items: center;
            justify-content: center;
            padding: 6px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid transparent;

            span {
                font-size: 14px;
                color: #000000;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .span-active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 600;
            }

            &:hover {
                background: rgba(118, 75, 162, 0.08);
                border-color: rgba(118, 75, 162, 0.1);
                transform: translateY(-1px);
            }
        }

        .navigation-button-active {
            background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
            border: 1px solid rgba(118, 75, 162, 0.2);
            box-shadow: 
                0px 2px 4px -2px rgba(118, 75, 162, 0.15),
                0px 4px 8px -2px rgba(118, 75, 162, 0.1),
                inset 0px 1px 0px rgba(118, 75, 162, 0.1);

            &:hover {
                background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
                border-color: rgba(118, 75, 162, 0.3);
                box-shadow: 
                    0px 2px 6px -2px rgba(118, 75, 162, 0.2),
                    0px 6px 12px -2px rgba(118, 75, 162, 0.15),
                    inset 0px 1px 0px rgba(118, 75, 162, 0.15);
            }
        }
    }
}

.workspace-title {
    font-size: 24px;
    font-weight: 700;
    font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    letter-spacing: 2px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120%;
        height: 120%;
        background: linear-gradient(135deg, #667eea20, #764ba220);
        border-radius: 8px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
    }

    &:hover {
        transform: scale(1.05);

        &::before {
            opacity: 1;
        }
    }
}
</style>
