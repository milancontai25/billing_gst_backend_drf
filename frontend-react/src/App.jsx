import { useState } from 'react'
import './assets/css/style.css'
import Main from './components/Main'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register'
import Login from './components/Login'
import DashboardHome from './components/DashboardHome'
import Products from './components/Products'
import Customers from './components/Customers'
import Invoices from './components/Invoices'
import ForgotPassword from './components/ForgotPassword'
import StoreFront from './components/StoreFront'
import Checkout from './components/Checkout'
import OrderHistory from './components/OrderHistory'
import Layout from './components/Layout'
import Orders from './components/Orders';

function App() {

  const lineData = [
    { name: 'Jan', orders: 30 }, { name: 'Feb', orders: 45 },
    { name: 'Mar', orders: 35 }, { name: 'Apr', orders: 60 },
  ];
  const pieData = [
    { name: 'Paid', value: 499, color: '#3B82F6' },
    { name: 'Unpaid', value: 158, color: '#10B981' },
  ];
  
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Main />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardHome lineData={lineData} pieData={pieData} />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/orders" element={<Orders />} />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
          <Route path="/forgot-password" element={<ForgotPassword /> } />
          <Route path="/store/:slug" element={<StoreFront />} />
          <Route path="/store/:slug/checkout" element={<Checkout />} />
          <Route path="/store/:slug/orders" element={<OrderHistory />} />
        </Routes>
      </BrowserRouter>
      
    </>
  )
}

export default App
