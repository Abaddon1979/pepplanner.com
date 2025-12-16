import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Box, CssBaseline, Divider, IconButton, Toolbar, Typography, Avatar, Menu, MenuItem, Button, Dialog, ListItemIcon } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import LogoutIcon from '@mui/icons-material/Logout';
import ScienceIcon from '@mui/icons-material/Science';
import { useAuth } from '../context/AuthContext';
import Calculator from '../pages/Calculator';

const drawerWidth = 240; // Kept just in case, though unused now

const Layout = () => {
    const { currentUser, logout } = useAuth();
    const [anchorElUser, setAnchorElUser] = useState(null);
    const [openCalc, setOpenCalc] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <CssBaseline />
            <AppBar position="sticky" sx={{
                bgcolor: 'rgba(9, 9, 11, 0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backgroundImage: 'none'
            }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    {/* Logo / Title */}
                    <Box
                        onClick={() => navigate('/')}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        <ScienceIcon sx={{ color: '#818cf8' }} />
                        <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">Pepplanner</Typography>
                    </Box>

                    {/* Right Side Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<CalculateIcon />}
                            onClick={() => setOpenCalc(true)}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            Calculator
                        </Button>

                        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                            <Avatar alt={currentUser?.displayName} src={currentUser?.photoURL} sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }} />
                        </IconButton>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            <MenuItem disabled>
                                <Typography textAlign="center" variant="body2">{currentUser?.email}</Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                                <Typography textAlign="center">Logout</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 4 }, width: '100%', maxWidth: 1200, mx: 'auto' }}>
                <Outlet />
            </Box>

            {/* Calculator Modal */}
            <Dialog
                open={openCalc}
                onClose={() => setOpenCalc(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#09090b', border: '1px solid #27272a', backgroundImage: 'none' }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton onClick={() => setOpenCalc(false)}><LogoutIcon sx={{ transform: 'rotate(180deg)' }} /></IconButton>
                </Box>
                <Box sx={{ px: 2, pb: 4 }}>
                    <Calculator />
                </Box>
            </Dialog>
        </Box>
    );
};

export default Layout;
