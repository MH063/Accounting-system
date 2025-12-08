import { createStore, Store } from 'vuex'
import VuexAlong from 'vuex-along'
import user from './modules/user'
import system from './modules/system'
import app from './modules/app'

// 定义根状态类型
interface RootState {
  // 可以在这里定义根级别的状态，如果有的话
}

// 创建store
const store: Store<RootState> = createStore({
  state: {},
  
  modules: {
    user,
    system,
    app
  },
  
  plugins: [
    VuexAlong({
      name: 'ai-admin-store',
      local: {
        list: ['user', 'system'],
        isFilter: true
      },
      session: {
        list: ['app'],
        isFilter: true
      }
    })
  ]
})

export default store