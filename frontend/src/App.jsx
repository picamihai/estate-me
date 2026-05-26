import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Layout from "./components/Layout";
import SessionTimeout from "./components/SessionTimeout";

import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetail from "./components/PropertyDetail";
import PropertyForm from "./components/PropertyForm";
import RequirePermission from "./components/RequirePermission";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import Viewings from "./pages/Viewings";
import Statistics from "./pages/Statistics";
import Chat from "./pages/Chat";
import AdminLogs from "./pages/AdminLogs";

function AppContent() {
    const location = useLocation();

    useEffect(() => {
        document.cookie = `lastPage=${location.pathname}; path=/`;
    }, [location.pathname]);

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<Home />} />

                <Route path="properties" element={<Properties />} />
                <Route path="properties/:id" element={<PropertyDetail />} />

                <Route
                    path="properties/new"
                    element={
                        <RequirePermission permission="CREATE_PROPERTY">
                            <PropertyForm />
                        </RequirePermission>
                    }
                />

                <Route
                    path="properties/:id/edit"
                    element={
                        <RequirePermission permission="UPDATE_PROPERTY">
                            <PropertyForm />
                        </RequirePermission>
                    }
                />

                <Route path="chat" element={<Chat />} />
                <Route path="viewings" element={<Viewings />} />
                <Route path="statistics" element={<Statistics />} />

                <Route
                    path="admin/logs"
                    element={
                        <RequirePermission permission="DELETE_PROPERTY">
                            <AdminLogs />
                        </RequirePermission>
                    }
                />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <SessionTimeout />
            <AppContent />
        </BrowserRouter>
    );
}

export default App;