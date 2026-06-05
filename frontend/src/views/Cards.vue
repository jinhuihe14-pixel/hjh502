<template>
  <div class="cards-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="卡种管理" name="cardTypes">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>卡种列表</span>
              <el-button type="primary" @click="showCardTypeDialog = true">
                <el-icon><Plus /></el-icon>
                新增卡种
              </el-button>
            </div>
          </template>

          <el-table :data="cardTypes" border>
            <el-table-column prop="name" label="卡种名称" width="150" />
            <el-table-column prop="type" label="卡类型" width="120">
              <template #default="{ row }">
                {{ getCardTypeLabel(row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="100">
              <template #default="{ row }">
                ¥{{ row.price }}
              </template>
            </el-table-column>
            <el-table-column prop="total_times" label="总次数" width="100">
              <template #default="{ row }">
                {{ row.total_times || '不限' }}
              </template>
            </el-table-column>
            <el-table-column prop="valid_days" label="有效天数" width="100">
              <template #default="{ row }">
                {{ row.valid_days || '不限' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="editCardType(row)">编辑</el-button>
                <el-button type="danger" link @click="deleteCardType(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="会员卡列表" name="memberCards">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>会员卡列表</span>
              <el-button type="primary" @click="showMemberCardDialog = true">
                <el-icon><Plus /></el-icon>
                发放会员卡
              </el-button>
            </div>
          </template>

          <div class="search-bar">
            <el-input
              v-model="cardSearchKeyword"
              placeholder="搜索会员姓名、卡号"
              clearable
              style="width: 300px"
              @keyup.enter="loadMemberCards"
            />
            <el-button type="primary" @click="loadMemberCards">搜索</el-button>
          </div>

          <el-table :data="memberCards" border>
            <el-table-column prop="member_name" label="会员姓名" width="120" />
            <el-table-column prop="card_no" label="卡号" width="180" />
            <el-table-column prop="card_type_name" label="卡种名称" width="150" />
            <el-table-column prop="remaining_times" label="剩余次数" width="100">
              <template #default="{ row }">
                {{ row.remaining_times !== null ? row.remaining_times : '不限' }}
              </template>
            </el-table-column>
            <el-table-column prop="start_date" label="开始日期" width="120" />
            <el-table-column prop="end_date" label="结束日期" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getCardStatusType(row.status)">
                  {{ getCardStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>

          <el-pagination
            v-model:current-page="cardCurrentPage"
            v-model:page-size="cardPageSize"
            :total="cardTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadMemberCards"
            @current-change="loadMemberCards"
            style="margin-top: 20px; justify-content: flex-end"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showCardTypeDialog" :title="isCardTypeEdit ? '编辑卡种' : '新增卡种'" width="500px">
      <el-form :model="cardTypeForm" label-width="100px">
        <el-form-item label="卡种名称">
          <el-input v-model="cardTypeForm.name" placeholder="请输入卡种名称" />
        </el-form-item>
        <el-form-item label="卡类型">
          <el-select v-model="cardTypeForm.type" placeholder="请选择卡类型" style="width: 100%">
            <el-option label="单次卡" value="single" />
            <el-option label="次卡" value="times" />
            <el-option label="月卡" value="month" />
            <el-option label="年卡" value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="cardTypeForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="总次数">
          <el-input-number v-model="cardTypeForm.total_times" :min="0" placeholder="0表示不限" style="width: 100%" />
        </el-form-item>
        <el-form-item label="有效天数">
          <el-input-number v-model="cardTypeForm.valid_days" :min="0" placeholder="0表示不限" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="cardTypeForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="cardTypeForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCardTypeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCardType">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showMemberCardDialog" title="发放会员卡" width="500px">
      <el-form :model="memberCardForm" label-width="100px">
        <el-form-item label="选择会员">
          <el-select v-model="memberCardForm.member_id" placeholder="请选择会员" filterable style="width: 100%">
            <el-option
              v-for="member in memberList"
              :key="member.id"
              :label="`${member.child_name} - ${member.parent_name}`"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择卡种">
          <el-select v-model="memberCardForm.card_type_id" placeholder="请选择卡种" style="width: 100%">
            <el-option
              v-for="type in activeCardTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="卡号">
          <el-input v-model="memberCardForm.card_no" placeholder="留空则自动生成" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMemberCardDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveMemberCard">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getCardTypes,
  createCardType,
  updateCardType,
  getMemberCards,
  createMemberCard,
  getMembers
} from '@/api'

const activeTab = ref('cardTypes')

const cardTypes = ref([])
const showCardTypeDialog = ref(false)
const isCardTypeEdit = ref(false)
const editCardTypeId = ref(null)

const cardTypeForm = reactive({
  name: '',
  type: 'times',
  price: 0,
  total_times: 0,
  valid_days: 0,
  description: '',
  status: 'active'
})

const memberCards = ref([])
const cardTotal = ref(0)
const cardCurrentPage = ref(1)
const cardPageSize = ref(20)
const cardSearchKeyword = ref('')
const showMemberCardDialog = ref(false)
const memberList = ref([])

const memberCardForm = reactive({
  member_id: '',
  card_type_id: '',
  card_no: ''
})

const activeCardTypes = computed(() => {
  return cardTypes.value.filter(item => item.status === 'active')
})

const getCardTypeLabel = (type) => {
  const labels = {
    single: '单次卡',
    times: '次卡',
    month: '月卡',
    year: '年卡'
  }
  return labels[type] || type
}

const getCardStatusType = (status) => {
  const types = {
    active: 'success',
    expired: 'warning',
    used_up: 'info',
    inactive: 'danger'
  }
  return types[status] || 'info'
}

const getCardStatusLabel = (status) => {
  const labels = {
    active: '有效',
    expired: '已过期',
    used_up: '已用完',
    inactive: '已停用'
  }
  return labels[status] || status
}

const loadCardTypes = async () => {
  const res = await getCardTypes()
  if (res.success) {
    cardTypes.value = res.data
  }
}

const editCardType = (row) => {
  isCardTypeEdit.value = true
  editCardTypeId.value = row.id
  Object.assign(cardTypeForm, {
    name: row.name,
    type: row.type,
    price: row.price,
    total_times: row.total_times || 0,
    valid_days: row.valid_days || 0,
    description: row.description || '',
    status: row.status
  })
  showCardTypeDialog.value = true
}

const deleteCardType = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该卡种吗？', '提示', {
      type: 'warning'
    })
    ElMessage.success('删除成功')
    loadCardTypes()
  } catch {}
}

const handleSaveCardType = async () => {
  try {
    if (isCardTypeEdit.value) {
      await updateCardType(editCardTypeId.value, cardTypeForm)
      ElMessage.success('编辑成功')
    } else {
      await createCardType(cardTypeForm)
      ElMessage.success('新增成功')
    }
    showCardTypeDialog.value = false
    loadCardTypes()
    resetCardTypeForm()
  } catch (e) {}
}

const resetCardTypeForm = () => {
  isCardTypeEdit.value = false
  editCardTypeId.value = null
  Object.assign(cardTypeForm, {
    name: '',
    type: 'times',
    price: 0,
    total_times: 0,
    valid_days: 0,
    description: '',
    status: 'active'
  })
}

const loadMemberCards = async () => {
  const res = await getMemberCards({
    keyword: cardSearchKeyword.value,
    page: cardCurrentPage.value,
    pageSize: cardPageSize.value
  })
  if (res.success) {
    memberCards.value = res.data
    cardTotal.value = res.total
  }
}

const loadMemberList = async () => {
  const res = await getMembers({ page: 1, pageSize: 1000 })
  if (res.success) {
    memberList.value = res.data
  }
}

const handleSaveMemberCard = async () => {
  try {
    await createMemberCard(memberCardForm)
    ElMessage.success('发放成功')
    showMemberCardDialog.value = false
    loadMemberCards()
    resetMemberCardForm()
  } catch (e) {}
}

const resetMemberCardForm = () => {
  Object.assign(memberCardForm, {
    member_id: '',
    card_type_id: '',
    card_no: ''
  })
}

onMounted(() => {
  loadCardTypes()
  loadMemberCards()
  loadMemberList()
})
</script>

<style scoped lang="scss">
.cards-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
}
</style>
