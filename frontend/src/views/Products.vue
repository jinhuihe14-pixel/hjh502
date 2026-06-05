<template>
  <div class="products-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>产品管理</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增产品
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索产品名称"
          clearable
          style="width: 300px"
          @keyup.enter="loadProducts"
        />
        <el-select v-model="searchCategory" placeholder="选择分类" clearable style="width: 150px" @change="loadProducts">
          <el-option label="饮品" value="drink" />
          <el-option label="食品" value="food" />
          <el-option label="玩具" value="toy" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-button type="primary" @click="loadProducts">搜索</el-button>
      </div>

      <el-table :data="products" border>
        <el-table-column prop="name" label="产品名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)">
              {{ getCategoryLabel(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="commission_amount" label="佣金" width="100">
          <template #default="{ row }">
            ¥{{ row.commission_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editProduct(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadProducts"
        @current-change="loadProducts"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑产品' : '新增产品'" width="500px">
      <el-form :model="productForm" label-width="100px">
        <el-form-item label="产品名称">
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="productForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="饮品" value="drink" />
            <el-option label="食品" value="food" />
            <el-option label="玩具" value="toy" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="productForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="佣金金额">
          <el-input-number v-model="productForm.commission_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="productForm.stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="productForm.status">
            <el-radio label="active">上架</el-radio>
            <el-radio label="inactive">下架</el-radio>
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
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getProducts, createProduct, updateProduct } from '@/api'

const products = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const searchCategory = ref('')

const showAddDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const productForm = reactive({
  name: '',
  category: 'drink',
  price: 0,
  commission_amount: 0,
  stock: 0,
  status: 'active'
})

const loadProducts = async () => {
  const res = await getProducts({
    keyword: searchKeyword.value,
    category: searchCategory.value,
    page: currentPage.value,
    pageSize: pageSize.value
  })
  if (res.success) {
    products.value = res.data
    total.value = res.total
  }
}

const getCategoryLabel = (category) => {
  const labels = {
    drink: '饮品',
    food: '食品',
    toy: '玩具',
    other: '其他'
  }
  return labels[category] || category
}

const getCategoryType = (category) => {
  const types = {
    drink: 'primary',
    food: 'success',
    toy: 'warning',
    other: 'info'
  }
  return types[category] || 'info'
}

const editProduct = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(productForm, {
    name: row.name,
    category: row.category,
    price: row.price,
    commission_amount: row.commission_amount,
    stock: row.stock,
    status: row.status
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await updateProduct(editId.value, productForm)
      ElMessage.success('编辑成功')
    } else {
      await createProduct(productForm)
      ElMessage.success('新增成功')
    }
    showAddDialog.value = false
    loadProducts()
    resetForm()
  } catch (e) {}
}

const resetForm = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(productForm, {
    name: '',
    category: 'drink',
    price: 0,
    commission_amount: 0,
    stock: 0,
    status: 'active'
  })
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped lang="scss">
.products-page {
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
