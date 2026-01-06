import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  ShoppingCart, Users, Package, FileText, IndianRupee, ShoppingBag 
} from 'lucide-react'; // <--- Added IndianRupee and ShoppingBag

const DashboardHome = ({ data, lineData, pieData }) => {
  return (
    <>
      <div className="stats-grid">
        {/* 1. Total Revenue (Updated Icon to Rupee) */}
        <StatCard 
            title="Total Revenue" 
            value={`₹${data?.dashboard?.total_revenue || 0}`} 
            icon={<IndianRupee size={20} className="text-blue-500"/>} 
        />

        {/* 2. NEW: Total Orders Card */}
        <StatCard 
            title="Total Orders" 
            value={data?.dashboard?.total_orders || 0} 
            icon={<ShoppingBag size={20} className="text-pink-500"/>} 
        />

        {/* 3. Total Customers */}
        <StatCard 
            title="Total Customers" 
            value={data?.dashboard?.total_customers || 0} 
            icon={<Users size={20} className="text-green-500"/>} 
        />

        {/* 4. Total Products */}
        <StatCard 
            title="Total Products" 
            value={data?.dashboard?.total_products || 0} 
            icon={<Package size={20} className="text-orange-500"/>} 
        />

        {/* 5. Invoices */}
        <StatCard 
            title="Invoices Issued" 
            value={data?.dashboard?.total_invoices || 0} 
            icon={<FileText size={20} className="text-purple-500"/>} 
        />
      </div>

      <div className="charts-row">
        <div className="chart-card flex-2">
          <div className="chart-header"><h3>Order Trends</h3></div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12, fill:'#999'}}/>
              <YAxis axisLine={false} tickLine={false} tick={{fontSize:12, fill:'#999'}}/>
              <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}/>
              <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} dot={{r:4, fill:'#3B82F6'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card flex-1">
          <div className="chart-header"><h3>Payment Status</h3></div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            <span><span className="dot bg-blue"></span> Paid</span>
            <span><span className="dot bg-green"></span> Unpaid</span>
          </div>
        </div>
      </div>
    </>
  );
};

// Internal Component
const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
     <div className="stat-icon-bg">{icon}</div>
     <div>
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
     </div>
  </div>
);

export default DashboardHome;