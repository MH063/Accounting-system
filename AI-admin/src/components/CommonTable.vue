<template>
  <div class="common-table-container">
    <div class="table-header" v-if="$slots.header || showHeader">
      <slot name="header"></slot>
    </div>
    
    <div class="table-wrapper">
      <el-table
        :data="tableData"
        :loading="loading"
        :border="border"
        :stripe="stripe"
        :size="responsiveSize"
        :height="height"
        :max-height="maxHeight"
        :fit="fit"
        :highlight-current-row="highlightCurrentRow"
        :show-header="showHeader"
        :row-class-name="rowClassName"
        :cell-class-name="cellClassName"
        :header-cell-class-name="headerCellClassName"
        @selection-change="handleSelectionChange"
        @select="handleSelect"
        @select-all="handleSelectAll"
        @current-change="handleCurrentChange"
        @row-click="handleRowClick"
        @row-dblclick="handleRowDblclick"
        @cell-click="handleCellClick"
        @cell-dblclick="handleCellDblclick"
        @sort-change="handleSortChange"
      >
        <slot></slot>
      </el-table>
    </div>
    
    <div class="table-footer" v-if="showPagination || $slots.footer">
      <div class="pagination-container" v-if="showPagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="pageSizes"
          :total="total"
          :layout="responsivePaginationLayout"
          :pager-count="isMobile ? 5 : 7"
          @size-change="handleSizeChange"
          @current-change="handleCurrentPageChange"
        />
      </div>
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElTable, ElPagination } from 'element-plus'

// 定义属性
interface Props {
  // 数据相关
  data?: any[]
  loading?: boolean
  
  // 表格样式相关
  border?: boolean
  stripe?: boolean
  size?: 'large' | 'default' | 'small'
  height?: string | number
  maxHeight?: string | number
  fit?: boolean
  highlightCurrentRow?: boolean
  showHeader?: boolean
  
  // 分页相关
  showPagination?: boolean
  currentPage?: number
  pageSize?: number
  pageSizes?: number[]
  total?: number
  paginationLayout?: string
  
  // 类名相关
  rowClassName?: (row: any, rowIndex: number) => string
  cellClassName?: (row: any, column: any, rowIndex: number) => string
  headerCellClassName?: (column: any, rowIndex: number) => string
}

// 默认属性值
const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  border: true,
  stripe: false,
  size: 'default',
  fit: true,
  highlightCurrentRow: false,
  showHeader: true,
  showPagination: false,
  currentPage: 1,
  pageSize: 15,
  pageSizes: () => [10, 15, 30, 50],
  total: 0,
  paginationLayout: 'total, sizes, prev, pager, next, jumper'
})

// 移动端检测
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 响应式表格尺寸
const responsiveSize = computed(() => {
  if (isMobile.value) return 'small'
  return props.size
})

// 响应式分页布局
const responsivePaginationLayout = computed(() => {
  if (isMobile.value) return 'prev, pager, next'
  return props.paginationLayout
})

// 定义事件
const emit = defineEmits<{
  (e: 'selection-change', selection: any[]): void
  (e: 'select', selection: any[], row: any): void
  (e: 'select-all', selection: any[]): void
  (e: 'current-change', currentRow: any, oldCurrentRow: any): void
  (e: 'row-click', row: any, column: any, event: Event): void
  (e: 'row-dblclick', row: any, column: any, event: Event): void
  (e: 'cell-click', row: any, column: any, cell: any, event: Event): void
  (e: 'cell-dblclick', row: any, column: any, cell: any, event: Event): void
  (e: 'sort-change', sortInfo: { column: any; prop: string; order: string }): void
  (e: 'size-change', size: number): void
  (e: 'current-page-change', currentPage: number): void
}>()

// 响应式数据
const tableData = computed(() => props.data)
const currentPage = ref(props.currentPage)
const pageSize = ref(props.pageSize)

// 监听属性变化
watch(() => props.currentPage, (newVal) => {
  currentPage.value = newVal
})

watch(() => props.pageSize, (newVal) => {
  pageSize.value = newVal
})

// 事件处理函数
const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}

const handleSelect = (selection: any[], row: any) => {
  emit('select', selection, row)
}

const handleSelectAll = (selection: any[]) => {
  emit('select-all', selection)
}

const handleCurrentChange = (currentRow: any, oldCurrentRow: any) => {
  emit('current-change', currentRow, oldCurrentRow)
}

const handleRowClick = (row: any, column: any, event: Event) => {
  emit('row-click', row, column, event)
}

const handleRowDblclick = (row: any, column: any, event: Event) => {
  emit('row-dblclick', row, column, event)
}

const handleCellClick = (row: any, column: any, cell: any, event: Event) => {
  emit('cell-click', row, column, cell, event)
}

const handleCellDblclick = (row: any, column: any, cell: any, event: Event) => {
  emit('cell-dblclick', row, column, cell, event)
}

const handleSortChange = (sortInfo: { column: any; prop: string; order: string }) => {
  emit('sort-change', sortInfo)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  emit('size-change', size)
}

const handleCurrentPageChange = (page: number) => {
  currentPage.value = page
  emit('current-page-change', page)
}

// 暴露方法给父组件
defineExpose({
  currentPage,
  pageSize
})
</script>

<style scoped>
.common-table-container {
  background: #fff;
  border-radius: 4px;
  width: 100%;
}

.table-header {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-footer {
  padding: 15px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border-top: 1px solid #ebeef5;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-container {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .table-header {
    padding: 10px;
  }
  
  .table-footer {
    padding: 10px;
    justify-content: center;
  }
  
  .pagination-container {
    justify-content: center;
  }
  
  /* 针对移动端优化表格单元格内容换行 */
  :deep(.el-table .cell) {
    white-space: normal;
    word-break: break-all;
    padding: 0 5px;
  }
}
</style>