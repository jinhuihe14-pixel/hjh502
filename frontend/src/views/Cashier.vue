<template>
  <div class="cashier">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>收银台</span>
              <el-tabs v-model="activeTab" type="card">
                <el-tab-pane label="会员核销" name="member" />
                <el-tab-pane label="散客购票" name="walkin" />
                <el-tab-pane label="二次消费" name="product" />
              </el-tabs>
            </div>
          </template>

          <div v-if="activeTab === 'member'" class="member-checkin">
            <el-input
              v-model="qrCode"
              placeholder="请扫描会员二维码或输入会员号"
              size="large"
              clearable
              @keyup.enter="searchMember"
              style="margin-bottom: 20px"
            >
              <template #append>
                <el-button type="primary" @click="searchMember">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
              </template>
            </el-input>

            <div v-if="memberInfo" class="member-info-card">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="会员编号">{{ memberInfo.member_no }}</el-descriptions-item>
                <el-descriptions-item label="儿童姓名">{{ memberInfo.child_name }}</el-descriptions-item>
                <el-descriptions-item label="家长姓名">{{ memberInfo.parent_name }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ memberInfo.phone }}</el-descriptions-item>
                <el-descriptions-item label="儿童年龄">{{ memberInfo.child_age }}岁</el-descriptions-item>
                <el-descriptions-item label="性别">{{ memberInfo.child_gender === 'male' ? '男' : '女' }}</el-descriptions-item>
              </el-descriptions>

              <h4 style="margin: 20px 0 10px">可用会员卡</h4>
              <div v-if="memberInfo.cards && memberInfo.cards.length > 0" class="card-list">
                <div
                  v-for="card in memberInfo.cards"
                  :key="card.id"
                  class="card-item"
                  :class="{ active: selectedCard?.id === card.id }"
                  @click="selectCard(card)"
                >
                  <div class="card-type">{{ card.card_type_name }}</div>
                  <div class="card-no">{{ card.card_no }}</div>
                  <div v-if="card.total_times" class="card-times">
                    剩余: {{ card.remaining_times }}/{{ card.total_times }}次
                  </div>
                  <div v-else class="card-valid">
                    有效期: {{ card.start_date }} 至 {{ card.end_date }}
                  </div>
                </div>
              </div>

              <div v-if="selectedCard" class="checkin-section">
                <h4>选择场次</h4>
                <el-radio-group v-model="selectedSession">
                  <el-radio
                    v-for="session in todaySessions"
                    :key="session.id"
                    :label="session.id"
                    :disabled="session.current_count >= session.max_capacity"
                  >
                    {{ session.session_name }} ({{ session.current_count }}/{{ session.max_capacity }})
                    <el-tag v-if="session.current_count >= session.max_capacity * 0.9" type="danger" size="small">
                      {{ session.current_count >= session.max_capacity ? '已满' : '即将满场' }}
                    </el-tag>
                  </el-radio>
                </el-radio-group>

                <el-button
                  type="primary"
                  size="large"
                  style="margin-top: 20px"
                  :disabled="!selectedSession"
                  @click="handleCheckin"
                >
                  确认核销入场
                </el-button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'walkin'" class="walkin-purchase">
            <h4>选择场次</h4>
            <el-radio-group v-model="walkinSession" style="margin-bottom: 20px">
              <el-radio
                v-for="session in todaySessions"
                :key="session.id"
                :label="session.id"
                :disabled="session.current_count >= session.max_capacity"
              >
                {{ session.session_name }} ({{ session.current_count }}/{{ session.max_capacity }})
                <el-tag v-if="session.current_count >= session.max_capacity * 0.9" type="danger" size="small">
                  {{ session.current_count >= session.max_capacity ? '已满' : '即将满场' }}
                </el-tag>
              </el-radio>
            </el-radio-group>

            <h4>选择票种</h4>
            <el-select v-model="walkinTicket" placeholder="请选择票种" style="width: 100%; margin-bottom: 20px">
              <el-option
                v-for="ticket in singleTickets"
                :key="ticket.id"
                :label="ticket.name + ' - ¥' + ticket.price"
                :value="ticket"
              />
            </el-select>

            <el-button
              type="primary"
              size="large"
              :disabled="!walkinSession || !walkinTicket"
              @click="handleWalkin"
            >
              确认购票 ¥{{ walkinTicket?.price || 0 }}
            </el-button>
          </div>

          <div v-if="activeTab === 'product'" class="product-purchase">
            <el-row :gutter="15">
              <el-col :span="8" v-for="product in products" :key="product.id">
                <el-card class="product-card" @click="selectProduct(product)">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-category">
                    {{ product.category === 'diy' ? 'DIY手工' : '电玩代币' }}
                  </div>
                  <div class="product-price">¥{{ product.price }}</div>
                  <div class="product-stock">库存: {{ product.stock }}</div>
                </el-card>
              </el-col>
            </el-row>

            <div v-if="selectedProduct" style="margin-top: 20px">
              <el-form :inline="true">
                <el-form-item label="技师">
                  <el-select v-model="selectedTechnician" placeholder="选择技师">
                    <el-option
                      v-for="tech in technicians"
                      :key="tech.id"
                      :label="tech.name"
                      :value="tech.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="数量">
                  <el-input-number v-model="productQty" :min="1" :max="selectedProduct.stock" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleProductPurchase">
                    确认消费 ¥{{ selectedProduct.price * productQty }}
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>快速操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" plain style="width: 100%; margin-bottom: 10px" @click="showNewMember = true">
              <el-icon><UserPlus /></el-icon>
              新会员注册
            </el-button>
            <el-button type="success" plain style="width: 100%; margin-bottom: 10px" @click="showNewCard = true">
              <el-icon><CreditCard /></el-icon>
              会员办卡
            </el-button>
          </div>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>今日场次状态</span>
          </template>
          <div class="session-status">
            <div v-for="session in todaySessions" :key="session.id" class="status-item">
              <div class="status-name">{{ session.session_name }}</div>
              <el-progress
                :percentage="Math.round((session.current_count / session.max_capacity) * 100)"
                :color="getProgressColor(session.current_count, session.max_capacity)"
              />
              <div class="status-count">{{ session.current_count }}/{{ session.max_capacity }}人</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showNewMember" title="新会员注册" width="500px">
      <el-form :model="newMemberForm" label-width="100px">
        <el-form-item label="儿童姓名">
          <el-input v-model="newMemberForm.child_name" />
        </el-form-item>
        <el-form-item label="儿童年龄">
          <el-input-number v-model="newMemberForm.child_age" :min="1" :max="18" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="newMemberForm.child_gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="家长姓名">
          <el-input v-model="newMemberForm.parent_name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="newMemberForm.phone" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="newMemberForm.address" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewMember = false">取消</el-button>
        <el-button type="primary" @click="handleCreateMember">确认注册</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showNewCard" title="会员办卡" width="500px">
      <el-form :model="newCardForm" label-width="100px">
        <el-form-item label="会员">
          <el-select v-model="newCardForm.member_id" placeholder="选择会员" filterable style="width: 100%">
            <el-option
              v-for="member in memberOptions"
              :key="member.id"
              :label="member.child_name + ' - ' + member.member_no"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="卡种">
          <el-select v-model="newCardForm.card_type_id" placeholder="选择卡种" style="width: 100%">
            <el-option
              v-for="type in cardTypes"
              :key="type.id"
              :label="type.name + ' - ¥' + type.price"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="导购员">
          <el-select v-model="newCardForm.salesperson_id" placeholder="选择导购员" style="width: 100%">
            <el-option
              v-for="emp in salespersons"
              :key="emp.id"
              :label="emp.name"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewCard = false">取消</el-button>
        <el-button type="primary" @click="handleCreateCard">确认办卡</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMemberByQr,
  getTodaySessions,
  getCardTypes,
  getProducts,
  getEmployees,
  getMembers,
  createMember,
  createMemberCard,
  consumeCard,
  walkInPurchase,
  createProductConsumption
} from '@/api'

