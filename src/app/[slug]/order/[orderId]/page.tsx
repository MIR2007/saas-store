import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function OrderConfirmationPage(props: PageProps<"/[slug]/order/[orderId]">) {
  const { slug, orderId } = await props.params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();
  const order = await prisma.order.findFirst({ where: { id: orderId, storeId: store.id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-white border border-border rounded-2xl p-8 max-w-lg w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">تم استلام طلبك!</h1>
        <p className="text-muted mb-6">شكراً لك. سنقوم بتجهيز طلبك قريباً.</p>
        <div className="text-right bg-surface rounded-xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">رقم الطلب</span><span className="font-medium">{order.id}</span></div>
          <div className="flex justify-between"><span className="text-muted">العميل</span><span className="font-medium">{order.customerName}</span></div>
          <div className="flex justify-between"><span className="text-muted">المجموع</span><span className="font-bold text-primary">{order.total.toLocaleString()} {store.currency}</span></div>
        </div>
        <ul className="text-right text-sm divide-y divide-border mb-6">
          {order.items.map((it) => (
            <li key={it.id} className="py-2 flex justify-between">
              <span>{it.name} × {it.quantity}</span>
              <span>{(it.price * it.quantity).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <Link href={`/${store.slug}`} className="bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-dark transition inline-block">
          العودة للمتجر
        </Link>
      </div>
    </div>
  );
}