<template>
  <el-form-item
    :prop="prop"
    :label="label"
    :rules="rules"
    :required="required"
    :error="error"
    :show-message="showMessage"
    :inline-message="inlineMessage"
    :size="size"
  >
    <!-- 输入框 -->
    <el-input
      v-if="type === 'input'"
      v-model="localValue"
      :type="inputType"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :readonly="readonly"
      :autosize="autosize"
      :maxlength="maxlength"
      :show-word-limit="showWordLimit"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- 文本域 -->
    <el-input
      v-else-if="type === 'textarea'"
      v-model="localValue"
      type="textarea"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :readonly="readonly"
      :autosize="autosize"
      :rows="rows"
      :maxlength="maxlength"
      :show-word-limit="showWordLimit"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- 选择器 -->
    <el-select
      v-else-if="type === 'select'"
      v-model="localValue"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :multiple="multiple"
      :multiple-limit="multipleLimit"
      :collapse-tags="collapseTags"
      :filterable="filterable"
      :remote="remote"
      :remote-method="remoteMethod"
      :loading="loading"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @visible-change="handleVisibleChange"
      @remove-tag="handleRemoveTag"
    >
      <el-option
        v-for="option in options"
        :key="option.value"
        :label="option.label"
        :value="option.value"
        :disabled="option.disabled"
      />
    </el-select>

    <!-- 单选框组 -->
    <el-radio-group
      v-else-if="type === 'radio'"
      v-model="localValue"
      :disabled="disabled"
      :size="size"
      :text-color="textColor"
      :fill="fill"
      @change="handleChange"
    >
      <el-radio
        v-for="option in options"
        :key="option.value"
        :label="option.value"
        :disabled="option.disabled"
        :border="border"
        :size="size"
      >
        {{ option.label }}
      </el-radio>
    </el-radio-group>

    <!-- 复选框组 -->
    <el-checkbox-group
      v-else-if="type === 'checkbox'"
      v-model="localValue"
      :disabled="disabled"
      :size="size"
      :min="min"
      :max="max"
      @change="handleChange"
    >
      <el-checkbox
        v-for="option in options"
        :key="option.value"
        :label="option.value"
        :disabled="option.disabled"
        :border="border"
        :size="size"
      >
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>

    <!-- 开关 -->
    <el-switch
      v-else-if="type === 'switch'"
      v-model="localValue"
      :disabled="disabled"
      :loading="loading"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :width="width"
      @change="handleChange"
    />

    <!-- 数字输入框 -->
    <el-input-number
      v-else-if="type === 'number'"
      v-model="localValue"
      :min="min"
      :max="max"
      :step="step"
      :step-strictly="stepStrictly"
      :precision="precision"
      :disabled="disabled"
      :controls="controls"
      :controls-position="controlsPosition"
      :placeholder="placeholder"
      @change="handleChange"
    />

    <!-- 日期选择器 -->
    <el-date-picker
      v-else-if="type === 'date'"
      v-model="localValue"
      :type="dateType"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :format="format"
      :value-format="valueFormat"
      :range-separator="rangeSeparator"
      :start-placeholder="startPlaceholder"
      :end-placeholder="endPlaceholder"
      :picker-options="pickerOptions"
      @change="handleChange"
    />

    <!-- 时间选择器 -->
    <el-time-picker
      v-else-if="type === 'time'"
      v-model="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :format="format"
      :value-format="valueFormat"
      :picker-options="pickerOptions"
      @change="handleChange"
    />

    <!-- 滑块 -->
    <el-slider
      v-else-if="type === 'slider'"
      v-model="localValue"
      :min="min"
      :max="max"
      :disabled="disabled"
      :step="step"
      :show-input="showInput"
      :show-input-controls="showInputControls"
      :input-size="inputSize"
      :show-stops="showStops"
      :show-tooltip="showTooltip"
      :range="range"
      :vertical="vertical"
      :height="height"
      :tooltip-class="tooltipClass"
      @change="handleChange"
    />

    <!-- 评分 -->
    <el-rate
      v-else-if="type === 'rate'"
      v-model="localValue"
      :max="max"
      :disabled="disabled"
      :allow-half="allowHalf"
      :show-text="showText"
      :show-score="showScore"
      :text-color="textColor"
      :texts="texts"
      @change="handleChange"
    />

    <!-- 颜色选择器 -->
    <el-color-picker
      v-else-if="type === 'color'"
      v-model="localValue"
      :disabled="disabled"
      :size="size"
      :show-alpha="showAlpha"
      :color-format="colorFormat"
      @change="handleChange"
      @active-change="handleActiveChange"
    />

    <!-- 自定义插槽 -->
    <slot v-else></slot>

    <!-- 提示信息 -->
    <div v-if="tip" class="field-tip">{{ tip }}</div>
  </el-form-item>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio,
  ElCheckboxGroup,
  ElCheckbox,
  ElSwitch,
  ElInputNumber,
  ElDatePicker,
  ElTimePicker,
  ElSlider,
  ElRate,
  ElColorPicker
} from 'element-plus'

