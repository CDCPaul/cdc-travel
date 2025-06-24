"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchProducts, Product } from "@/lib/firebase-sample";
import Navigation from "@/components/Navigation";

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

export default function Tours() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Featured Tours</h1>
        <section className="w-full max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            {products.map((product: Product, i: number) => (
              <motion.div
                key={product.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                transition={{ delay: i * 0.15 }}
              >
                <Link href={`/tours/${product.id}`} className="flex bg-white rounded-xl shadow p-6 flex-col hover:shadow-lg transition">
                  {product.image && product.image !== "" ? (
                    <Image src={product.image} alt={product.title || 'Tour Image'} width={600} height={400} className="rounded mb-4 object-cover" />
                  ) : null}
                  <h3 className="text-2xl font-semibold mb-2">{product.title}</h3>
                  <div className="text-lg mb-1">{product.date}</div>
                  <div className="text-xl font-bold text-teal-700 mb-2">{product.price} <span className="text-base font-normal text-gray-500">(Child {product.childPrice})</span></div>
                  <p className="mb-2 text-gray-700">{product.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 