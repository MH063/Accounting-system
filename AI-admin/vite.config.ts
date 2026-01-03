import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8100,
    // 添加这行来支持Vue Router的history模式
    host: true
  },
  // 使用绝对路径作为基础URL，确保资源正确加载
  base: '/'
})