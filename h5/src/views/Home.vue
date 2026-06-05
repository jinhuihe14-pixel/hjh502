<template>
  <div class="home-page">
    <div class="header">
      <div class="welcome">
        <h2>欢迎回来，{{ memberInfo?.child_name }} 👋</h2>
        <p>{{ memberInfo?.parent_name }} 的宝贝</p>
      </div>
    </div>

    <div class="quick-cards" v-if="memberInfo?.cards && memberInfo.cards.length > 0">
      <div class="card-item" @click="$router.push('/home/cards')">
        <div class="card-icon">🎫</div>
        <div class="card-info">
          <div class="card-title">我的会员卡</div>
          <div class="card-desc">{{ memberInfo.cards.length }}张可用</div>
        </div>
        <van-icon name="arrow" />
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        <span>🔥 限时优惠</span>
      </div>
      <van-swipe class="promo-swipe" :autoplay="3000" indicator-color="#fff">
        <van-swipe-item v-for="promo in promotions" :key="promo.id">
          <div class="promo-card">
            <div class="promo-title">{{ promo.title }}</div>
            <div class="promo-content">{{ promo.content }}</div>
            <div class="promo-time">{{ promo.start_date }} - {{ promo.end_date }}</div>
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>

    <div class="section">
      <div class="section-title">
        <span>快捷服务</span>
      </div>
      <div class="service-grid">
        <div class="service-item" @click="$router.push('/home/cards')">
          <div class="service-icon">💳</div>
          <span>会员卡</span>
        </div>
        <div class="service-item" @click="$router.push('/home/records')">
          <div class="service-icon">📋</div>
          <span>消费记录</span>
        </div>
        <div class="service-item">
          <div class="service-icon">📞</div>
          <span>联系我们</span>
        </div>
        <div class="service-item">
          <div class="service-icon">❓</div>
          <span>帮助中心</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMember, getPromotions } from '@/api'

const memberInfo = ref(null)
const promotions = ref([])

const loadData = async () => {
  const memberId = localStorage.getItem('memberId')
  
  const [memberRes, promoRes] = await Promise.all([
    getMember(memberId),
    getPromotions()
  ])
  
  if (memberRes.success) {
    memberInfo.value = memberRes.data
  }
  if (promoRes.success) {
    promotions.value = promoRes.data
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.home-page {
  padding-bottom: 20px;
  
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 30px 20px;
    color: #fff;
    border-radius: 0 0 20px 20px;
    
    .welcome h2 {
      font-size: 22px;
      margin-bottom: 5px;
    }
    
    .welcome p {
      font-size: 14px;
      opacity: 0.8;
    }
  }
  
  .quick-cards {
    padding: 0 15px;
    margin-top: -20px;
    
    .card-item {
      background: #fff;
      border-radius: 12px;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      
      .card-icon {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      
      .card-info {
        flex: 1;
        
        .card-title {
          font-weight: bold;
          font-size: 16px;
          color: #333;
        }
        
        .card-desc {
          font-size: 13px;
          color: #999;
          margin-top: 3px;
        }
      }
    }
  }
  
  .section {
    padding: 0 15px;
    margin-top: 20px;
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 15px;
    }
    
    .promo-swipe {
      border-radius: 12px;
      overflow: hidden;
      
      .promo-card {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        padding: 20px;
        color: #fff;
        min-height: 120px;
        
        .promo-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .promo-content {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        
        .promo-time {
          font-size: 12px;
          opacity: 0.7;
        }
      }
    }
    
    .service-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      
      .service-item {
        background: #fff;
        border-radius: 12px;
        padding: 15px 10px;
        text-align: center;
        
        .service-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }
        
        span {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}
</style>
