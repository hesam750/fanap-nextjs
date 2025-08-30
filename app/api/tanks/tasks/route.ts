// // src/app/api/tasks/route.ts
// import { supabase } from '@/lib/database';
// import { NextRequest, NextResponse } from 'next/server';


// export async function GET(request: NextRequest) {
//   try {
//     // گرفتن داده‌ها از جدول tasks در Supabase
//     const { data, error } = await supabase
//       .from('tasks')  // جدول تسک‌ها
//       .select('*');   // تمام داده‌ها را از جدول می‌خوانیم

//     if (error) throw error;

//     return NextResponse.json(data);  // بازگشت داده‌ها به فرمت JSON
//   } catch (error) {
//     return NextResponse.json({ error: 'خطا در بروزرسانی مخزن' }, { status: 500 });
//   }
// }
