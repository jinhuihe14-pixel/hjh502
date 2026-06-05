<template>
  <div class="member-detail">
    <el-page-header @back="$router.back()" content="会员详情" />
    
    <el-card style="margin-top: 20px" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-button type="primary" size="small" @click="showEditDialog = true">编辑</el-button>
        </div>
      </template>
      
      <el-descriptions :column="3" border>
        <el-descriptions-item label="会员编号">{{ member?.member_no }}</el-descriptions-item>
        <el-descriptions-item label="儿童姓名">{{ member?.child_name }}</el-descriptions-item>
        <el-descriptions-item label="儿童年龄">{{ member?.child_age }}岁</el-descriptions-item>
        <el-descriptions-item label="性别">{{ member?.child_gender === 'male' ? '男' : '女' }}</el-descriptions-item>
        <el-descriptions-item label="家长姓名">{{ member?.parent_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ member?.phone }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ member?.address }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ member?.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>会员卡</span>
          <el-button type="primary" size="small" @click="showNewCardDialog = true">办卡</el-button>
        </div>
      </template>
      
      <el-table :data="member?.cards || []" border>
        <el-table-column prop="card_no" label="卡号" width="180" />
        <el-table-column prop="card_type_name" label="卡种" />
        <el-table-column label="剩余次数">
          <template #default="{ row }">
            {{ row.total_times ? row.remaining_times + '/' + row.total_times : '不限次数' }}
          </template>
        </el-table-column>
        <el-table-column label="有效期">
          <template #default="{ row }">
            {{ row.start_date }} 至 {{ row.end_date }}
          </template>
        </el-table-column>
        <el-table-column prop="salesperson_name" label="办卡导购" />
        <el-table-column prop="created_at" label="办卡时间" width="180" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '有效' : '已失效' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>消费记录</span>
      </template>
      
      <el-table :data="member?.records || []" border>
        <el-table-column prop="consumption_type" label="类型" width="100">
          <template #default="{ row }">
            {{ getTypeLabel(row.consumption_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="session_name" label="场次" />
        <el-table-column prop="product_name" label="商品" />
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">
            {{ row.amount > 0 ? '¥' + row.amount : '免费' }}
          </template>
        </el-table-column>
        <el-table-column prop="technician_name" label="技师" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>

    <el-dialog v-model="showEditDialog" title="编辑会员" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="儿童姓名">
          <el-input v-model="editForm.child_name" />
        </el-form-item>
        <el-form-item label="儿童年龄">
          <el-input-number v-model="editForm.child_age" :min="1" :max="18" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.child_gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="家长姓名">
          <el-input v-model="editForm.parent_name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.phone" />
        </elel-form-item>
        <el-form-item label="地址">
          <el-input v-model="editForm.address" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showNewCardDialog" title="会员办卡" width="500px">
      <el-form :model="newCardForm" label-width="100px">
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
        <el-button @click="showNewCardDialog = false">取消</el-button>
        <el-button type="primary" @click="handleNewCard">确认办卡</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMember, updateMember, createMemberCard, getCardTypes, getEmployees } from '@/api'

const route = useRoute()

const member = ref(null)
const loading = ref(false)
const showEditDialog = ref(false)
const showNewCardDialog = ref(false)
const cardTypes = ref([])
const salespersons = ref([])

const editForm = reactive({
  child_name: '',
  child_age: 3,
  child_gender: 'male',
  parent_name: '',
  phone: '',
  address: ''
})

const newCardForm = reactive({
  card_type_id: null,
  salesperson_id: null
})

const loadMember = async () => {
  loading.value = true
  try {
    const res = await getMember(route.params.id)
    if (res.success) {
      member.value = res.data
      Object.assign(editForm, {
        child_name: res.data.child_name,
        child_age: res.data.child_age,
        child_gender: res.data.child_gender,
        parent_name: res.data.parent_name,
        phone: res.data.phone,
        address: res.data.address
      })
    }
  } finally {
    loading.value = false
  }
}

const loadCardTypes = async () => {
  const res = await getCardTypes()
  if (res.success) {
    cardTypes.value = res.data
  }
}

const loadSalespersons = async () => {
  const res = await getEmployees({ position: 'sales' })
  if (res.success) {
    salespersons.value = res.data
  }
}

const handleSave = async () => {
  try {
    await updateMember(route.params.id, editForm)
    ElMessage.success('编辑成功')
    showEditDialog.value = false
    loadMember()
  } catch (e) {}
}

const handleNewCard = async () => {
  try {
    await createMemberCard({
      member_id: route.params.id,
      card_type_id: newCardForm.card_type_id,
      salesperson_id: newCardForm.salesperson_id
    })
    ElMessage.success('办卡成功')
    showNewCardDialog.value = false
    newCardForm.card_type_id = null
    newCardForm.salesperson_id = null
    loadMember()
  } catch (e) {}
}

const getTypeLabel = (type) => {
  const labels = {
    'play': '会员核销',
    'walk-in': '散客购票',
    'product': '商品消费'
  }
  return labels[type] || type
}

onMounted(() => {
  loadMember()
  loadCardTypes()
  loadSalespersons()
})
</script>

<style scoped>
.member-detail {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
