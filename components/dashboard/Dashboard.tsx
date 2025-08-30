// // src/components/dashboard/Dashboard.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import TankStatus from '../tanks/TankStatus';
// import GeneratorStatus from '../generators/GeneratorStatus';
// import TasksOverview from '../tasks/TasksOverview';
// import { AlertsPanel } from '../alerts-panel';
// import Charts from '../ui/Charts';
// import { alerts } from '@/lib/data';

// ;


// export default function Dashboard() {
//   const [activeTab, setActiveTab] = useState('overview');

//   return (
//     <div className="flex h-screen bg-gray-900 text-white">
//       {/* Sidebar */}
//       <div className="w-64 bg-gray-800 p-4">
//         <h2 className="text-xl font-bold mb-6">پنل مدیریت</h2>
//         <nav className="space-y-2">
//           <button
//             onClick={() => setActiveTab('overview')}
//             className={`w-full text-right px-4 py-2 rounded-md ${activeTab === 'overview' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
//           >
//             overview
//           </button>
//           <button
//             onClick={() => setActiveTab('tanks')}
//             className={`w-full text-right px-4 py-2 rounded-md ${activeTab === 'tanks' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
//           >
//             مخازن
//           </button>
//           <button
//             onClick={() => setActiveTab('generators')}
//             className={`w-full text-right px-4 py-2 rounded-md ${activeTab === 'generators' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
//           >
//             ژنراتورها
//           </button>
//           <button
//             onClick={() => setActiveTab('tasks')}
//             className={`w-full text-right px-4 py-2 rounded-md ${activeTab === 'tasks' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
//           >
//             تسک‌ها
//           </button>
//           <button
//             onClick={() => setActiveTab('reports')}
//             className={`w-full text-right px-4 py-2 rounded-md ${activeTab === 'reports' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
//           >
//             گزارش‌ها
//           </button>
//           <button
//             onClick={() => setActiveTab('alerts')}
//             className={`w-full text-right px-4 py-2 rounded-md ${activeTab === 'alerts' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
//           >
//             هشدارها
//           </button>
//         </nav>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 p-6 overflow-auto">
//         <header className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
//           <div className="flex items-center space-x-4">
//             <span>حسین کارجو (مدیر)</span>
//             <button className="bg-red-600 px-4 py-2 rounded-md">خروج</button>
//           </div>
//         </header>

//         {activeTab === 'overview' && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <TankStatus />
//             <GeneratorStatus />
//             <TasksOverview />
//             <AlertsPanel alerts={alerts}/>
//           </div>
//         )}

//         {activeTab === 'tanks' && <TankStatus detailed />}
//         {activeTab === 'generators' && <GeneratorStatus detailed />}
//         {activeTab === 'tasks' && <TasksOverview detailed />}
//         {activeTab === 'reports' && <Charts />}
//         {activeTab === 'alerts' && <AlertsPanel alerts={alerts}/>}
//       </div>
//     </div>
//   );
// }
