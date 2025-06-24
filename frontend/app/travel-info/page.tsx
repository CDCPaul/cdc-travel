"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";

const travelInfos = [
  {
    id: "1",
    image: "/images/AUG_CEB-PUS_AGT_Leaflet.jpg",
    title: "Customer Review: Amazing Busan Trip!",
    description: "Our family had a wonderful time in Busan. The tour was well organized and the guide was very helpful!"
  },
  {
    id: "2",
    image: "/images/AUG_CEB-ICN_AGT_Leaflet.jpg",
    title: "Travel Tip: What to Pack for Korea",
    description: "Don't forget to bring comfortable shoes and a power adapter! Korea is best explored on foot."
  },
  {
    id: "3",
    image: "/images/CDC_LOGO.png",
    title: "Photo Gallery: Spring in Korea",
    description: "Check out beautiful cherry blossom photos from our recent tours! (More coming soon)"
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15 } })
};

export default function TravelInfo() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Travel Info</h1>
        <section className="w-full max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            {travelInfos.map((info, i) => (
              <motion.div
                key={info.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Link href={`/travel-info/${info.id}`} className="flex bg-white rounded-xl shadow p-4 flex-col items-center hover:shadow-lg transition">
                  <Image src={info.image} alt={info.title} width={320} height={200} className="rounded mb-4 object-cover" />
                  <h3 className="text-xl font-semibold mb-2 text-center">{info.title}</h3>
                  <p className="text-gray-700 text-center">{info.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 