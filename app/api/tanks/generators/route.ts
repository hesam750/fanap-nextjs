// // src/app/api/generators/route.ts (برای TypeScript)

// import { db } from '@/lib/database';
// import { NextRequest, NextResponse } from 'next/server';


// export async function GET(req: NextRequest) {
//   try {
//     // گرفتن داده‌ها از جدول generators در Supabase
//     const { data, error } = await db
//       .from('generators')  // اسم جدول را وارد کنید
//       .select('*');  // گرفتن تمام داده‌ها از جدول

//     // اگر خطایی وجود داشته باشد، آن را پرتاب می‌کند
//     if (error) throw error;

//     // پاسخ موفق
//     return NextResponse.json(data);
//   } catch (error) {
//     // اگر خطا پیش بیاید، پیام خطا را ارسال می‌کند
//     return NextResponse.json({ error: 'خطا در بروزرسانی مخزن'}, { status: 500 });
//   }
// }
