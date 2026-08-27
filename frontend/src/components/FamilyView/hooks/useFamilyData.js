// frontend/src/components/FamilyView/hooks/useFamilyData.js
import { useState, useEffect } from 'react';
import api from '../../../services/api';

const useFamilyData = () => {
    const [sponsors, setSponsors] = useState([]);
    const [selectedSponsor, setSelectedSponsor] = useState(null);
    const [dependents, setDependents] = useState([]);
    const [statistics, setStatistics] = useState({ total: 0, children: 0, adults: 0, seniors: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchSponsors = async () => {
        setLoading(true);
        try {
            const response = await api.get('/sponsors');
            const data = response.data;
            if (data.success) {
                setSponsors(data.sponsors);
            }
        } catch (err) {
            setError('فشل في جلب البيانات');
            console.error('❌ خطأ في جلب الكافلين:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSponsorDetails = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`/sponsors/${id}`);
            const data = response.data;
            if (data.success) {
                setSelectedSponsor(data.sponsor);
                setDependents(data.dependents);
                setStatistics(data.statistics);
            }
        } catch (err) {
            setError('فشل في جلب تفاصيل الكافل');
            console.error('❌ خطأ في جلب تفاصيل الكافل:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsors();
    }, []);

    return {
        sponsors,
        selectedSponsor,
        dependents,
        statistics,
        loading,
        error,
        fetchSponsors,
        fetchSponsorDetails,
        setSelectedSponsor,
        setDependents,
        setStatistics,
        setLoading,
        setError
    };
};

export default useFamilyData;