const activeTab = ref('member')
const qrCode = ref('')
const memberInfo = ref(null)
const selectedCard = ref(null)
const selectedSession = ref(null)
const todaySessions = ref([])
const cardTypes = ref([])
const products = ref([])
const technicians = ref([])
const salespersons = ref([])
const memberOptions = ref([])

const walkinSession = ref(null)
const walkinTicket = ref(null)
const singleTickets = ref([])

const selectedProduct = ref(null)
const selectedTechnician = ref(null)
const productQty = ref(1)

const showNewMember = ref(false)
const showNewCard = ref(false)

const newMemberForm = reactive({
  child_name: '',
  child_age: 3,
  child_gender: 'male',
  parent_name: '',
  phone: '',
  address: ''
})

const newCardForm = reactive({
  member_id: null,
  card_type_id: null,
  salesperson_id: null
})

const searchMember = async () => {
  if (!qrCode.value) {
    ElMessage.warning('请输入会员号或扫描二维码')
    return
  }
  
  try {
    const res = await getMemberByQr(qrCode.value)
    if (res.success) {
      memberInfo.value = res.data
      selectedCard.value = null
      selectedSession.value = null
    }
  } catch (e) {
    ElMessage.error('未找到该会员')
  }
}

const selectCard = (card) => {
  selectedCard.value = card
  selectedSession.value = null
}

const handleCheckin = async () => {
  if (!selectedCard.value || !selectedSession.value) return
  
  try {
    await consumeCard(selectedCard.value.id, { session_id: selectedSession.value })
    ElMessage.success('核销成功')
    searchMember()
    loadSessions()
  } catch (e) {}
}

