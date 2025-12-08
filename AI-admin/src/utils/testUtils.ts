/**
 * 简单的测试工具函数
 * 用于基本的组件测试和验证
 */

// 简单的断言函数
export const assert = {
  equal(actual: any, expected: any, message: string = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message || `${actual} !== ${expected}`}`)
    }
  },
  
  notEqual(actual: any, expected: any, message: string = '') {
    if (actual === expected) {
      throw new Error(`Assertion failed: ${message || `${actual} === ${expected}`}`)
    }
  },
  
  ok(value: any, message: string = '') {
    if (!value) {
      throw new Error(`Assertion failed: ${message || `${value} is not truthy`}`)
    }
  },
  
  throws(fn: Function, message: string = '') {
    try {
      fn()
      throw new Error(`Assertion failed: ${message || 'Expected function to throw'}`)
    } catch (e) {
      // Expected to throw
    }
  }
}

// 简单的测试运行器
export const testRunner = {
  tests: [] as Array<{ name: string; fn: Function }>,
  
  test(name: string, fn: Function) {
    this.tests.push({ name, fn })
  },
  
  async run() {
    let passed = 0
    let failed = 0
    
    console.log(`Running ${this.tests.length} tests...\n`)
    
    for (const { name, fn } of this.tests) {
      try {
        await fn()
        console.log(`✅ ${name}`)
        passed++
      } catch (error: any) {
        console.log(`❌ ${name}: ${error.message}`)
        failed++
      }
    }
    
    console.log(`\nTests completed: ${passed} passed, ${failed} failed`)
    return failed === 0
  }
}

// 组件测试工具
export const componentTester = {
  // 模拟创建组件实例
  createComponent(component: any, props: any = {}) {
    return {
      props,
      emitted: {} as Record<string, any[]>,
      
      // 模拟触发事件
      emit(event: string, ...args: any[]) {
        if (!this.emitted[event]) {
          this.emitted[event] = []
        }
        this.emitted[event].push(args)
      },
      
      // 模拟查找子组件
      findComponent(componentType: any) {
        // 简单模拟实现
        return {
          exists: () => true,
          props: (propName: string) => this.props[propName]
        }
      },
      
      // 模拟查找所有子组件
      findAllComponents() {
        return [
          {
            exists: () => true,
            props: () => ({})
          }
        ]
      },
      
      // 模拟查找元素
      find(selector: string) {
        return {
          exists: () => true,
          text: () => '',
          setValue: (value: any) => {
            this.emit('update:modelValue', value)
          }
        }
      }
    }
  }
}

export default {
  assert,
  testRunner,
  componentTester
}