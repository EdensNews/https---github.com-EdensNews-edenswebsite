import React, { useState, useEffect, useCallback } from 'react';
import { categoriesRepo } from '@/api/repos/categoriesRepo';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Save, ArrowLeft, Trash2, Edit } from 'lucide-react';
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
    const [formData, setFormData] = useState({
        name: '',
        slug: ''
    });
    
    const { language } = useLanguage();
    const { toast } = useToast();

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedCategories = await categoriesRepo.list();
            setCategories(fetchedCategories);
        } catch (error) {
            console.error('Failed to load categories:', error);
            toast({ title: "Failed to load categories", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);
    const generateSlug = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleSave = async () => {
        if (!formData.name_en || !formData.name_kn) {
            toast({ title: "Please fill all required fields", variant: "destructive" });
            return;
        }

        const slug = formData.slug || generateSlug(formData.name_en);
        // Only send columns that exist: name, name_kn, slug
        const categoryData = {
            name: formData.name_en,
            name_kn: formData.name_kn,
            slug
        };

        try {
            if (editingCategory) {
                await categoriesRepo.update(editingCategory.id, categoryData);
                toast({ title: "Category updated successfully!" });
{{ ... }}
                                <Input
                                    value={formData.name_en}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({
                                            ...formData,
                                            name_en: value,
                                            slug: generateSlug(value)
                                        });
                                    }}
                                    placeholder="Politics"
                                />
                            </div>
{{ ... }}
                                <div className="space-y-4">
                                    {categories.map((category) => (
                                        <div key={category.id} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                                            <div>
                                                <h3 className="font-medium text-gray-200">
                                                    {language === 'kn' ? (category.name_kn || category.name || category.slug) : (category.name || category.name_kn || category.slug)}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    Slug: {category.slug}
                                                </p>
                                            </div>
{{ ... }}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleEdit(category)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleDelete(category.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
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