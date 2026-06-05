<template>
  <div class="statistics">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="summary-cards">
      <el-col :span="6">
        <el-card class="summary-card">
          <div class="summary-icon icon-traffic">
            <el-icon><User /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-value">{{ summary.totalTraffic || 0 }}</div>
            <div class="summary-label">总客流量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="summary-card">
          <div class="summary-icon icon-card">
            <el-icon><CreditCard /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-value">{{ summary.cardSalesCount || 0 }}</div>
            <div class="summary-label">售卡数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="summary-card">
          <div class="summary-icon icon-product">
            <el-icon><Goods /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-value">{{ summary.productSalesCount || 0 }}</div>
            <div class="summary-label">产品销量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="summary-card">
          <div class="summary-icon icon-money">
            <el-icon><Money /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-value">¥{{ summary.totalSales || 0 }}</div>
            <div class="summary-label">总销售额</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>客流量统计</span>
              <el-radio-group v-model="trafficViewType" size="small" @change="loadSessionTraffic">
                <el-radio-button value="date">按日期</el-radio-button>
                <el-radio-button value="session">按场次</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-table :data="sessionTrafficData" border stripe>
            <el-table-column
              v-if="trafficViewType === 'date'"
              prop="date"
              label="日期"
              min-width="120"
            />
            <el-table-column
              v-if="trafficViewType === 'session'"
              prop="session_name"
              label="场次名称"
              min-width="150"
            />
            <el-table-column
              v-if="trafficViewType === 'session'"
              prop="time_range"
              label="时间"
              min-width="150"
            />
            <el-table-column
              prop="total_count"
              label="总人数"
              min-width="100"
              align="center"
            />
            <el-table-column
              prop="member_count"
              label="会员人数"
              min-width="100"
              align="center"
            />
            <el-table-column
              prop="walkin_count"
              label="散客人数"
              min-width="100"
              align="center"
            />
            <el-table-column label="占比" min-width="150" align="center">
              <template #default="{ row }">
                <div class="traffic-ratio">
                  <span class="ratio-label">会员: {{ getRatio(row.member_count, row.total_count) }}%</span>
                  <el-progress
                    :percentage="getRatio(row.member_count, row.total_count)"
                    :stroke-width="8"
                    color="#409EFF"
                  />
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>卡种销售统计</span>
          </template>
          <el-table :data="cardSalesData" border stripe>
            <el-table-column
              prop="card_type_name"
              label="卡种名称"
              min-width="120"
            />
            <el-table-column
              prop="sales_count"
              label="销售数量"
              min-width="100"
              align="center"
            />
            <el-table-column
              prop="total_amount"
              label="销售金额"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                ¥{{ row.total_amount }}
              </template>
            </el-table-column>
            <el-table-column
              prop="avg_price"
              label="平均单价"
              min-width="100"
              align="center"
            >
              <template #default="{ row }">
                ¥{{ row.avg_price }}
              </template>
            </el-table-column>
            <el-table-column label="销售占比" min-width="120" align="center">
              <template #default="{ row }">
                <el-tag type="success" size="small">
                  {{ getCardSalesRatio(row.sales_count) }}%
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>产品销售统计</span>
          </template>
          <el-table :data="productSalesData" border stripe>
            <el-table-column
              prop="product_name"
              label="产品名称"
              min-width="120"
            />
            <el-table-column
              prop="category"
              label="分类"
              min-width="100"
              align="center"
            />
            <el-table-column
              prop="sales_quantity"
              label="销售数量"
              min-width="100"
              align="center"
            />
            <el-table-column
              prop="total_amount"
              label="销售金额"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                ¥{{ row.total_amount }}
              </template>
            </el-table-column>
            <el-table-column label="销售占比" min-width="100" align="center">
              <template #default="{ row }">
                <el-tag type="warning" size="small">
                  {{ getProductSalesRatio(row.sales_quantity) }}%
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>日销售额趋势</span>
          </template>
          <el-table :data="dailySalesData" border stripe>
            <el-table-column
              prop="date"
              label="日期"
              min-width="120"
            />
            <el-table-column
              prop="card_sales"
              label="办卡收入"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                <span style="color: #67C23A">¥{{ row.card_sales }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="product_sales"
              label="产品收入"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                <span style="color: #E6A23C">¥{{ row.product_sales }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="ticket_sales"
              label="门票收入"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                <span style="color: #409EFF">¥{{ row.ticket_sales }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="total_sales"
              label="当日总计"
              min-width="130"
              align="center"
            >
              <template #default="{ row }">
                <strong style="color: #F56C6C">¥{{ row.total_sales }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="环比" min-width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.growth_rate >= 0 ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.growth_rate >= 0 ? '+' : '' }}{{ row.growth_rate }}%
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSessionTraffic, getCardSales, getProductSales, getDailySales } from '@/api'

const filterForm = ref({
  dateRange: []
})

const trafficViewType = ref('date')
const sessionTrafficData = ref([])
const cardSalesData = ref([])
const productSalesData = ref([])
const dailySalesData = ref([])

const dateShortcuts = [
  {
    text: '本周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - start.getDay())
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return [start, end]
    }
  },
  {
    text: '近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    }
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    }
  }
]

