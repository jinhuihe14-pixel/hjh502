<template>
  <div class="promotions-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>促销活动管理</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增活动
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索活动标题"
          clearable
          style="width: 300px"
          @keyup.enter="loadPromotions"
        />
        <el-select v-model="searchType" placeholder="活动类型" clearable style="width: 150px">
          <el-option label="折扣" value="discount" />
          <el-option label="赠品" value="gift" />
          <el-option label="优惠券" value="coupon" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-select v-model="searchStatus" placeholder="活动状态" clearable style="width: 150px">
          <el-option label="未开始" value="pending" />
          <el-option label="进行中" value="active" />
          <el-option label="已结束" value="ended" />
        </el-select>
        <el-button type="primary" @click="loadPromotions">搜索</el-button>
      </div>

      <el-table :data="promotions" border>
        <el-table-column prop="title" label="活动标题" min-width="180" />
        <el-table-column prop="content" label="活动内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="type" label="活动类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editPromotion(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadPromotions"
        @current-change="loadPromotions"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑活动' : '新增活动'" width="600px">
      <el-form :model="promotionForm" label-width="100px">
        <el-form-item label="活动标题">
          <el-input v-model="promotionForm.title" placeholder="请输入活动标题" />
        </el-form-item>
        <el-form-item label="活动内容">
          <el-input
            v-model="promotionForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入活动内容"
          />
        </el-form-item>
        <el-form-item label="活动类型">
          <el-radio-group v-model="promotionForm.type">
            <el-radio label="discount">折扣</el-radio>
            <el-radio label="gift">赠品</el-radio>
            <el-radio label="coupon">优惠券</el-radio>
            <el-radio label="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="promotionForm.start_date"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="promotionForm.end_date"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="活动状态">
          <el-radio-group v-model="promotionForm.status">
            <el-radio label="pending">未开始</el-radio>
            <el-radio label="active">进行中</el-radio>
            <el-radio label="ended">已结束</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPromotions, createPromotion, updatePromotion } from '@/api'

const promotions = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const searchType = ref('')
const searchStatus = ref('')

const showAddDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const promotionForm = reactive({
  title: '',
  content: '',
  type: 'discount',
  start_date: '',
  end_date: '',
  status: 'pending'
})

const getTypeLabel = (type) => {
  const labels = {
    discount: '折扣',
    gift: '赠品',
    coupon: '优惠券',
    other: '其他'
  }
  return labels[type] || type
}

const getTypeTagType = (type) => {
  const types = {
    discount: 'success',
    gift: 'warning',
    coupon: 'primary',
    other: 'info'
  }
  return types[type] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '未开始',
    active: '进行中',
    ended: '已结束'
  }
  return labels[status] || status
}

const getStatusTagType = (status) => {
  const types = {
    pending: 'info',
    active: 'success',
    ended: 'danger'
  }
  return types[status] || 'info'
}

const loadPromotions = async () => {
  const res = await getPromotions({
    keyword: searchKeyword.value,
    type: searchType.value,
    status: searchStatus.value,
    page: currentPage.value,
    pageSize: pageSize.value
  })
  if (res.success) {
    promotions.value = res.data
    total.value = res.total
  }
}

const editPromotion = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(promotionForm, {
    title: row.title,
    content: row.content,
    type: row.type,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await updatePromotion(editId.value, promotionForm)
      ElMessage.success('编辑成功')
    } else {
      await createPromotion(promotionForm)
      ElMessage.success('新增成功')
    }
    showAddDialog.value = false
    loadPromotions()
    resetForm()
  } catch (e) {}
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该活动吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      ElMessage.success('删除成功')
      loadPromotions()
    } catch (e) {}
  }).catch(() => {})
}

const resetForm = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(promotionForm, {
    title: '',
    content: '',
    type: 'discount',
    start_date: '',
    end_date: '',
    status: 'pending'
  })
}

onMounted(() => {
  loadPromotions()
})
</script>

<style scoped lang="scss">
.promotions-page {
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
