import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Paper,
    Slider,
    Divider,
    Grid,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { getCalculatorSettings, saveCalculatorSettings } from '../services/api';

export default function Calculator() {
    const [peptideAmount, setPeptideAmount] = useState(5);
    const [waterAmount, setWaterAmount] = useState(2);
    const [desiredDose, setDesiredDose] = useState(250);
    const [doseUnit, setDoseUnit] = useState('mcg');

    const [concentration, setConcentration] = useState(0);
    const [unitsToDraw, setUnitsToDraw] = useState(0);

    // Load saved settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getCalculatorSettings();
                if (settings.peptide_amount) setPeptideAmount(settings.peptide_amount);
                if (settings.water_amount) setWaterAmount(settings.water_amount);
                if (settings.desired_dose) setDesiredDose(settings.desired_dose);
                if (settings.dose_unit) setDoseUnit(settings.dose_unit);
            } catch (error) {
                console.error('Failed to load calculator settings:', error);
            }
        };
        loadSettings();
    }, []);

    // Save settings when they change (debounced)
    const saveSettings = useCallback(async () => {
        try {
            await saveCalculatorSettings({
                peptide_amount: peptideAmount,
                water_amount: waterAmount,
                desired_dose: desiredDose,
                dose_unit: doseUnit
            });
        } catch (error) {
            console.error('Failed to save calculator settings:', error);
        }
    }, [peptideAmount, waterAmount, desiredDose, doseUnit]);

    // Debounce save
    useEffect(() => {
        const timer = setTimeout(saveSettings, 1000);
        return () => clearTimeout(timer);
    }, [saveSettings]);

    const handleUnitChange = (event, newUnit) => {
        if (newUnit !== null) {
            setDoseUnit(newUnit);
        }
    };

    useEffect(() => {
        const amount = parseFloat(peptideAmount) || 0;
        const water = parseFloat(waterAmount) || 1;
        const doseInput = parseFloat(desiredDose) || 0;

        const conc = amount / water;
        setConcentration(conc);

        let doseInMg = doseInput;
        if (doseUnit === 'mcg') {
            doseInMg = doseInput / 1000;
        }

        const volumeNeeded = doseInMg / conc;
        const units = volumeNeeded * 100;

        setUnitsToDraw(isFinite(units) ? units : 0);
    }, [peptideAmount, waterAmount, desiredDose, doseUnit]);

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 2 }}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" color="primary" sx={{ mb: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Input Parameters</Typography>

                        <Box sx={{ mb: 5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>Peptide Quantity</Typography>
                                <Typography fontWeight={600} color="primary.light">{peptideAmount} mg</Typography>
                            </Box>
                            <Slider
                                value={peptideAmount}
                                onChange={(e, val) => setPeptideAmount(val)}
                                min={1}
                                max={20}
                                step={0.5}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={peptideAmount}
                                onChange={(e) => setPeptideAmount(e.target.value)}
                                InputProps={{ endAdornment: <InputAdornment position="end">mg</InputAdornment> }}
                            />
                        </Box>

                        <Box sx={{ mb: 5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>Bacteriostatic Water</Typography>
                                <Typography fontWeight={600} color="primary.light">{waterAmount} mL</Typography>
                            </Box>
                            <Slider
                                value={waterAmount}
                                onChange={(e, val) => setWaterAmount(val)}
                                min={0.5}
                                max={10}
                                step={0.1}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={waterAmount}
                                onChange={(e) => setWaterAmount(e.target.value)}
                                InputProps={{ endAdornment: <InputAdornment position="end">mL</InputAdornment> }}
                            />
                        </Box>

                        <Box sx={{ mt: 'auto' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography>Desired Dose</Typography>
                                <ToggleButtonGroup
                                    value={doseUnit}
                                    exclusive
                                    onChange={handleUnitChange}
                                    size="small"
                                    sx={{
                                        '& .MuiToggleButton-root': {
                                            borderColor: '#27272a',
                                            color: 'text.secondary',
                                            '&.Mui-selected': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                                        }
                                    }}
                                >
                                    <ToggleButton value="mcg">mcg</ToggleButton>
                                    <ToggleButton value="mg">mg</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={desiredDose}
                                onChange={(e) => setDesiredDose(e.target.value)}
                                InputProps={{ endAdornment: <InputAdornment position="end">{doseUnit}</InputAdornment> }}
                            />
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                        <Paper sx={{
                            p: 6,
                            textAlign: 'center',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, rgba(9, 9, 11, 0) 70%)',
                            border: '1px solid #27272a'
                        }}>
                            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.2em' }}>DRAW TO</Typography>
                            <Typography variant="h1" sx={{
                                fontSize: '4rem',
                                my: 1,
                                fontWeight: 800,
                                ...(unitsToDraw > 100 ? {
                                    color: '#ef4444'
                                } : {
                                    background: 'linear-gradient(135deg, #fff 0%, #818cf8 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                })
                            }}>
                                {unitsToDraw > 100 ? '100+' : unitsToDraw.toFixed(1)}
                            </Typography>
                            <Typography variant="h6" color="primary.light">Units (IU)</Typography>
                            {unitsToDraw > 100 ? (
                                <Typography variant="body2" color="error" sx={{ mt: 1, fontWeight: 600 }}>
                                    Check your inputs (Exceeds 100 units)
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>on a standard U-100 Syringe</Typography>
                            )}
                        </Paper>

                        <Paper sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }}>
                                    <WaterDropIcon sx={{ color: '#818cf8' }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                        CONCENTRATION
                                    </Typography>
                                    <Typography variant="h5" fontWeight={600}>
                                        {concentration.toFixed(2)} mg/mL
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
