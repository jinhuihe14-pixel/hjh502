<template>
  <div class="profile-page">
    <div class="header">
      <div class="avatar">🎠</div>
      <div class="info">
        <h2>{{ memberInfo?.child_name }}</h2>
        <p>会员号: {{ memberInfo?.member_no }}</p>
      </div>
    </div>

    <div class="menu-list">
      <van-cell-group inset>
        <van-cell title="基本信息" is-link @click="showInfo = true">
          <template #icon>
            <van-icon name="user-o" size="20" />
          </template>
        </van-cell>
        <van-cell title="我的会员卡" is-link @click="$router.push('/home/cards')">
          <template #icon>
            <van-icon name="credit-pay" size="20" />
          </template>
        </van-cell>
        <van-cell title="消费记录" is-link @click="$router.push('/home/records')">
          <template #icon>
            <van-icon name="orders-o" size="20" />
          </template>
        </van-cell>
      </van-cell-group>

      <van-cell-group inset style="margin-top: 15px">
        <van-cell title="联系我们" is-link>
          <template #icon>
            <van-icon name="phone-o" size="20" />
          </template>
        </van-cell>
        <van-cell title="意见反馈" is-link>
          <template #icon>
            <van-icon name="comment-o" size="20" />
          </template>
        </van-cell>
        <van-cell title="关于我们" is-link>
          <template #icon>
            <van-icon name="info-o" size="20" />
          </template>
        </van-cell>
      </van-cell-group>

      <van-button
        block
        type="danger"
        plain
        style="margin: 30px 15px"
        @click="handleLogout"
      >
        退出登录
      </van-button>
    </div>

    <van-popup v-model:show="showInfo" position="bottom" round>
      <div class="popup-content">
        <div class="popup-title">基本信息</div>
        <van-cell-group>
          <van-cell title="儿童姓名" :value="memberInfo?.child_name" />
          <van-cell title="年龄" :value="memberInfo?.child_age + '岁'" />
          <van-cell title="性别" :value="memberInfo?.child_gender === 'male' ? '男' : '女'" />
          <van-cell title="家长姓名" :value="memberInfo?.parent_name" />
          <van-cell title="联系电话" :value="memberInfo?.phone" />
          <van-cell title="地址" :value="memberInfo?.address || '未填写'" />
          <van-cell title="注册时间" :value="memberInfo?.created_at" />
        </van-cell-group>
        <van-button block type="primary" style="margin: 15px" @click="showInfo = false">
          关闭
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMember } from '@/api'

const router = useRouter()

const memberInfo = ref(null)
const showInfo = ref(false)

const loadData = async () => {
  const memberId = localStorage.getItem('memberId')
  const res = await getMember(memberId)
  if (res.success) {
    memberInfo.value = res.data
  }
}

const handleLogout = () => {
  localStorage.removeItem('memberId')
  localStorage.removeItem('memberInfo')
  router.push('/login')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    
    .avatar {
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
    }
    
    .info {
      color: #fff;
      
      h2 {
        margin: 0 0 5px 0;
        font-size: 20px;
      }
      
      p {
        margin: 0;
        font-size: 13px;
        opacity: 0.8;
      }
    }
  }
  
  .menu-list {
    padding-top: 15px;
  }
  
  .popup-content {
    .popup-title {
      text-align: center;
      padding: 15px;
      font-size: 16px;
      font-weight: bold;
    }
  }
}
</style>
