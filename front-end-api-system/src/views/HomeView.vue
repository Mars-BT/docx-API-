<template>
    <div class="home-view">
        <Navigation />
        <div class="content-view">
            <RouterView />
        </div>
    </div>
</template>

<style scoped lang="scss">
.home-view {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.content-view {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: auto;
}
</style>

<script setup lang="ts">
import Navigation from '../components/core/Navigation.vue';
</script>