const summary = computed(() => {
  const totalTraffic = sessionTrafficData.value.reduce((sum, item) => sum + (item.total_count || 0), 0)
  const cardSalesCount = cardSalesData.value.reduce((sum, item) => sum + (item.sales_count || 0), 0)
  const productSalesCount = productSalesData.value.reduce((sum, item) => sum + (item.sales_quantity || 0), 0)
  const totalSales = dailySalesData.value.reduce((sum, item) => sum + (item.total_sales || 0), 0)
  return {
    totalTraffic,
    cardSalesCount,
    productSalesCount,
    totalSales
  }
})

const totalCardSales = computed(() => {
  return cardSalesData.value.reduce((sum, item) => sum + (item.sales_count || 0), 0)
})

const totalProductSales = computed(() => {
  return productSalesData.value.reduce((sum, item) => sum + (item.sales_quantity || 0), 0)
})

const getRatio = (part, total) => {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

const getCardSalesRatio = (count) => {
  if (!totalCardSales.value) return 0
  return Math.round((count / totalCardSales.value) * 100)
}

const getProductSalesRatio = (quantity) => {
  if (!totalProductSales.value) return 0
  return Math.round((quantity / totalProductSales.value) * 100)
}

const getParams = () => {
  const params = {}
  if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
    params.start_date = filterForm.value.dateRange[0]
    params.end_date = filterForm.value.dateRange[1]
  }
  return params
}

const loadSessionTraffic = async () => {
  const params = getParams()
  params.group_by = trafficViewType.value
  const res = await getSessionTraffic(params)
  if (res.success) {
    sessionTrafficData.value = res.data || []
  }
}

const loadCardSales = async () => {
  const res = await getCardSales(getParams())
  if (res.success) {
    cardSalesData.value = res.data || []
  }
}

const loadProductSales = async () => {
  const res = await getProductSales(getParams())
  if (res.success) {
    productSalesData.value = res.data || []
  }
}

const loadDailySales = async () => {
  const res = await getDailySales(getParams())
  if (res.success) {
    dailySalesData.value = res.data || []
  }
}

const loadData = async () => {
  try {
    await Promise.all([
      loadSessionTraffic(),
      loadCardSales(),
      loadProductSales(),
      loadDailySales()
    ])
    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败')
  }
}

const resetFilter = () => {
  filterForm.value.dateRange = []
  loadData()
}

onMounted(() => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  filterForm.value.dateRange = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
  loadData()
})
</script>

<style scoped lang="scss">
.statistics {
  .filter-card {
    margin-bottom: 20px;
    
    .filter-form {
      margin: 0;
    }
  }
  
  .summary-cards {
    margin-bottom: 20px;
  }
  
  .summary-card {
    display: flex;
    align-items: center;
    gap: 15px;
    
    .summary-icon {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #fff;
      
      &.icon-traffic { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.icon-card { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      &.icon-product { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
      &.icon-money { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    }
    
    .summary-content {
      .summary-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
      }
      .summary-label {
        font-size: 14px;
        color: #909399;
        margin-top: 5px;
      }
    }
  }
  
  .content-row {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .traffic-ratio {
    display: flex;
    flex-direction: column;
    gap: 5px;
    
    .ratio-label {
      font-size: 12px;
      color: #606266;
    }
  }
}
</style>
