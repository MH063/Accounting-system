import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Header from '../Header.vue'

// 模拟依赖
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

vi.mock('../services/searchService', () => ({
  searchService: {
    globalSearch: vi.fn().mockResolvedValue([
      {
        id: '1',
        title: '测试页面',
        path: '/test',
        category: 'page',
        description: '测试描述',
        keywords: ['测试'],
        priority: 'high',
        icon: null
      }
    ]),
    getSmartSuggestions: vi.fn().mockReturnValue(['测试建议1', '测试建议2'])
  }
}))

describe('Header组件搜索功能测试', () => {
  let router
  let wrapper

  beforeEach(() => {
    // 创建测试路由
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>首页</div>' } },
        { path: '/test', component: { template: '<div>测试页面</div>' } },
        { path: '/dashboard', component: { template: '<div>仪表盘</div>' } }
      ]
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('点击搜索结果后应该隐藏搜索面板', async () => {
    wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          'el-input': {
            template: '<input v-bind="$attrs" @input="$attrs.onInput" @focus="$attrs.onFocus" @blur="$attrs.onBlur" @keyup="$attrs.onKeyup" />',
            props: ['modelValue', 'placeholder', 'prefixIcon', 'clearable', 'loading']
          },
          'el-button': {
            template: '<button @click="$attrs.onClick"><slot /></button>'
          },
          'el-tag': {
            template: '<span @click="$attrs.onClick" class="el-tag"><slot /></span>'
          },
          'el-icon': {
            template: '<i class="el-icon"><slot /></i>'
          }
        }
      }
    })

    const header = wrapper.vm
    
    // 模拟搜索输入
    header.searchQuery = '测试'
    await wrapper.vm.$nextTick()

    // 显示搜索结果
    header.showSearchResults = true
    header.searchResults = [
      {
        id: '1',
        title: '测试页面',
        path: '/test',
        category: 'page',
        description: '测试描述',
        keywords: ['测试'],
        priority: 'high',
        icon: null
      }
    ]
    await wrapper.vm.$nextTick()

    // 验证搜索面板显示
    expect(header.showSearchResults).toBe(true)

    // 点击搜索结果
    header.handleSearchResultClick(header.searchResults[0])
    await wrapper.vm.$nextTick()

    // 验证搜索面板已隐藏
    expect(header.showSearchResults).toBe(false)
    expect(header.searchSuggestions).toEqual([])
  })

  it('点击搜索建议后应该隐藏搜索面板', async () => {
    wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          'el-input': {
            template: '<input v-bind="$attrs" @input="$attrs.onInput" @focus="$attrs.onFocus" @blur="$attrs.onBlur" @keyup="$attrs.onKeyup" />',
            props: ['modelValue', 'placeholder', 'prefixIcon', 'clearable', 'loading']
          },
          'el-button': {
            template: '<button @click="$attrs.onClick"><slot /></button>'
          },
          'el-tag': {
            template: '<span @click="$attrs.onClick" class="el-tag"><slot /></span>'
          },
          'el-icon': {
            template: '<i class="el-icon"><slot /></i>'
          }
        }
      }
    })

    const header = wrapper.vm
    
    // 模拟搜索建议
    header.searchQuery = '测试'
    header.searchSuggestions = ['测试建议1', '测试建议2']
    header.showSearchResults = true
    await wrapper.vm.$nextTick()

    // 验证搜索面板显示
    expect(header.showSearchResults).toBe(true)

    // 点击搜索建议
    header.handleSuggestionClick('测试建议1')
    await wrapper.vm.$nextTick()

    // 验证搜索面板已隐藏
    expect(header.showSearchResults).toBe(false)
    expect(header.searchSuggestions).toEqual([])
  })

  it('路由变化时应该自动隐藏搜索面板', async () => {
    wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          'el-input': {
            template: '<input v-bind="$attrs" @input="$attrs.onInput" @focus="$attrs.onFocus" @blur="$attrs.onBlur" @keyup="$attrs.onKeyup" />',
            props: ['modelValue', 'placeholder', 'prefixIcon', 'clearable', 'loading']
          },
          'el-button': {
            template: '<button @click="$attrs.onClick"><slot /></button>'
          },
          'el-tag': {
            template: '<span @click="$attrs.onClick" class="el-tag"><slot /></span>'
          },
          'el-icon': {
            template: '<i class="el-icon"><slot /></i>'
          }
        }
      }
    })

    const header = wrapper.vm
    
    // 模拟搜索状态
    header.showSearchResults = true
    header.searchSuggestions = ['建议1', '建议2']
    header.searchQuery = '测试'
    await wrapper.vm.$nextTick()

    // 验证搜索面板显示
    expect(header.showSearchResults).toBe(true)

    // 模拟路由变化
    await router.push('/test')
    await wrapper.vm.$nextTick()

    // 验证搜索面板已隐藏
    expect(header.showSearchResults).toBe(false)
    expect(header.searchSuggestions).toEqual([])
  })

  it('搜索框失去焦点时应该隐藏搜索面板', async () => {
    wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          'el-input': {
            template: '<input v-bind="$attrs" @input="$attrs.onInput" @focus="$attrs.onFocus" @blur="$attrs.onBlur" @keyup="$attrs.onKeyup" />',
            props: ['modelValue', 'placeholder', 'prefixIcon', 'clearable', 'loading']
          },
          'el-button': {
            template: '<button @click="$attrs.onClick"><slot /></button>'
          },
          'el-tag': {
            template: '<span @click="$attrs.onClick" class="el-tag"><slot /></span>'
          },
          'el-icon': {
            template: '<i class="el-icon"><slot /></i>'
          }
        }
      }
    })

    const header = wrapper.vm
    
    // 模拟搜索状态
    header.showSearchResults = true
    header.searchSuggestions = ['建议1', '建议2']
    await wrapper.vm.$nextTick()

    // 触发失去焦点事件
    header.handleSearchBlur()
    
    // 等待延迟时间
    await new Promise(resolve => setTimeout(resolve, 250))
    await wrapper.vm.$nextTick()

    // 验证搜索面板已隐藏
    expect(header.showSearchResults).toBe(false)
    expect(header.searchSuggestions).toEqual([])
  })
})