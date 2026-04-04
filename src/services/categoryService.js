import { supabase } from '../lib/supabase';

class CategoryService {
  async getCategories(companyId) {
    try {
      const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] = await Promise.all([
        supabase.from('categories').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabase.from('products').select('category, quantity').eq('company_id', companyId),
      ]);

      if (categoriesError) throw categoriesError;
      if (productsError) throw productsError;

      const countMap = new Map();
      for (const product of products || []) {
        const key = product?.category || '';
        if (!key) continue;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }

      return (categories || []).map((category) => this.convertToCamelCase(category, countMap.get(category?.name) || 0));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async createCategory(categoryData, companyId) {
    try {
      const payload = {
        ...this.convertToSnakeCase(categoryData),
        company_id: companyId,
      };

      const { data, error } = await supabase.from('categories').insert(payload).select().single();
      if (error) throw error;
      return this.convertToCamelCase(data, 0);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(categoryId, categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(this.convertToSnakeCase(categoryData))
        .eq('id', categoryId)
        .select()
        .single();
      if (error) throw error;
      return this.convertToCamelCase(data, categoryData?.productCount || 0);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async renameCategoryProducts(companyId, oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;
    const { error } = await supabase
      .from('products')
      .update({ category: newName })
      .eq('company_id', companyId)
      .eq('category', oldName);
    if (error) throw error;
  }

  async deleteCategory(categoryId) {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) throw error;
  }

  async countProductsForCategory(companyId, categoryName) {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('category', categoryName);
    if (error) throw error;
    return count || 0;
  }

  convertToCamelCase(category, productCount = 0) {
    return {
      id: category?.id,
      companyId: category?.company_id,
      name: category?.name,
      description: category?.description,
      color: category?.color,
      icon: category?.icon,
      productCount,
      createdAt: category?.created_at,
      updatedAt: category?.updated_at || category?.created_at,
      parentCategory: null,
    };
  }

  convertToSnakeCase(category) {
    const out = {};
    if (category?.name !== undefined) out.name = category.name;
    if (category?.description !== undefined) out.description = category.description;
    if (category?.color !== undefined) out.color = category.color;
    if (category?.icon !== undefined) out.icon = category.icon;
    return out;
  }
}

export default new CategoryService();
