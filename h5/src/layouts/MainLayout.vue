<template>
  <div class="main-layout">
    <div class="content">
      <router-view />
    </div>
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/home/cards" icon="credit-pay">会员卡</van-tabbar-item>
      <van-tabbar-item to="/home/records" icon="orders-o">消费记录</van-tabbar-item>
      <van-tabbar-item to="/home/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref(0)
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  
  .content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 50px;
  }
}
</style>
