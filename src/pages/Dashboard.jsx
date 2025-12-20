import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    Grid,
    Drawer,
    Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScienceIcon from '@mui/icons-material/Science';
import RepeatIcon from '@mui/icons-material/Repeat';
import CloseIcon from '@mui/icons-material/Close';
import {
    format,
    startOfWeek,
    addDays,
    startOfMonth,
    endOfMonth,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getDoses, createDose, createBatchDoses, updateDose, deleteDose } from '../services/api';

// Helper to parse dates from API without timezone shift
// Converts "2025-12-18T00:00:00.000Z" -> Local Date for Dec 18th
const parseApiDate = (dateString) => {
    if (!dateString) return new Date();
    // Take the date part only (YYYY-MM-DD)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    // Create date using local constructor (months are 0-indexed)
    return new Date(year, month - 1, day);
};

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [openModal, setOpenModal] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Form State
    const [peptideName, setPeptideName] = useState('');
    const [doseAmount, setDoseAmount] = useState('');
    const [notes, setNotes] = useState('');

    // View/Edit Dose State
    const [selectedDose, setSelectedDose] = useState(null);
    const [viewDoseModal, setViewDoseModal] = useState(false);
    const [editNotes, setEditNotes] = useState('');

    // Recurring Form State
    const [isRecurring, setIsRecurring] = useState(false);
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [frequency, setFrequency] = useState('daily');
    const [customDays, setCustomDays] = useState(2);
    const [repeats, setRepeats] = useState(1);

    // Data State
    const [doses, setDoses] = useState([]);

    useEffect(() => {
        if (!currentUser) return;

        const fetchDoses = async () => {
            try {
                const data = await getDoses();
                setDoses(data);
            } catch (error) {
                console.error("Error fetching doses:", error);
            }
        };

        fetchDoses();
    }, [currentUser]);

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setDrawerOpen(true);
    };

    const handleAddDose = async () => {
        if (!peptideName || !doseAmount) return;

        const groupId = isRecurring ? Date.now().toString() : null;

        let datesToSchedule = [];
        if (!isRecurring) {
            datesToSchedule.push(selectedDate);
        } else {
            let currentDate = new Date(selectedDate);
            for (let i = 0; i < repeats; i++) {
                datesToSchedule.push(new Date(currentDate));
                if (frequency === 'daily') currentDate = addDays(currentDate, 1);
                else if (frequency === 'weekly') currentDate = addDays(currentDate, 7);
                else if (frequency === 'custom') currentDate = addDays(currentDate, parseInt(customDays) || 1);
            }
        }

        try {
            const dosesToCreate = datesToSchedule.map(date => ({
                peptide: peptideName,
                dose: doseAmount,
                notes: notes,
                date: format(date, 'yyyy-MM-dd'),
                group_id: groupId
            }));

            if (dosesToCreate.length === 1) {
                const newDose = await createDose(dosesToCreate[0]);
                setDoses(prev => [...prev, newDose]);
            } else {
                const newDoses = await createBatchDoses(dosesToCreate);
                setDoses(prev => [...prev, ...newDoses]);
            }

            setOpenModal(false);
            setPeptideName('');
            setDoseAmount('');
            setNotes('');
            setIsRecurring(false);
            setRepeats(1);
        } catch (error) {
            console.error("Error adding doses: ", error);
        }
    };

    const toggleComplete = async (dose, e) => {
        e.stopPropagation();
        try {
            const updated = await updateDose(dose.id, { completed: !dose.completed });
            setDoses(prev => prev.map(d => d.id === dose.id ? updated : d));
        } catch (error) {
            console.error("Error updating dose: ", error);
        }
    };

    const handleDoseClick = (dose) => {
        setSelectedDose(dose);
        setEditNotes(dose.notes || '');
        setViewDoseModal(true);
    };

    const handleSaveNote = async () => {
        if (!selectedDose) return;
        try {
            const updated = await updateDose(selectedDose.id, { notes: editNotes });
            setDoses(prev => prev.map(d => d.id === selectedDose.id ? updated : d));
            setViewDoseModal(false);
        } catch (error) {
            console.error("Error updating note: ", error);
        }
    };

    const handleDeleteDose = async () => {
        if (!selectedDose) return;
        if (!window.confirm('Are you sure you want to delete this dose?')) return;

        try {
            await deleteDose(selectedDose.id);
            setDoses(prev => prev.filter(d => d.id !== selectedDose.id));
            setViewDoseModal(false);
        } catch (error) {
            console.error("Error deleting dose: ", error);
        }
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
        calendarDays.push(day);
        day = addDays(day, 1);
    }
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) weeks.push(calendarDays.slice(i, i + 7));

    const getDoseColor = (count) => {
        if (count === 0) return 'transparent';
        if (count === 1) return '#3b82f6'; // Blue
        if (count === 2) return '#10b981'; // Green
        if (count === 3) return '#eab308'; // Yellow
        if (count === 4) return '#f97316'; // Orange
        return '#ef4444'; // Red (5+)
    };

    const dayDoses = doses.filter(d => isSameDay(parseApiDate(d.date), selectedDate));

    return (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>


            <Paper sx={{
                p: { xs: 0, sm: 4 },
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: { xs: 'transparent', sm: '#09090b' },
                border: { xs: 'none', sm: '1px solid #27272a' }
            }}>
                {/* Mobile Header (Reference Style) */}
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', mb: 4, pt: 2 }}>
                    {/* Big Date Display */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
                        <Typography variant="h1" component="div" sx={{ fontWeight: 300, fontSize: '5rem', lineHeight: 1 }}>
                            {format(selectedDate, 'dd')}
                        </Typography>
                        <Box sx={{ width: '2px', height: 60, bgcolor: 'rgba(255,255,255,0.2)', mx: 3 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {format(selectedDate, 'MMMM')}
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                                {format(selectedDate, 'yyyy')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Mobile View Toggle */}
                    <Box sx={{ display: 'flex', justifySelf: 'center', alignSelf: 'center', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 0.5, mb: 3 }}>
                        <Button
                            size="small"
                            onClick={() => setViewMode('month')}
                            sx={{
                                minWidth: 0,
                                px: 2,
                                color: viewMode === 'month' ? 'white' : 'text.secondary',
                                bgcolor: viewMode === 'month' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: 1.5,
                                fontSize: '0.8rem',
                                fontWeight: 500
                            }}
                        >
                            Monthly
                        </Button>
                        <Button
                            size="small"
                            onClick={() => setViewMode('week')}
                            sx={{
                                minWidth: 0,
                                px: 2,
                                color: viewMode === 'week' ? 'white' : 'text.secondary',
                                bgcolor: viewMode === 'week' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: 1.5,
                                fontSize: '0.8rem',
                                fontWeight: 500
                            }}
                        >
                            Weekly
                        </Button>
                        <Button
                            size="small"
                            onClick={() => setViewMode('day')}
                            sx={{
                                minWidth: 0,
                                px: 2,
                                color: viewMode === 'day' ? 'white' : 'text.secondary',
                                bgcolor: viewMode === 'day' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: 1.5,
                                fontSize: '0.8rem',
                                fontWeight: 500
                            }}
                        >
                            Daily
                        </Button>
                    </Box>

                    {/* Navigation Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                        <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} sx={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            <ChevronLeftIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {format(currentMonth, 'MMMM yyyy')}
                        </Typography>
                        <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} sx={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Desktop Header */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} sx={{ border: '1px solid #27272a', p: 0.5 }}>
                            <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 90, textAlign: 'center', fontSize: '1rem' }}>
                            {format(currentMonth, 'MMM yyyy')}
                        </Typography>
                        <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} sx={{ border: '1px solid #27272a', p: 0.5 }}>
                            <ChevronRightIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Desktop View Toggle */}
                    <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 0.5 }}>
                        <Button
                            size="small"
                            onClick={() => setViewMode('month')}
                            sx={{
                                minWidth: 0,
                                px: 2,
                                color: viewMode === 'month' ? 'white' : 'text.secondary',
                                bgcolor: viewMode === 'month' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: 1.5,
                                fontSize: '0.8rem',
                                fontWeight: 500
                            }}
                        >
                            Month
                        </Button>
                        <Button
                            size="small"
                            onClick={() => setViewMode('week')}
                            sx={{
                                minWidth: 0,
                                px: 2,
                                color: viewMode === 'week' ? 'white' : 'text.secondary',
                                bgcolor: viewMode === 'week' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: 1.5,
                                fontSize: '0.8rem',
                                fontWeight: 500
                            }}
                        >
                            Week
                        </Button>
                    </Box>
                </Box>

                {viewMode === 'month' ? (
                    <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 2, gap: 0.5 }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <Typography key={d} variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>
                                    {d}
                                </Typography>
                            ))}
                        </Box>

                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {weeks.map((week, wi) => (
                                <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, sm: 1 }, flex: 1 }}>
                                    {week.map((date, di) => {
                                        const inMonth = isSameMonth(date, monthStart);
                                        const selected = isSameDay(date, selectedDate);
                                        const today = isToday(date);
                                        const dailyDoses = doses.filter(d => isSameDay(parseApiDate(d.date), date));
                                        const hasDoses = dailyDoses.length > 0;
                                        const incompleteCount = dailyDoses.filter(d => !d.completed).length;

                                        return (
                                            <Box
                                                key={di}
                                                onClick={() => handleDateClick(date)}
                                                sx={{
                                                    p: { xs: 0.5, sm: 1.5 },
                                                    pt: { xs: 1, sm: 1.5 },
                                                    height: { xs: 100, sm: 'auto' },
                                                    minHeight: 0,
                                                    flex: 1,
                                                    cursor: 'pointer',
                                                    bgcolor: selected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                    border: { xs: 'none', sm: '1px solid' },
                                                    borderColor: selected ? 'primary.main' : 'rgba(255,255,255,0.03)',
                                                    borderRadius: 1, // Reduced radius
                                                    opacity: inMonth ? 1 : 0.3,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    transition: 'all 0.2s',
                                                    minWidth: 0,
                                                    overflow: 'hidden',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'space-between' }, alignItems: 'center', position: 'relative' }}>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={today || hasDoses ? 800 : 500}
                                                        sx={{
                                                            color: hasDoses ? '#fff' : (today ? 'primary.light' : 'text.primary'),
                                                            width: { xs: 28, sm: 24 }, height: { xs: 28, sm: 24 },
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            bgcolor: {
                                                                xs: hasDoses ? getDoseColor(dailyDoses.length) : (today ? 'rgba(99, 102, 241, 0.1)' : 'transparent'),
                                                                sm: today ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                                            },
                                                            borderRadius: '50%',
                                                            fontSize: { xs: '0.9rem', sm: '0.875rem' }
                                                        }}
                                                    >
                                                        {format(date, 'd')}
                                                    </Typography>
                                                    {/* Mobile Dot Removed (Now using Number Color) */}
                                                    {hasDoses && (
                                                        <Box sx={{
                                                            display: { xs: 'none', sm: 'block' },
                                                            width: 6, height: 6,
                                                            borderRadius: '50%',
                                                            bgcolor: incompleteCount === 0 ? '#10b981' : '#f59e0b'
                                                        }} />
                                                    )}
                                                </Box>

                                                {/* Desktop: Show List */}
                                                <Box sx={{ mt: 1, display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 0.5, overflowY: 'auto' }}>
                                                    {dailyDoses.map((d, i) => (
                                                        <Typography key={i} noWrap sx={{
                                                            fontSize: '0.7rem',
                                                            color: d.completed ? 'text.disabled' : 'text.secondary',
                                                            textDecoration: d.completed ? 'line-through' : 'none'
                                                        }}>
                                                            {d.peptide} <span style={{ opacity: 0.5 }}>{d.dose}</span>
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ))}
                        </Box>
                    </>
                ) : viewMode === 'week' ? (
                    /* Weekly Vertical Stack View (Corrected per request) */
                    <Box sx={{
                        display: { xs: 'flex', sm: 'grid' },
                        flexDirection: { xs: 'column', sm: 'unset' },
                        gridTemplateColumns: { sm: 'repeat(7, 1fr)' },
                        gap: 0.5,
                        pb: 4,
                        flex: 1
                    }}>
                        {/* Desktop Week Headers */}
                        <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <Typography key={d} variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center', mb: 1 }}>
                                    {d}
                                </Typography>
                            ))}
                        </Box>
                        {weeks.find(w => w.some(d => isSameDay(d, new Date())))?.map((date, di) => {
                            const isSelected = isSameDay(date, selectedDate);
                            const isTodayDate = isToday(date);
                            const dailyDoses = doses.filter(d => isSameDay(parseApiDate(d.date), date));

                            return (
                                <Box
                                    key={di}
                                    onClick={() => handleDateClick(date)}
                                    sx={{
                                        p: 2,
                                        height: { xs: 150, sm: 'auto' },
                                        minHeight: { sm: 300 },
                                        cursor: 'pointer',
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        border: '1px solid',
                                        borderLeft: { xs: isTodayDate ? '4px solid' : '1px solid', sm: '1px solid' },
                                        borderColor: isSelected ? 'primary.main' : 'rgba(255,255,255,0.05)',
                                        borderLeftColor: { xs: isTodayDate ? 'primary.main' : (isSelected ? 'primary.main' : 'rgba(255,255,255,0.05)'), sm: isSelected ? 'primary.main' : 'rgba(255,255,255,0.05)' },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: { sm: 'none' } }}>
                                            {format(date, 'EEEE')}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={isTodayDate ? 800 : 600} color={isTodayDate ? 'primary.light' : 'white'}>
                                            {format(date, 'MMM d')}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, overflowY: 'auto' }}>
                                        {dailyDoses.length === 0 ? (
                                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', display: { xs: 'block', sm: 'none' } }}>No doses</Typography>
                                        ) : (
                                            dailyDoses.map((d, i) => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: d.completed ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                                                    <Typography variant="body2" sx={{
                                                        textDecoration: d.completed ? 'line-through' : 'none',
                                                        color: d.completed ? 'text.secondary' : 'text.primary',
                                                        lineHeight: 1.2
                                                    }}>
                                                        {d.peptide}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                                                        {d.dose}mcg
                                                    </Typography>
                                                </Box>
                                            ))
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    /* Daily View */
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box>
                                    <Typography variant="h5" fontWeight={700}>{format(selectedDate, 'EEEE')}</Typography>
                                    <Typography variant="body2" color="text.secondary">{format(selectedDate, 'MMMM do')}</Typography>
                                </Box>
                                <Chip label={isToday(selectedDate) ? "Today" : "Selected"} color={isToday(selectedDate) ? "primary" : "default"} size="small" variant="outlined" />
                            </Box>

                            {/* Daily Doses List */}
                            <Stack spacing={2}>
                                {doses.filter(d => isSameDay(parseApiDate(d.date), selectedDate)).length === 0 ? (
                                    <Box sx={{ p: 4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 2, textAlign: 'center' }}>
                                        <Typography color="text.secondary">No doses scheduled for this day.</Typography>
                                        <Button startIcon={<AddIcon />} size="small" sx={{ mt: 2 }} onClick={() => setOpenModal(true)}>Add Dose</Button>
                                    </Box>
                                ) : (
                                    doses.filter(d => isSameDay(parseApiDate(d.date), selectedDate)).map(dose => (
                                        <Box key={dose.id} sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            border: '1px solid',
                                            borderColor: dose.completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.05)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}>
                                            <Box>
                                                <Typography variant="body1" fontWeight={500} sx={{ textDecoration: dose.completed ? 'line-through' : 'none' }}>{dose.peptide}</Typography>
                                                <Typography variant="caption" color="text.secondary">{dose.dose} mcg</Typography>
                                            </Box>
                                            <IconButton onClick={() => toggleComplete(dose)} color={dose.completed ? "success" : "default"}>
                                                {dose.completed ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                            </IconButton>
                                        </Box>
                                    ))
                                )}
                            </Stack>
                        </Box>
                    </Box>
                )}

                {/* Mobile Legend - Enhanced */}
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)', display: { xs: 'block', sm: 'none' } }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem' }}>
                        Peptides Per Day
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {[
                            { count: 1, label: '1 Dose' },
                            { count: 2, label: '2 Doses' },
                            { count: 3, label: '3 Doses' },
                            { count: 4, label: '4 Doses' },
                            { count: 5, label: '5+' }
                        ].map(item => (
                            <Box key={item.count} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getDoseColor(item.count), boxShadow: `0 0 8px ${getDoseColor(item.count)}` }} />
                                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Paper>

            {/* Right Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 0 } }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>{format(selectedDate, 'EEEE')}</Typography>
                            <Typography variant="body2" color="text.secondary">{format(selectedDate, 'MMM do, yyyy')}</Typography>
                        </Box>
                        <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
                    </Box>

                    <Box sx={{ flex: 1, px: 4, overflowY: 'auto' }}>
                        {dayDoses.length === 0 ? (
                            <Box sx={{ p: 4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 2, textAlign: 'center' }}>
                                <ScienceIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                                <Typography color="text.secondary">No doses scheduled</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                {dayDoses.map(dose => (
                                    <Box
                                        key={dose.id}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: dose.completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                            bgcolor: dose.completed ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s',
                                            '&:hover': { borderColor: 'rgba(255,255,255,0.1)' }
                                        }}
                                    >
                                        <Box onClick={() => handleDoseClick(dose)} sx={{ flex: 1, cursor: 'pointer' }}>
                                            <Typography fontWeight={600} sx={{ textDecoration: dose.completed ? 'line-through' : 'none', color: dose.completed ? 'text.secondary' : 'white' }}>
                                                {dose.peptide}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {dose.dose} mcg
                                            </Typography>
                                            {dose.notes && (
                                                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                                    {dose.notes}
                                                </Typography>
                                            )}
                                        </Box>
                                        <IconButton onClick={(e) => toggleComplete(dose, e)} sx={{ color: dose.completed ? '#10b981' : 'text.secondary' }}>
                                            {dose.completed ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>

                    <Box sx={{ p: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenModal(true)}
                            sx={{ py: 1.5 }}
                        >
                            Add Dose
                        </Button>
                    </Box>
                </Box>
            </Drawer>

            {/* Add Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add Protocol</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <TextField autoFocus label="Peptide Name" fullWidth value={peptideName} onChange={(e) => setPeptideName(e.target.value)} placeholder="e.g. BPC-157" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Dose Amount (mcg)" type="number" fullWidth value={doseAmount} onChange={(e) => setDoseAmount(e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Notes (Optional)"
                                fullWidth
                                multiline
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Take with food, post-workout, etc."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ p: 2, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.01)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <RepeatIcon color="action" />
                                        <Typography fontWeight={500}>Recurring Schedule</Typography>
                                    </Box>
                                    <Switch checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                                </Box>
                                {isRecurring && (
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        <Grid item xs={6}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Frequency</InputLabel>
                                                <Select value={frequency} label="Frequency" onChange={(e) => setFrequency(e.target.value)}>
                                                    <MenuItem value="daily">Daily</MenuItem>
                                                    <MenuItem value="weekly">Weekly</MenuItem>
                                                    <MenuItem value="custom">Every X Days</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        {frequency === 'custom' && (
                                            <Grid item xs={6}>
                                                <TextField label="Days" type="number" size="small" fullWidth value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
                                            </Grid>
                                        )}
                                        <Grid item xs={12}>
                                            <TextField label="Count" type="number" size="small" fullWidth value={repeats} onChange={(e) => setRepeats(e.target.value)} helperText="Total doses to schedule" />
                                        </Grid>
                                    </Grid>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenModal(false)} variant="outlined" color="inherit">Cancel</Button>
                    <Button onClick={handleAddDose} variant="contained" disabled={!peptideName || !doseAmount}>Save Schedule</Button>
                </DialogActions>
            </Dialog>

            {/* View/Edit Dose Modal */}
            <Dialog open={viewDoseModal} onClose={() => setViewDoseModal(false)} fullWidth maxWidth="xs">
                <DialogTitle>Dose Details</DialogTitle>
                <DialogContent>
                    {selectedDose && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Peptide</Typography>
                                <Typography variant="h6">{selectedDose.peptide}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Amount</Typography>
                                <Typography variant="body1">{selectedDose.dose} mcg</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Date</Typography>
                                <Typography variant="body1">{format(parseApiDate(selectedDose.date), 'PPP')}</Typography>
                            </Box>
                            <TextField
                                label="Notes"
                                fullWidth
                                multiline
                                rows={3}
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Add notes..."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Button onClick={handleDeleteDose} color="error">Delete</Button>
                    <Box>
                        <Button onClick={() => setViewDoseModal(false)} color="inherit" sx={{ mr: 1 }}>Close</Button>
                        <Button onClick={handleSaveNote} variant="contained">Save Note</Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
