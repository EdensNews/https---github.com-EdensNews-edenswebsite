import { useState, useEffect } from 'react';
import { scheduleRepo } from '@/api/repos/scheduleRepo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AdminSchedule() {
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        day_of_week: 1,
        day_name_en: '',
        day_name_kn: '',
        start_time: '',
        end_time: '',
        show_name_en: '',
        show_name_kn: '',
        show_name_ta: '',
        show_name_te: '',
        show_name_hi: '',
        show_name_ml: '',
        is_active: true,
        display_order: 0
    });

    const daysOfWeek = [
        { value: 0, label: 'Sunday', kn: 'ಭಾನುವಾರ' },
        { value: 1, label: 'Monday', kn: 'ಸೋಮವಾರ' },
        { value: 2, label: 'Tuesday', kn: 'ಮಂಗಳವಾರ' },
        { value: 3, label: 'Wednesday', kn: 'ಬುಧವಾರ' },
        { value: 4, label: 'Thursday', kn: 'ಗುರುವಾರ' },
        { value: 5, label: 'Friday', kn: 'ಶುಕ್ರವಾರ' },
        { value: 6, label: 'Saturday', kn: 'ಶನಿವಾರ' }
    ];

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setIsLoading(true);
        try {
            const data = await scheduleRepo.list();
            setSchedules(data);
        } catch (error) {
            console.error('Failed to load schedules:', error);
            toast({
                title: 'Error',
                description: 'Failed to load broadcast schedules',
                variant: 'destructive'
            });
        }
        setIsLoading(false);
    };

    const handleAdd = () => {
        setIsAdding(true);
        setFormData({
            day_of_week: 1,
            day_name_en: 'Monday',
            day_name_kn: 'ಸೋಮವಾರ',
            start_time: '18:00',
            end_time: '20:00',
            show_name_en: '',
            show_name_kn: '',
            show_name_ta: '',
            show_name_te: '',
            show_name_hi: '',
            show_name_ml: '',
            is_active: true,
            display_order: schedules.length + 1
        });
    };

    const handleEdit = (schedule) => {
        setEditingId(schedule.id);
        setFormData({
            day_of_week: schedule.day_of_week,
            day_name_en: schedule.day_name_en,
            day_name_kn: schedule.day_name_kn || '',
            start_time: schedule.start_time.slice(0, 5), // HH:MM format
            end_time: schedule.end_time.slice(0, 5),
            show_name_en: schedule.show_name_en,
            show_name_kn: schedule.show_name_kn || '',
            show_name_ta: schedule.show_name_ta || '',
            show_name_te: schedule.show_name_te || '',
            show_name_hi: schedule.show_name_hi || '',
            show_name_ml: schedule.show_name_ml || '',
            is_active: schedule.is_active,
            display_order: schedule.display_order
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsAdding(false);
        setFormData({
            day_of_week: 1,
            day_name_en: '',
            day_name_kn: '',
            start_time: '',
            end_time: '',
            show_name_en: '',
            show_name_kn: '',
            show_name_ta: '',
            show_name_te: '',
            show_name_hi: '',
            show_name_ml: '',
            is_active: true,
            display_order: 0
        });
    };

    const handleSave = async () => {
        try {
            const dataToSave = {
                ...formData,
                start_time: `${formData.start_time}:00`,
                end_time: `${formData.end_time}:00`
            };

            if (isAdding) {
                await scheduleRepo.create(dataToSave);
                toast({
                    title: 'Success',
                    description: 'Schedule added successfully'
                });
            } else if (editingId) {
                await scheduleRepo.update(editingId, dataToSave);
                toast({
                    title: 'Success',
                    description: 'Schedule updated successfully'
                });
            }

            handleCancel();
            loadSchedules();
        } catch (error) {
            console.error('Failed to save schedule:', error);
            toast({
                title: 'Error',
                description: 'Failed to save schedule',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        try {
            await scheduleRepo.delete(id);
            toast({
                title: 'Success',
                description: 'Schedule deleted successfully'
            });
            loadSchedules();
        } catch (error) {
            console.error('Failed to delete schedule:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete schedule',
                variant: 'destructive'
            });
        }
    };

    const handleDayChange = (value) => {
        const day = daysOfWeek.find(d => d.value === parseInt(value));
        setFormData({
            ...formData,
            day_of_week: parseInt(value),
            day_name_en: day.label,
            day_name_kn: day.kn
        });
    };

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-red-600" />
                    <h1 className="text-3xl font-bold">Broadcast Schedule Management</h1>
                </div>
                <Button onClick={handleAdd} disabled={isAdding || editingId}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
                </Button>
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>{isAdding ? 'Add New Schedule' : 'Edit Schedule'}</CardTitle>
                        <CardDescription>Fill in the broadcast schedule details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Day of Week */}
                            <div>
                                <Label>Day of Week</Label>
                                <Select value={formData.day_of_week.toString()} onValueChange={handleDayChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {daysOfWeek.map(day => (
                                            <SelectItem key={day.value} value={day.value.toString()}>
                                                {day.label} ({day.kn})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Start Time */}
                            <div>
                                <Label>Start Time</Label>
                                <Input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                />
                            </div>

                            {/* End Time */}
                            <div>
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                />
                            </div>

                            {/* Display Order */}
                            <div>
                                <Label>Display Order</Label>
                                <Input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Show Names */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg">Show Names (Multilingual)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>English</Label>
                                    <Input
                                        value={formData.show_name_en}
                                        onChange={(e) => setFormData({ ...formData, show_name_en: e.target.value })}
                                        placeholder="Evening News"
                                    />
                                </div>
                                <div>
                                    <Label>Kannada</Label>
                                    <Input
                                        value={formData.show_name_kn}
                                        onChange={(e) => setFormData({ ...formData, show_name_kn: e.target.value })}
                                        placeholder="ಸಂಜೆ ಸುದ್ದಿ"
                                    />
                                </div>
                                <div>
                                    <Label>Tamil</Label>
                                    <Input
                                        value={formData.show_name_ta}
                                        onChange={(e) => setFormData({ ...formData, show_name_ta: e.target.value })}
                                        placeholder="மாலை செய்திகள்"
                                    />
                                </div>
                                <div>
                                    <Label>Telugu</Label>
                                    <Input
                                        value={formData.show_name_te}
                                        onChange={(e) => setFormData({ ...formData, show_name_te: e.target.value })}
                                        placeholder="సాయంత్రం వార్తలు"
                                    />
                                </div>
                                <div>
                                    <Label>Hindi</Label>
                                    <Input
                                        value={formData.show_name_hi}
                                        onChange={(e) => setFormData({ ...formData, show_name_hi: e.target.value })}
                                        placeholder="शाम की खबरें"
                                    />
                                </div>
                                <div>
                                    <Label>Malayalam</Label>
                                    <Input
                                        value={formData.show_name_ml}
                                        onChange={(e) => setFormData({ ...formData, show_name_ml: e.target.value })}
                                        placeholder="വൈകുന്നേരത്തെ വാർത്തകൾ"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={handleCancel}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Schedule List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((schedule) => (
                    <Card key={schedule.id} className={editingId === schedule.id ? 'border-red-500' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{schedule.day_name_en}</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(schedule)}
                                        disabled={isAdding || (editingId && editingId !== schedule.id)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(schedule.id)}
                                        disabled={isAdding || editingId}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                            <CardDescription className="font-kannada">
                                {schedule.day_name_kn}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-red-600">{schedule.show_name_en}</p>
                                    <p className="text-sm text-gray-600 font-kannada">{schedule.show_name_kn}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