// 定义属性
interface Option {
  value: string | number | boolean
  label: string
  disabled?: boolean
}

interface Props {
  // 基础属性
  modelValue?: any
  prop?: string
  label?: string
  rules?: any
  required?: boolean
  error?: string
  showMessage?: boolean
  inlineMessage?: boolean
  size?: 'large' | 'default' | 'small'
  
  // 字段属性
  type?: 'input' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'switch' | 'number' | 'date' | 'time' | 'slider' | 'rate' | 'color' | 'custom'
  placeholder?: string
  tip?: string
  
  // 通用属性
  disabled?: boolean
  clearable?: boolean
  readonly?: boolean
  
  // 输入框特有属性
  inputType?: 'text' | 'password' | 'email' | 'url' | 'number' | 'tel'
  autosize?: boolean | { minRows: number; maxRows: number }
  rows?: number
  maxlength?: number
  showWordLimit?: boolean
  prefixIcon?: string
  suffixIcon?: string
  
  // 选择器特有属性
  options?: Option[]
  multiple?: boolean
  multipleLimit?: number
  collapseTags?: boolean
  filterable?: boolean
  remote?: boolean
  remoteMethod?: (query: string) => void
  loading?: boolean
  
  // 单选框/复选框特有属性
  border?: boolean
  textColor?: string
  fill?: string
  min?: number
  max?: number
  
  // 开关特有属性
  activeText?: string
  inactiveText?: string
  activeValue?: string | number | boolean
  inactiveValue?: string | number | boolean
  activeColor?: string
  inactiveColor?: string
  width?: number
  
  // 数字输入框特有属性
  step?: number
  stepStrictly?: boolean
  precision?: number
  controls?: boolean
  controlsPosition?: 'right' | ''
  
  // 日期时间选择器特有属性
  dateType?: 'year' | 'month' | 'date' | 'dates' | 'week' | 'datetime' | 'datetimerange' | 'daterange' | 'monthrange'
  format?: string
  valueFormat?: string
  rangeSeparator?: string
  startPlaceholder?: string
  endPlaceholder?: string
  pickerOptions?: any
  
  // 滑块特有属性
  showInput?: boolean
  showInputControls?: boolean
  inputSize?: 'large' | 'default' | 'small'
  showStops?: boolean
  showTooltip?: boolean
  range?: boolean
  vertical?: boolean
  height?: string
  tooltipClass?: string
  
  // 评分特有属性
  allowHalf?: boolean
  showText?: boolean
  showScore?: boolean
  texts?: string[]
  
  // 颜色选择器特有属性
  showAlpha?: boolean
  colorFormat?: 'hsl' | 'hsv' | 'hex' | 'rgb'
}

// 默认属性值
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  showMessage: true,
  inlineMessage: false,
  size: 'default',
  type: 'input',
  inputType: 'text',
  autosize: false,
  rows: 2,
  maxlength: undefined,
  showWordLimit: false,
  disabled: false,
  clearable: false,
  readonly: false,
  multiple: false,
  multipleLimit: 0,
  collapseTags: false,
  filterable: false,
  remote: false,
  loading: false,
  border: false,
  textColor: '#ffffff',
  fill: '#409EFF',
  min: undefined,
  max: undefined,
  activeValue: true,
  inactiveValue: false,
  activeColor: '#409EFF',
  inactiveColor: '#C0CCDA',
  width: 40,
  step: 1,
  stepStrictly: false,
  precision: undefined,
  controls: true,
  controlsPosition: '',
  dateType: 'date',
  format: undefined,
  valueFormat: undefined,
  rangeSeparator: '-',
  startPlaceholder: '',
  endPlaceholder: '',
  pickerOptions: undefined,
  showInput: false,
  showInputControls: true,
  inputSize: 'small',
  showStops: false,
  showTooltip: true,
  range: false,
  vertical: false,
  height: '',
  tooltipClass: '',
  allowHalf: false,
  showText: false,
  showScore: false,
  texts: () => ['极差', '失望', '一般', '满意', '惊喜'],
  showAlpha: false,
  colorFormat: 'hex'
})

// 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'input', value: any): void
  (e: 'change', value: any): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'visible-change', visible: boolean): void
  (e: 'remove-tag', tag: any): void
  (e: 'active-change', value: string | null): void
}>()

// 响应式数据
const localValue = ref(props.modelValue)

// 计算属性
const valueComputed = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  }
})

// 监听属性变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// 事件处理函数
const handleInput = (value: any) => {
  emit('input', value)
}

const handleChange = (value: any) => {
  localValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleVisibleChange = (visible: boolean) => {
  emit('visible-change', visible)
}

const handleRemoveTag = (tag: any) => {
  emit('remove-tag', tag)
}

const handleActiveChange = (value: string | null) => {
  emit('active-change', value)
}

// 暴露方法给父组件
defineExpose({
  localValue
})
</script>

<style scoped>
.field-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}
</style>