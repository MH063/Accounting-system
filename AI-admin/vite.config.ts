import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8100,
    // 添加这行来支持Vue Router的history模式
    host: true
  },
  // 添加这个配置来支持Vue Router的history模式
  base: './'
})