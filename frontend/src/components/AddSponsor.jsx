// frontend/src/components/AddSponsor.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import './AddSponsor.css';

const AddSponsor = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm({
        defaultValues: {
            full_name: '',
            date_of_birth: '',
            phone: '',
            email: '',
            subscription_start: ''
        }
    });

    const subscriptionStart = watch('subscription_start');

    const calculateEndDate = (startDate) => {
        if (!startDate) return '';
        const date = new Date(startDate);
        date.setFullYear(date.getFullYear() + 1);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setApiError('');

        const subscription_end = calculateEndDate(data.subscription_start);
        const dataToSend = { ...data, subscription_end };

        try {
            const response = await api.post('/sponsors', dataToSend);
            if (response.data.success) {
                toast.success(`✅ تم إضافة الكافل بنجاح! المعرف (ID): ${response.data.data.id}`);
                reset();
                onSuccess();
                onClose();
            } else {
                setApiError(response.data.message || 'حدث خطأ');
                toast.error('❌ ' + (response.data.message || 'حدث خطأ'));
            }
        } catch (err) {
            const message = err.response?.data?.message || 'فشل الاتصال بالخادم';
            setApiError(message);
            toast.error('❌ ' + message);
            console.error('❌ خطأ في إضافة الكافل:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="add-sponsor-overlay" onClick={onClose}>
            <div className="add-sponsor-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="add-sponsor-title">➕ إضافة كافل جديد</h2>
                <p className="add-sponsor-note">📅 مدة الاشتراك: سنة واحدة تلقائياً من تاريخ البدء</p>
                
                {apiError && <div className="add-sponsor-error">{apiError}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="add-sponsor-form">
                    {/* الاسم الكامل */}
                    <div className="add-sponsor-group">
                        <label>الاسم الكامل *</label>
                        <input
                            type="text"
                            placeholder="أدخل الاسم الكامل"
                            className={`add-sponsor-input ${errors.full_name ? 'input-error' : ''}`}
                            {...register('full_name', {
                                required: 'الاسم الكامل مطلوب',
                                minLength: {
                                    value: 3,
                                    message: 'الاسم يجب أن يكون 3 أحرف على الأقل'
                                },
                                maxLength: {
                                    value: 100,
                                    message: 'الاسم طويل جداً'
                                }
                            })}
                        />
                        {errors.full_name && (
                            <span className="error-text">{errors.full_name.message}</span>
                        )}
                    </div>

                    {/* تاريخ الميلاد */}
                    <div className="add-sponsor-group">
                        <label>تاريخ الميلاد *</label>
                        <input
                            type="date"
                            className={`add-sponsor-input ${errors.date_of_birth ? 'input-error' : ''}`}
                            {...register('date_of_birth', {
                                required: 'تاريخ الميلاد مطلوب'
                            })}
                        />
                        {errors.date_of_birth && (
                            <span className="error-text">{errors.date_of_birth.message}</span>
                        )}
                    </div>

                    {/* تاريخ بدء الاشتراك */}
                    <div className="add-sponsor-group">
                        <label>تاريخ بدء الاشتراك *</label>
                        <input
                            type="date"
                            className={`add-sponsor-input ${errors.subscription_start ? 'input-error' : ''}`}
                            {...register('subscription_start', {
                                required: 'تاريخ بدء الاشتراك مطلوب'
                            })}
                        />
                        {errors.subscription_start && (
                            <span className="error-text">{errors.subscription_start.message}</span>
                        )}
                        {subscriptionStart && (
                            <small className="add-sponsor-hint">
                                📅 ينتهي الاشتراك في: {calculateEndDate(subscriptionStart)}
                            </small>
                        )}
                    </div>

                    {/* الهاتف */}
                    <div className="add-sponsor-group">
                        <label>الهاتف (اختياري)</label>
                        <input
                            type="text"
                            placeholder="أدخل رقم الهاتف"
                            className="add-sponsor-input"
                            {...register('phone', {
                                pattern: {
                                    value: /^[0-9+\-\s()]*$/,
                                    message: 'رقم الهاتف غير صحيح'
                                }
                            })}
                        />
                        {errors.phone && (
                            <span className="error-text">{errors.phone.message}</span>
                        )}
                    </div>

                    {/* البريد الإلكتروني */}
                    <div className="add-sponsor-group">
                        <label>البريد الإلكتروني (اختياري)</label>
                        <input
                            type="email"
                            placeholder="أدخل البريد الإلكتروني"
                            className="add-sponsor-input"
                            {...register('email', {
                                pattern: {
                                    value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                    message: 'البريد الإلكتروني غير صحيح'
                                }
                            })}
                        />
                        {errors.email && (
                            <span className="error-text">{errors.email.message}</span>
                        )}
                    </div>

                    <div className="add-sponsor-buttons">
                        <button type="submit" className="add-sponsor-submit" disabled={loading}>
                            {loading ? '⏳ جاري الإضافة...' : '✅ إضافة كافل'}
                        </button>
                        <button type="button" onClick={onClose} className="add-sponsor-cancel">
                            ❌ إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSponsor;