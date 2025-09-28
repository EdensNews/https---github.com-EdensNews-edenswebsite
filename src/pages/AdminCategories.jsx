import { useState, useEffect, useCallback } from 'react';
import { categoriesRepo } from '@/api/repos/categoriesRepo';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCategories() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminCategoriesContent />
    </ProtectedRoute>
  );
}

function AdminCategoriesContent() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name_en: '', name_kn: '', slug: '' });

  const { language } = useLanguage();
  const { toast } = useToast();

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCategories = await categoriesRepo.list();
      setCategories(fetchedCategories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({ title: 'Failed to load categories', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name_en: '', name_kn: '', slug: '' });
  };

  const handleSave = async () => {
    if (!formData.name_en || !formData.name_kn) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const slug = formData.slug || generateSlug(formData.name_en);
    const payload = { name: formData.name_en, name_kn: formData.name_kn, slug };
    try {
      if (editingCategory?.id) {
        await categoriesRepo.update(editingCategory.id, payload);
        toast({ title: 'Category updated' });
      } else {
        await categoriesRepo.create(payload);
        toast({ title: 'Category created' });
      }
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast({ title: 'Failed to save category', variant: 'destructive' });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name_en: category.name || category.name_en || '',
      name_kn: category.name_kn || '',
      slug: category.slug || ''
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await categoriesRepo.remove(id);
      toast({ title: 'Category deleted' });
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl('Admin')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className={`text-3xl font-bold text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
          {language === 'kn' ? 'ವರ್ಗ ನಿರ್ವಹಣೆ' : 'Category Management'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className={`text-gray-200 ${language === 'kn' ? 'font-kannada' : ''}`}>
                {editingCategory ? (language === 'kn' ? 'ವರ್ಗ ಸಂಪಾದಿಸಿ' : 'Edit Category') : (language === 'kn' ? 'ಹೊಸ ವರ್ಗ ಸೇರಿಸಿ' : 'Add New Category')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className={`text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>{language === 'kn' ? 'ಇಂಗ್ಲಿಷ್ ಹೆಸರು *' : 'English Name *'}</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, name_en: value, slug: generateSlug(value) });
                  }}
                  placeholder="Politics"
                />
              </div>
              <div>
                <Label className={`text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>{language === 'kn' ? 'ಕನ್ನಡ ಹೆಸರು *' : 'Kannada Name *'}</Label>
                <Input
                  value={formData.name_kn}
                  onChange={(e) => setFormData({ ...formData, name_kn: e.target.value })}
                  placeholder="ರಾಜಕೀಯ"
                  className="font-kannada"
                />
              </div>
              <div>
                <Label className={`text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>{language === 'kn' ? 'URL ಸ್ಲಗ್' : 'URL Slug'}</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="politics" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 flex-1">
                  <Save className="w-4 h-4 mr-2" /> {editingCategory ? (language === 'kn' ? 'ಅಪ್‌ಡೇಟ್' : 'Update') : (language === 'kn' ? 'ಸೇರಿಸಿ' : 'Add')}
                </Button>
                {editingCategory && (
                  <Button onClick={resetForm} variant="outline">{language === 'kn' ? 'ರದ್ದು' : 'Cancel'}</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className={`text-gray-200 ${language === 'kn' ? 'font-kannada' : ''}`}>
                {language === 'kn' ? 'ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ವರ್ಗಗಳು' : 'Existing Categories'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}</div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-200">
                          {language === 'kn' ? (category.name_kn || category.name || category.slug) : (category.name || category.name_kn || category.slug)}
                        </h3>
                        <p className="text-sm text-gray-400">Slug: {category.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(category)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(category.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className={`text-center text-gray-400 py-8 ${language === 'kn' ? 'font-kannada' : ''}`}>
                      {language === 'kn' ? 'ಯಾವುದೇ ವರ್ಗಗಳಿಲ್ಲ' : 'No categories found'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}