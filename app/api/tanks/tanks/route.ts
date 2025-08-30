// // src/app/api/tanks/route.ts
// import { db } from '@/lib/database';
// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(req: NextRequest) {
//   try {
//     // گرفتن داده‌ها از جدول tanks در Supabase
//     const { data, error } = await supabase
//       .from('tanks')  // اسم جدول مخازن
//       .select('*');  // گرفتن تمام داده‌ها از جدول

//     // اگر خطایی وجود داشته باشد، آن را پرتاب می‌کند
//     if (error) throw error;

//     // پاسخ موفق
//     return NextResponse.json(data);
//   } catch (error) {
//     // اگر خطا پیش بیاید، پیام خطا را ارسال می‌کند
//     return NextResponse.json({ error: 'خطا در دریافت داده‌های مخازن' }, { status: 500 });
//   }
// }

// export async function PUT(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { id, current_level } = body;

//     // بررسی وجود مقادیر ضروری
//     if (!id || current_level === undefined) {
//       return NextResponse.json(
//         { error: 'شناسه مخزن و سطح جدید ضروری هستند' },
//         { status: 400 }
//       );
//     }

//     // بروزرسانی سطح مخزن در دیتابیس
//     const { data, error } = await supabase
//       .from('tanks')
//       .update({ 
//         current_level: current_level,
//         last_updated: new Date().toISOString()
//       })
//       .eq('id', id)
//       .select();

//     if (error) throw error;

//     return NextResponse.json({ 
//       message: 'سطح مخزن با موفقیت بروزرسانی شد',
//       tank: data[0]
//     });
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'خطا در بروزرسانی مخزن' }, 
//       { status: 500 }
//     );
//   }
// }
