<template>
  <div class="records-page">
    <div class="page-header">
      <h2>消费记录</h2>
    </div>

    <van-tabs v-model:active="activeTab">
      <van-tab title="全部">
        <RecordList :type="'all'" :records="memberInfo?.records || []" />
      </van-tab>
      <van-tab title="游玩">
        <RecordList :type="'play'" :records="memberInfo?.records || []" />
      </van-tab>
      <van-tab title="消费">
        <RecordList :type="'product'" :records="memberInfo?.records || []" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, defineComponent, h } from 'vue'
import { getMember } from '@/api'

const memberInfo = ref(null)
const activeTab = ref(0)

const loadData = async () => {
  const memberId = localStorage.getItem('memberId')
  const res = await getMember(memberId)
  if (res.success) {
    memberInfo.value = res.data
  }
}

const RecordList = defineComponent({
  props: ['type', 'records'],
  setup(props) {
    const filteredRecords = () => {
      if (props.type === 'all') return props.records
      return props.records.filter(r => 
        props.type === 'play' ? r.consumption_type === 'play' || r.consumption_type === 'walk-in' : r.consumption_type === 'product'
      )
    }

    const getTypeLabel = (type) => {
      const labels = {
        'play': '会员核销',
        'walk-in': '散客购票',
        'product': '商品消费'
      }
      return labels[type] || type
    }

    return () => {
      const records = filteredRecords()
      
      if (records.length === 0) {
        return h('div', { class: 'empty-state' }, [
          h('div', { class: 'empty-icon' }, '📋'),
          h('p', '暂无消费记录')
        ])
      }

      return h('div', { class: 'records-list' },
        records.map(record => 
          h('div', { class: 'record-item', key: record.id }, [
            h('div', { class: 'record-left' }, [
              h('div', { class: 'record-title' }, record.session_name || record.product_name || getTypeLabel(record.consumption_type)),
              h('div', { class: 'record-time' }, record.created_at)
            ]),
            h('div', { class: 'record-right' }, [
              h('div', { class: 'record-amount', class: record.amount > 0 ? 'positive' : 'free' },
                record.amount > 0 ? `-¥${record.amount}` : '免费'
              )
            ])
          ])
        )
      )
    }
  }
})

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.records-page {
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
  
  .records-list {
    padding: 15px;
    
    .record-item {
      background: #fff;
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .record-left {
        .record-title {
          font-size: 15px;
          color: #333;
          margin-bottom: 5px;
        }
        
        .record-time {
          font-size: 12px;
          color: #999;
        }
      }
      
      .record-right {
        .record-amount {
          font-size: 16px;
          font-weight: bold;
          
          &.positive {
            color: #f56c6c;
          }
          
          &.free {
            color: #67c23a;
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
      margin: 0;
    }
  }
}
</style>
