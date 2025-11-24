<template>
  <div class="dorm-settings">
    <h1>宿舍设置</h1>
    <p>宿舍ID: {{ dormId }}</p>
    <el-button @click="$router.back()">返回</el-button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps(['id'])
const dormId = props.id
</script>

<style scoped>
.dorm-settings {
  padding: 20px;
}
</style>