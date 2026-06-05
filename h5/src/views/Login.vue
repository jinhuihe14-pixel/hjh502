<template>
  <div class="login-page">
    <div class="logo-section">
      <div class="logo">🎠</div>
      <h1>淘气堡会员中心</h1>
      <p>欢迎来到亲子乐园</p>
    </div>
    
    <div class="login-form">
      <van-field
        v-model="qrCode"
        label="会员号"
        placeholder="请输入会员号或扫描二维码"
        clearable
      />
      <van-button
        type="primary"
        block
        size="large"
        :loading="loading"
        @click="handleLogin"
        style="margin-top: 20px"
      >
        登录
      </van-button>
    </div>
    
    <div class="tips">
      <p>请向收银员索取您的会员号</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getMemberByQr } from '@/api'

const router = useRouter()

const qrCode = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!qrCode.value) {
    showToast('请输入会员号')
    return
  }
  
  loading.value = true
  try {
    const res = await getMemberByQr(qrCode.value)
    if (res.success) {
      localStorage.setItem('memberId', res.data.id)
      localStorage.setItem('memberInfo', JSON.stringify(res.data))
      showToast('登录成功')
      router.push('/home')
    }
  } catch (e) {
    showToast('会员号不正确')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  .logo-section {
    text-align: center;
    color: #fff;
    margin-bottom: 50px;
    
    .logo {
      font-size: 80px;
      margin-bottom: 20px;
    }
    
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    p {
      font-size: 14px;
      opacity: 0.8;
    }
  }
  
  .login-form {
    background: #fff;
    border-radius: 10px;
    padding: 30px 20px;
  }
  
  .tips {
    text-align: center;
    margin-top: 30px;
    color: #fff;
    opacity: 0.8;
    font-size: 12px;
  }
}
</style>
