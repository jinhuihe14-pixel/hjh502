<template>
  <div class="cards-page">
    <div class="page-header">
      <h2>我的会员卡</h2>
    </div>

    <div class="cards-list" v-if="memberInfo?.cards && memberInfo.cards.length > 0">
      <div
        v-for="card in memberInfo.cards"
        :key="card.id"
        class="card-item"
        :class="{ expired: card.status !== 1 }"
      >
        <div class="card-header">
          <span class="card-type">{{ card.card_type_name }}</span>
          <span class="card-status" :class="card.status === 1 ? 'active' : 'expired'">
            {{ card.status === 1 ? '有效' : '已失效' }}
          </span>
        </div>
        <div class="card-no">{{ card.card_no }}</div>
        <div class="card-info">
          <div v-if="card.total_times" class="info-item">
            <span class="label">剩余次数</span>
            <span class="value">{{ card.remaining_times }} / {{ card.total_times }}</span>
          </div>
          <div v-else class="info-item">
            <span class="label">有效期</span>
            <span class="value">不限次数</span>
          </div>
          <div class="info-item">
            <span class="label">有效期至</span>
            <span class="value">{{ card.end_date }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🎫</div>
      <p>暂无可用会员卡</p>
      <p class="empty-desc">请前往前台办理会员</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMember } from '@/api'

const memberInfo = ref(null)

const loadData = async () => {
  const memberId = localStorage.getItem('memberId')
  const res = await getMember(memberId)
  if (res.success) {
    memberInfo.value = res.data
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.cards-page {
  min-height: 100vh;
  background: #f5f5f5;
  
  .page-header {
    padding: 20px;
    background: #fff;
    
    h2 {
      margin: 0;
      font-size: 20px;
      color: #333;
    }
  }
  
  .cards-list {
    padding: 15px;
    
    .card-item {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 15px;
      color: #fff;
      
      &.expired {
        background: #999;
        opacity: 0.7;
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        
        .card-type {
          font-size: 18px;
          font-weight: bold;
        }
        
        .card-status {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.2);
          
          &.active {
            background: rgba(103, 194, 58, 0.8);
          }
          
          &.expired {
            background: rgba(245, 108, 108, 0.8);
          }
        }
      }
      
      .card-no {
        font-size: 14px;
        opacity: 0.8;
        margin-bottom: 15px;
      }
      
      .card-info {
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .label {
            font-size: 13px;
            opacity: 0.8;
          }
          
          .value {
            font-size: 14px;
            font-weight: 500;
          }
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    
    .empty-icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    
    p {
      color: #666;
      margin: 0 0 10px 0;
      
      &.empty-desc {
        font-size: 13px;
        color: #999;
      }
    }
  }
}
</style>
