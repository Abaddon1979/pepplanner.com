import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Box, CssBaseline, Divider, IconButton, Toolbar, Typography, Avatar, Menu, MenuItem, ListItemIcon } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ScienceIcon from '@mui/icons-material/Science';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { currentUser, logout } = useAuth();
    const [anchorElUser, setAnchorElUser] = useState(null);
    const navigate = useNavigate();

    const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            console.error("Failed to log out");
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
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
                        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                            <Avatar alt={currentUser?.username} sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                                {currentUser?.username?.[0]?.toUpperCase()}
                            </Avatar>
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
                                <Typography textAlign="center" variant="body2">{currentUser?.username}</Typography>
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

            <Box component="main" sx={{
                flex: 1,
                minHeight: 0,
                p: { xs: 1, sm: 2 },
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto'
            }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
