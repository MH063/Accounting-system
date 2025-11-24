<template>
  <div class="dorm-info">
    <h1>宿舍详情</h1>
    <p>宿舍ID: {{ dormId }}</p>
    <el-button @click="$router.back()">返回</el-button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string
}>()

const props = defineProps(['id'])
const dormId = props.id
</script>

<style scoped>
.dorm-info {
  padding: 20px;
}
</style>