const handleWalkin = async () => {
  if (!walkinSession.value || !walkinTicket.value) return
  
  try {
    const res = await walkInPurchase({
      session_id: walkinSession.value,
      amount: walkinTicket.value.price
    })
    if (res.success) {
      ElMessage.success('购票成功')
      if (res.isNearFull) {
        ElMessage.warning('该场次即将满场！')
      }
      walkinSession.value = null
      walkinTicket.value = null
      loadSessions()
    }
  } catch (e) {}
}

const selectProduct = (product) => {
  selectedProduct.value = product
  productQty.value = 1
}

const handleProductPurchase = async () => {
  if (!selectedProduct.value || !selectedTechnician.value) {
    ElMessage.warning('请选择技师')
    return
  }
  
  try {
    await createProductConsumption({
      member_id: memberInfo.value?.id,
      product_id: selectedProduct.value.id,
      quantity: productQty.value,
      technician_id: selectedTechnician.value,
      amount: selectedProduct.value.price * productQty.value
    })
    ElMessage.success('消费成功')
    selectedProduct.value = null
    selectedTechnician.value = null
    loadProducts()
  } catch (e) {}
}

const handleCreateMember = async () => {
  try {
    const res = await createMember(newMemberForm)
    if (res.success) {
      ElMessage.success('注册成功')
      showNewMember.value = false
      Object.assign(newMemberForm, {
        child_name: '',
        child_age: 3,
        child_gender: 'male',
        parent_name: '',
        phone: '',
        address: ''
      })
      loadMembers()
    }
  } catch (e) {}
}

const handleCreateCard = async () => {
  try {
    const res = await createMemberCard(newCardForm)
    if (res.success) {
      ElMessage.success('办卡成功')
      showNewCard.value = false
      newCardForm.member_id = null
      newCardForm.card_type_id = null
      newCardForm.salesperson_id = null
    }
  } catch (e) {}
}

const loadSessions = async () => {
  const res = await getTodaySessions()
  if (res.success) {
    todaySessions.value = res.data
  }
}

const loadCardTypes = async () => {
  const res = await getCardTypes()
  if (res.success) {
    cardTypes.value = res.data
    singleTickets.value = res.data.filter(t => t.type === 'single')
  }
}

const loadProducts = async () => {
  const res = await getProducts({ status: 1 })
  if (res.success) {
    products.value = res.data
  }
}

const loadEmployees = async () => {
  const res = await getEmployees({ status: 1 })
  if (res.success) {
    technicians.value = res.data.filter(e => e.position === 'technician')
    salespersons.value = res.data.filter(e => e.position === 'sales')
  }
}

const loadMembers = async () => {
  const res = await getMembers({ pageSize: 100 })
  if (res.success) {
    memberOptions.value = res.data
  }
}

const getProgressColor = (current, max) => {
  const ratio = current / max
  if (ratio >= 0.9) return '#F56C6C'
  if (ratio >= 0.7) return '#E6A23C'
  return '#67C23A'
}

onMounted(() => {
  loadSessions()
  loadCardTypes()
  loadProducts()
  loadEmployees()
  loadMembers()
})
</script>

<style scoped lang="scss">
.cashier {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .member-info-card {
    .card-list {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      
      .card-item {
        padding: 15px;
        border: 2px solid #ebeef5;
        border-radius: 8px;
        cursor: pointer;
        min-width: 180px;
        transition: all 0.3s;
        
        &:hover, &.active {
          border-color: #409EFF;
          background: #ecf5ff;
        }
        
        .card-type {
          font-weight: bold;
          color: #303133;
          margin-bottom: 5px;
        }
        
        .card-no {
          font-size: 12px;
          color: #909399;
          margin-bottom: 10px;
        }
        
        .card-times, .card-valid {
          font-size: 13px;
          color: #606266;
        }
      }
    }
    
    .checkin-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
    }
  }
  
  .walkin-purchase {
    .el-radio {
      display: block;
      margin-bottom: 15px;
    }
  }
  
  .product-purchase {
    .product-card {
      cursor: pointer;
      text-align: center;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      }
      
      .product-name {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 5px;
      }
      
      .product-category {
        font-size: 12px;
        color: #909399;
        margin-bottom: 10px;
      }
      
      .product-price {
        font-size: 20px;
        color: #F56C6C;
        font-weight: bold;
      }
      
      .product-stock {
        font-size: 12px;
        color: #909399;
        margin-top: 5px;
      }
    }
  }
  
  .quick-actions {
    .el-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
  }
  
  .session-status {
    .status-item {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .status-name {
        font-weight: 500;
        margin-bottom: 10px;
      }
      
      .status-count {
        text-align: right;
        font-size: 14px;
        color: #606266;
        margin-top: 5px;
      }
    }
  }
}
</style>
