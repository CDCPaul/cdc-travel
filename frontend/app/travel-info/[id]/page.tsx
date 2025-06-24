import { useParams } from "next/navigation";
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

export default function TravelInfoDetailPage() {
  const params = useParams();
  const info = travelInfos.find((i) => i.id === params.id);
  if (!info) return <div className="pt-32 text-center">Travel Info not found.</div>;

  return (
    <div className="min-h-screen">
      <Navigation />
      <motion.main
        className="bg-gray-50 flex flex-col items-center pt-28 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Breadcrumbs */}
        <nav className="mb-6 w-full max-w-3xl text-sm text-gray-500 flex gap-2 items-center">
          <Link href="/" className="hover:underline">Home</Link>
          <span>&gt;</span>
          <Link href="/travel-info" className="hover:underline">Travel Info</Link>
          <span>&gt;</span>
          <span className="text-gray-700 font-semibold">{info.title}</span>
        </nav>
        <motion.section
          className="bg-white rounded-xl shadow p-6 w-full max-w-3xl flex flex-col gap-6"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold mb-2">{info.title}</h1>
          <Image src={info.image} alt={info.title} width={600} height={400} className="rounded mb-4 object-cover" />
          <p className="mb-2 text-gray-700">{info.description}</p>
        </motion.section>
      </motion.main>
    </div>
  );
} 