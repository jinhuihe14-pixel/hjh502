<template>
  <div class="members-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>会员列表</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增会员
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索会员姓名、电话、会员号"
          clearable
          style="width: 300px"
          @keyup.enter="loadMembers"
        />
        <el-button type="primary" @click="loadMembers">搜索</el-button>
      </div>

      <el-table :data="members" border>
        <el-table-column prop="member_no" label="会员号" width="150" />
        <el-table-column prop="child_name" label="儿童姓名" width="120" />
        <el-table-column prop="child_age" label="年龄" width="80">
          <template #default="{ row }">
            {{ row.child_age }}岁
          </template>
        </el-table-column>
        <el-table-column prop="child_gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.child_gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="parent_name" label="家长姓名" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="created_at" label="注册时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">详情</el-button>
            <el-button type="primary" link @click="editMember(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadMembers"
        @current-change="loadMembers"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑会员' : '新增会员'" width="500px">
      <el-form :model="memberForm" label-width="100px">
        <el-form-item label="儿童姓名">
          <el-input v-model="memberForm.child_name" />
        </el-form-item>
        <el-form-item label="儿童年龄">
          <el-input-number v-model="memberForm.child_age" :min="1" :max="18" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="memberForm.child_gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="家长姓名">
          <el-input v-model="memberForm.parent_name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="memberForm.phone" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="memberForm.address" type="textarea" />
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMembers, createMember, updateMember } from '@/api'

const router = useRouter()

const members = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')

const showAddDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const memberForm = reactive({
  child_name: '',
  child_age: 3,
  child_gender: 'male',
  parent_name: '',
  phone: '',
  address: ''
})

const loadMembers = async () => {
  const res = await getMembers({
    keyword: searchKeyword.value,
    page: currentPage.value,
    pageSize: pageSize.value
  })
  if (res.success) {
    members.value = res.data
    total.value = res.total
  }
}

const viewDetail = (id) => {
  router.push(`/members/${id}`)
}

const editMember = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(memberForm, {
    child_name: row.child_name,
    child_age: row.child_age,
    child_gender: row.child_gender,
    parent_name: row.parent_name,
    phone: row.phone,
    address: row.address
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await updateMember(editId.value, memberForm)
      ElMessage.success('编辑成功')
    } else {
      await createMember(memberForm)
      ElMessage.success('新增成功')
    }
    showAddDialog.value = false
    loadMembers()
    resetForm()
  } catch (e) {}
}

const resetForm = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(memberForm, {
    child_name: '',
    child_age: 3,
    child_gender: 'male',
    parent_name: '',
    phone: '',
    address: ''
  })
}

onMounted(() => {
  loadMembers()
})
</script>

<style scoped lang="scss">
.members-page {
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
