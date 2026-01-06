import { useState } from 'react'
import './assets/css/style.css'
import Main from './components/Main'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Register from './components/Register'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import ForgotPassword from './components/ForgotPassword'
import StoreFront from './components/StoreFront'

function App() {
  
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Main />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/products' element={<Products/> } />
          <Route path="/forgot-password" element={<ForgotPassword /> } />
          <Route path="/store/:slug" element={<StoreFront />} />

        </Routes>
      </BrowserRouter>
      
    </>
  )
}

export default App
