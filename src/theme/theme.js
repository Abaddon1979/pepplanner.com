import { createTheme } from '@mui/material/styles';

// V4: Modern Premium - "Deep Space"
// Core Concept: Deep Blacks, Zinc grays, Indigo/Violet Gradients, Glassmorphism
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366f1', // Indigo 500
            light: '#818cf8',
            dark: '#4f46e5', // Indigo 600
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#ec4899', // Pink/Rose for subtle gradients
            contrastText: '#fff',
        },
        background: {
            default: '#000000', // True Black
            paper: '#09090b',   // Zinc 950 (Almost Black)
        },
        text: {
            primary: '#ffffff',
            secondary: '#a1a1aa', // Zinc 400
        },
        divider: 'rgba(255,255,255,0.08)',
        action: {
            hover: 'rgba(255,255,255,0.03)',
            selected: 'rgba(99, 102, 241, 0.15)', // Indigo tinted
        },
    },
    typography: {
        fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
        h1: { fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
        h4: { fontWeight: 700, letterSpacing: '-0.02em' },
        h5: { fontWeight: 600, letterSpacing: '-0.01em' },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500, letterSpacing: '-0.01em' },
        button: { fontWeight: 500, letterSpacing: '0.02em', textTransform: 'none' },
    },
    shape: {
        borderRadius: 12, // Modern smooth corners
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#000000',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: '#000' },
                    '&::-webkit-scrollbar-thumb': { background: '#333', borderRadius: '3px' },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#09090b',
                    border: '1px solid #27272a', // Zinc 800
                    boxShadow: 'none', // Flat design
                },
                outlined: {
                    border: '1px solid #27272a',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                },
                contained: {
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', // Gradient Button
                    border: '1px solid rgba(255,255,255,0.1)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    }
                },
                outlined: {
                    borderColor: '#27272a',
                    color: '#e4e4e7',
                    '&:hover': {
                        borderColor: '#3f3f46',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(9, 9, 11, 0.7)', // Translucent
                    backdropFilter: 'blur(12px)', // Glassmorphism
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'none',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(9, 9, 11, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    '& fieldset': { borderColor: '#27272a' },
                    '&:hover fieldset': { borderColor: '#3f3f46' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1px' }, // Subtle focus glow handled by color
                    backgroundColor: 'rgba(0,0,0,0.2)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    border: '1px solid #27272a',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                },
                colorPrimary: {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                },
                colorSuccess: {
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                }
            }
        }
    },
});

export default theme;
