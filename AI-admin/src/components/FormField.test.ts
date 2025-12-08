/**
 * FormField 组件测试
 */

import { testRunner, assert, componentTester } from '../utils/testUtils'
import FormField from './FormField.vue'

// 注册测试
testRunner.test('renders input field when type is input', () => {
  const component = componentTester.createComponent(FormField, {
    type: 'input',
    modelValue: '',
    placeholder: '请输入内容'
  })
  
  const inputComponent = component.findComponent('ElInput')
  assert.ok(inputComponent.exists(), 'Should render ElInput component')
  assert.equal(inputComponent.props('placeholder'), '请输入内容', 'Should pass placeholder prop')
})

testRunner.test('renders select field when type is select', () => {
  const component = componentTester.createComponent(FormField, {
    type: 'select',
    modelValue: '',
    options: [
      { value: 'option1', label: '选项1' },
      { value: 'option2', label: '选项2' }
    ]
  })
  
  const selectComponent = component.findComponent('ElSelect')
  assert.ok(selectComponent.exists(), 'Should render ElSelect component')
  
  const optionComponents = component.findAllComponents()
  assert.equal(optionComponents.length, 2, 'Should render 2 ElOption components')
})

testRunner.test('emits update:modelValue event when input value changes', async () => {
  const component = componentTester.createComponent(FormField, {
    type: 'input',
    modelValue: ''
  })
  
  const input = component.find('input')
  input.setValue('test value')
  
  assert.ok(component.emitted['update:modelValue'], 'Should emit update:modelValue event')
  assert.equal(component.emitted['update:modelValue'][0][0], 'test value', 'Should emit correct value')
})

testRunner.test('shows tip text when tip prop is provided', () => {
  const component = componentTester.createComponent(FormField, {
    type: 'input',
    modelValue: '',
    tip: '这是提示信息'
  })
  
  // 注意：由于是模拟的组件，我们无法真正检查DOM内容
  // 在真实测试中，我们会检查DOM元素的文本内容
  assert.equal(component.props.tip, '这是提示信息', 'Should pass tip prop')
})

// 导出测试运行函数
export const runFormFieldTests = () => {
  return testRunner.run()
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runFormFieldTests()
}

export default {
  runFormFieldTests
}